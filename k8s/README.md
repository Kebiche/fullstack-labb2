# Uppgift 3 – Docker och Kubernetes

Auth- och bildtjänsten har egna Dockerfiles och varsin k8s-mapp. De körs i ett lokalt kind-kluster med namespace `lab2`. På den här datorn är klustret och de tre ordinarie poddarna redan startade. Börja med steg 6 för att ansluta till API:erna. Steg 2–5 beskriver installationen på nytt.

## Filer och ansvar

| Fil | Uppgift |
|---|---|
| `auth-service/Dockerfile` | Paketerar den byggda Spring Boot-jar-filen med Java 17 |
| `image-service/Dockerfile` | Installerar Node-beroenden och typsnitt och startar bildtjänsten med Node 24 |
| `.dockerignore` i tjänsternas mappar | Filtrerar bort lokala filer från Docker-bygget |
| `k8s/namespace.yaml` | Skapar den gemensamma gruppen lab2 i klustret |
| `auth-service/k8s/deployment.yaml` | Kör auth-tjänsten |
| `auth-service/k8s/service.yaml` | Ger adressen auth-service:8081 |
| `auth-service/k8s/database-deployment.yaml` | Kör PostgreSQL för auth_db |
| `auth-service/k8s/database-service.yaml` | Ger databasadressen auth-db:5432 |
| `auth-service/k8s/database-storage.yaml` | Beställer beständig lagring för PostgreSQL |
| `image-service/k8s/deployment.yaml` | Kör bildtjänsten och anger övriga tjänsters adresser |
| `image-service/k8s/service.yaml` | Ger adressen image-service:3001 |
| `image-service/k8s/storage.yaml` | Beställer beständig lagring för bilder och SQLite |

En Deployment beskriver hur programmet körs. En Service ger det en stabil adress. En PersistentVolumeClaim beställer lagring som finns kvar när en pod ersätts.

## 1. Verktyg och projektmapp

Starta Docker Desktop. Du behöver kubectl och kind. På den här datorn finns kind på följande sökväg. Ange variabeln i terminalen där du kör kind-kommandona.

```powershell
$kind = "$env:LOCALAPPDATA\Programs\kind\kind.exe"
```

