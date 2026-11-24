# Auth-tjänst – uppgift 1

Fristående Spring Boot-tjänst på port 8081. PostgreSQL-databasen `auth_db` innehåller användarkonton. Projektet använder samma Spring Boot-version (3.2.5) och Java-version (17) som de befintliga Spring-tjänsterna.

## Kodstruktur

- `controller/UserController` tar emot HTTP-anrop.
- `dto` innehåller register/login-indata och ett användarsvar med id, username och role.
- `service/UserService` kontrollerar användarnamn, hashning och inloggning.
- `repository/UserRepository` läser och skriver konton med JPA.
- `entity/User` och `entity/Role` beskriver databasinnehållet.
- `config/PasswordConfig` skapar BCrypt-verktyget.
- `exception/ApiExceptionHandler` översätter fel till JSON och HTTP-status.

Flödet är JSON → controller → DTO → service → repository → PostgreSQL. Svaret går genom UserResponse tillbaka till JSON. Lösenordshashen stannar på serversidan.

## Starta i IntelliJ

1. Lägg till `auth-service/pom.xml` som Maven-projekt (högerklicka filen och välj Add as Maven Project).
2. Använd JDK 17 i projektet och Maven.
3. Skapa en egen databas i PostgreSQL som användaren `journal` äger. Kör följande SQL en gång, som en databasadministratör.

```sql
CREATE DATABASE auth_db OWNER journal;
```

4. Lägg miljövariabeln `SPRING_DATASOURCE_PASSWORD` i körkonfigurationen för `AuthApplication`. Ange lösenordet till din PostgreSQL-användare. Om adress eller användare skiljer sig, sätt även `SPRING_DATASOURCE_URL` och `SPRING_DATASOURCE_USERNAME`.
5. Kör `AuthApplication`. API:t nås på `http://localhost:8081/api/auth`.

Med installerad Maven och JDK 17 kan du också köra `mvn spring-boot:run` från denna mapp. Hibernate skapar tabellen i den befintliga databasen vid starten.

## API-kontrakt

Registrering, `POST /api/auth/register` (201).

```json
{"username":"test.patient","password":"TestPassword123!","role":"PATIENT"}
```

Rollerna är `PATIENT`, `DOCTOR` och `PRACTITIONER` (övrig personal). Användarnamn innehåller bokstäver a–z, siffror eller `._@+-`, maximalt 100 tecken. De sparas med små bokstäver och är unika oavsett skiftläge. Lösenord måste ha 8–72 tecken och får vara högst 72 UTF-8-byte.

Inloggning, `POST /api/auth/login` (200).

```json
{"username":"test.patient","password":"TestPassword123!"}
```

Hämta användare, `GET /api/auth/users/1` (200). Alla tre anrop returnerar samma profilformat.

```json
{"id":1,"username":"test.patient","role":"PATIENT"}
```

Fel returneras som `{"message":"..."}` med status 400 (ogiltig indata), 401 (fel inloggning), 404 (saknad användare) eller 409 (upptaget användarnamn).

## Koppling till partnerns tjänster

Auth-tjänsten äger konton och användar-id. Journal-tjänstens Patient och Practitioner har redan ett `userId`. När en patient/personalprofil skapas där ska `userId` vara id:t från auth-svaret. Meddelandetjänstens senderId/receiverId använder samma id:n. Övriga tjänster kan hämta användaren via `GET /api/auth/users/{id}`. De ska anropa API:t i stället för att läsa auth-databasen.

Inloggningen följer person B-planens kontrakt och returnerar en användarprofil. Session/JWT och gemensam åtkomstkontroll återstår att bestämma och koppla in vid slutmonteringen. Användarhämtningen är för närvarande öppen och personalroller kan väljas vid registrering. API:t skapar endast kontot. Patient- och personalprofiler skapas genom journal-tjänsten. Den uppdelningen behöver kopplas ihop med frontend tillsammans med partnern.

## Tester

Kör `mvn test` i denna mapp. AuthApiTest startar en riktig HTTP-server och testar API:t mot en isolerad H2-databas i PostgreSQL-läge. Det täcker registrering → inloggning → hämtning, tre roller, validering, felaktigt lösenord, lösenordshashning, saknad användare och samtidiga registreringar.

Importera även `postman/auth-service.postman_collection.json` i Postman och kör hela samlingen med Collection Runner mot den startade tjänsten. Standardvärdet `baseUrl` är `http://localhost:8081`. Samlingen skapar ett unikt fiktivt konto, loggar in, hämtar profilen och kontrollerar felvägar. Använd vid behov en annan baseUrl i samlingens variabler.

Dockerfile finns i tjänstens huvudmapp och Kubernetes-konfigurationen finns i k8s-mappen. Bygg- och körinstruktioner finns i [Kubernetes-guiden](../k8s/README.md).

## Genomförd verifiering

Den 24 november 2026 gick `mvn verify` igenom med 9 API-tester. Bygget gjordes med IntelliJ-installationens Java 21 och kompilerades för Java 17. Den byggda tjänsten kördes även på Java 17 mot en separat PostgreSQL 15-databas. Postman-samlingen kördes med Newman och samtliga 7 anrop och 15 kontroller godkändes. Registrering av alla tre roller och inloggning/hämtning med samma användar-id efter omstart verifierades också. Testcontainrarna och den tillfälliga databasen avslutades efter kontrollen.