På en annan dator installerar du kind enligt [den officiella installationsguiden](https://kind.sigs.k8s.io/docs/user/quick-start/) och använder din installations sökväg.

Kör kommandona nedan från projektets huvudmapp, där mapparna auth-service och image-service ligger.

## 2. Skapa lokalt kluster första gången

```powershell
& $kind create cluster --name lab2 --image kindest/node:v1.36.4 --wait 120s
kubectl --context kind-lab2 get nodes
```

Om klustret redan finns börjar du med steg 3. Docker Desktop visar kind-noden som containern `lab2-control-plane`. Kubernetes-poddarna visas med kubectl.

## 3. Bygg Docker-images

Bygg först auth-tjänstens jar-fil. I IntelliJ väljer du auth-service → Maven → Lifecycle → package. Med Maven och JDK 17 eller 21 i terminalen kan du använda följande kommando.

```powershell
mvn -f auth-service/pom.xml verify
```

Bygg sedan images från huvudmappen.

```powershell
docker build -t auth-service:lab2 ./auth-service
docker build -t image-service:lab2 ./image-service
docker pull postgres:15
docker image save --platform=linux/amd64 -o "$env:TEMP\lab2-images.tar" auth-service:lab2 image-service:lab2 postgres:15
& $kind load image-archive "$env:TEMP\lab2-images.tar" --name lab2
```

Arkivet innehåller datorns Linux/AMD64-images och fungerar med Docker Desktops image-lagring. Dockerfilen för auth kopierar `target/auth-service-0.0.1-SNAPSHOT.jar`. Bygg om jar-filen efter ändringar i Java-koden.

## 4. Skapa namespace och databaslösenord

```powershell
kubectl --context kind-lab2 apply -f k8s/namespace.yaml
kubectl --context kind-lab2 -n lab2 create secret generic auth-db-secret --from-literal=password=ValjEttLokaltLosenord
```

Byt exempelvärdet mot ett eget lösenord. Kubernetes skickar samma värde till PostgreSQL och auth-tjänsten. Secret skapas första gången och lagras i klustret. Behåll samma lösenord när du använder en befintlig databasvolym.

## 5. Starta tjänsterna

```powershell
kubectl --context kind-lab2 apply -f auth-service/k8s/
kubectl --context kind-lab2 apply -f image-service/k8s/
kubectl --context kind-lab2 -n lab2 rollout status deployment/auth-db --timeout=180s
kubectl --context kind-lab2 -n lab2 rollout status deployment/auth-service --timeout=240s
kubectl --context kind-lab2 -n lab2 rollout status deployment/image-service --timeout=180s
kubectl --context kind-lab2 -n lab2 get pods,services,pvc
```

Poddarna ska visa READY 1/1. De två lagringsbeställningarna ska visa Bound.

## 6. Använd API:erna från datorn

Öppna två terminaler och låt kommandona fortsätta köra.

Första terminalen gör auth-API:t tillgängligt på localhost:8081.

```powershell
kubectl --context kind-lab2 -n lab2 port-forward service/auth-service 8081:8081
```

Andra terminalen gör bild-API:t tillgängligt på localhost:3001.

```powershell
kubectl --context kind-lab2 -n lab2 port-forward service/image-service 3001:3001
```

Importera tjänsternas Postman-samlingar för att testa API:erna. Samlingarnas standardadresser matchar portarna ovan. För hela bildscenariot behöver även journal-tjänsten och dess databas vara startade i klustret. Lägg då till dess port-forward på 8082.

## Koppling till partnerns tjänster

Bildtjänsten anropar `http://auth-service:8081` och `http://journal-service:8082` inne i samma namespace. Partnerns journal-Service behöver därför heta `journal-service` och exponera port 8082, eller så ändrar ni JOURNAL_SERVICE_URL i bildtjänstens Deployment.

Auth-tjänsten använder sin egen PostgreSQL-databas via `auth-db:5432`. Patientprofiler och journaler hanteras av journal-tjänsten. Meddelande- och söktjänsterna läggs till med egna Deployment- och Service-filer när ni monterar ihop hela labben.

## Lagring och omstart

PostgreSQL använder volymen auth-db-data. Bildfiler och SQLite ligger tillsammans på image-data, under /data. Därför används en instans och Recreate för bildtjänsten. Den gamla podden avslutas innan ersättaren startas.

Du kan starta om tjänsterna med följande kommando.

```powershell
kubectl --context kind-lab2 -n lab2 rollout restart deployment/auth-service deployment/image-service
```

Vid podbyte finns data kvar på volymerna. Om du tar bort själva kind-klustret försvinner dess lokala lagring. [Kubernetes dokumentation om beständig lagring](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

Efter kodändringar bygger du om berörd image, exporterar och laddar in den enligt steg 3 och startar om dess Deployment. Port-forward behöver startas igen när den podden ersatts.

## Se status och loggar

```powershell
kubectl --context kind-lab2 -n lab2 get pods
kubectl --context kind-lab2 -n lab2 logs deployment/auth-service
kubectl --context kind-lab2 -n lab2 logs deployment/image-service
kubectl --context kind-lab2 -n lab2 describe pod PODDNAMN
```

Läs gärna guiden tillsammans med YAML-filerna. De använder vanliga Deployment-, Service- och PersistentVolumeClaim-resurser.

## Genomförd verifiering

Den 24 november 2026 byggdes båda Docker-images och kördes i ett lokalt kind-kluster med Kubernetes 1.36.4. I namespace lab2 kör auth-service, auth-db och image-service med READY 1/1. Volymerna auth-db-data och image-data visar Bound.

Ett isolerat testnamespace användes för att köra samma manifest tillsammans med den befintliga journal-tjänsten. Samtliga 13 Postman-anrop och 22 kontroller godkändes. Testet verifierade riktiga pixlar för text, linje och rektangel i Linux-imagen. Därefter ersattes databasens, auth-tjänstens och bildtjänstens poddar. Kontot kunde fortfarande logga in, SQLite visade version 2 och bildfilens SHA-256 var identisk. Testnamespace och port-forward-processer avslutades efter verifieringen.

Den ordinarie namespace lab2 innehåller dina två tjänster och auth-databasen. Journal-, sök-, meddelande- och frontendtjänsterna läggs till vid gruppens slutmontering. Bildtjänstens fullständiga API-flöde behöver journal-tjänsten enligt integrationsavsnittet ovan.
