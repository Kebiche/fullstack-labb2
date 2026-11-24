# Bildtjänst – uppgift 2

Node.js/Express-tjänst på port 3001. Multer tar emot uppladdningen. Sharp läser och bearbetar bilden. Bildfiler sparas i `uploads/` och metadata i SQLite-filen `data/images.sqlite`.

## Kodstruktur

- `src/server.js` startar servern och stänger databasen vid avslut.
- `src/app.js` kopplar ihop tjänstens delar.
- `src/config.js` läser inställningar från miljövariabler.
- `src/controllers/imageController.js` innehåller de fyra API-adresserna, tar emot uppladdningen och skickar svar.
- `src/services/imageService.js` hanterar patientkoppling, bildfiler och metadata.
- `src/services/imageProcessingService.js` konverterar bilder och ritar text, linjer och rektanglar med Sharp.
- `src/repositories/imageRepository.js` innehåller SQL-frågorna mot SQLite.
- `src/clients/` anropar auth- och journal-tjänsten.
- `src/middleware/` hanterar inloggning, roller och fel.
- `src/validation/` kontrollerar id:n och annoteringarnas innehåll.

Flödet är controller → service → repository/bildfiler. Externa API-anrop går genom klienterna.

## Starta

Använd Node.js 22.13 eller senare. Den versionen behövs för den inbyggda SQLite-modulen. Starta även auth-tjänsten på 8081 och journal-tjänsten på 8082 med deras databaser.

Öppna en terminal i `image-service` och kör följande.

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

Kopiera `.env.example` första gången. Inställningarna i `.env` läses av startkommandot. Om tjänsterna använder andra adresser ändrar du `AUTH_SERVICE_URL` och `JOURNAL_SERVICE_URL`. Standardadressen för bild-API:t är `http://localhost:3001/api/images`.

## Inloggning och roller

Välj Basic Auth i Postman och ange användarnamn/lösenord från auth-tjänsten. Bildtjänsten skickar dessa till `POST /api/auth/login` och använder rollen i svaret. Den befintliga auth-tjänsten returnerar användarprofiler. Basic Auth är integrationsvalet för denna uppgift. Vid gemensam JWT/session behöver autentiseringsmiddleware anpassas till gruppens kontrakt.

- `DOCTOR` kan ladda upp, läsa och annotera bilder.
- `PRACTITIONER` kan ladda upp och läsa bilder.
- `PATIENT` kan läsa bilder vars patientprofil i journal-tjänsten har samma `userId` som kontot.

Patient-id är det numeriska `id` som returneras av journal-tjänsten. `userId` är kontots id från auth-tjänsten. Vid uppladdning och läsning kontrolleras patienten genom `GET /api/patients/{id}`. Om en beroende tjänst inte svarar returneras ett fel.

## Ladda upp

`POST /api/images` tar emot multipart/form-data med följande fält.

| Fält | Typ | Innehåll |
|---|---|---|
| `patientId` | Text | Befintligt patient-id från journal-tjänsten |
| `image` | File | PNG, JPEG eller WebP |

Gränsen är 10 MB och 20 megapixlar per bild. Filinnehållet kontrolleras med Sharp. Bilden orienteras efter kamerans orienteringsuppgifter och sparas som PNG. Animerade bilder avvisas.

Svaret har status 201 och innehåller bildens metadata, bland annat följande.

```json
{
  "id": "bildens-uuid",
  "patientId": 1,
  "originalName": "patient.png",
  "contentType": "image/png",
  "width": 320,
  "height": 160,
  "version": 1,
  "createdBy": 2,
  "updatedBy": 2,
  "createdAt": "2026-11-24T18:00:00.000Z",
  "updatedAt": "2026-11-24T18:00:00.000Z",
  "url": "/api/images/bildens-uuid"
}
```

## Lista och hämta

`GET /api/images?patientId=1` returnerar metadata för patientens bilder som en JSON-lista.

`GET /api/images/{id}` returnerar själva PNG-bilden. Headern `X-Image-Version` visar dess version. Bildsvar har `Cache-Control: no-store` så att webbläsaren hämtar aktuell information.

## Annotera som läkare

Skicka JSON till `PUT /api/images/{id}/annotate` med en lista med annoteringar. Fältet version är valfritt.

```json
{
  "annotations": [
    {
      "type": "text",
      "x": 15,
      "y": 10,
      "text": "Fiktivt fynd",
      "fontSize": 20,
      "color": "#ff0000"
    },
    {
      "type": "line",
      "x1": 20,
      "y1": 110,
      "x2": 150,
      "y2": 110,
      "color": "#0000ff",
      "strokeWidth": 4
    },
    {
      "type": "rectangle",
      "x": 230,
      "y": 20,
      "width": 60,
      "height": 40,
      "color": "#00ff00",
      "strokeWidth": 4
    }
  ]
}
```

Koordinater anges i bildpixlar från övre vänstra hörnet. `x` och `y` anger textens eller rektangelns startpunkt. Färger anges som `#rrggbb`. Text kan ha högst 200 tecken, fontSize 8–128 och strokeWidth 1–20. Ett anrop kan innehålla 1–100 annoteringar. Flera linjer kan användas för en sammanhängande ritning.

Ett lyckat svar är 200 med uppdaterad metadata och höjd version. Hämta bilden igen för att se resultatet. Ytterligare annoteringar ritas ovanpå den senast sparade bilden. Tjänsten kontrollerar internt att samtidiga ändringar inte skriver över varandra. Vid 409 hämtar klienten bilden igen och skickar ett nytt försök. Klienten kan även ange version för att kräva en viss utgångsversion.

## Lagring

Varje lyckad ändring skriver en ny PNG-fil innan databaspekaren byts. Tidigare bildfiler behålls i uploads, så att pågående läsningar kan slutföras. Ett misslyckat databasbyte städar bort den nya filen. Metadata innehåller bildens aktuella version, patient-id och vem som laddade upp/ändrade bilden.

SQLite och uploads behöver beständig lagring när tjänsten flyttas till Kubernetes i uppgift 3. Denna lokala SQLite-lösning är avsedd för en instans av bildtjänsten.

## Tester

```powershell
npm test
```

API-testerna använder riktiga HTTP-anrop och separata tillfälliga SQLite-databaser. Testernas auth- och journalservrar följer de befintliga API-kontrakten. Tester kontrollerar även verkliga bildpixlar, behörigheter, ogiltiga bilder, storleksgränser, samtidiga ändringar, fel under lagring och att data finns kvar när appen öppnas igen.

Importera `postman/image-service.postman_collection.json` i Postman och kör samlingen i ordning med Collection Runner. I anrop 4 väljer du `postman/fixtures/patient-demo.png` som fil. Samlingens variabler anger adresserna till de tre tjänsterna.

Scenariot registrerar fiktiva konton, skapar en patientprofil, laddar upp/listar/hämtar en bild och lägger till text/linje/rektangel. Det kontrollerar även läsning som patient, nekad patientredigering, versionskonflikt och felaktig inloggning.

## Genomförd verifiering

Den 24 november 2026 gick samtliga 18 Node-API-tester igenom. Postman-samlingen kördes med Newman mot projektets riktiga auth- och journal-tjänster på Java 17 med separata PostgreSQL-databaser. Alla 13 anrop och 22 kontroller godkändes. Bildtjänsten kördes med Node.js 26.13 och SQLite. Efter att bildprocessen avslutats och startats igen var bildens SHA-256 identisk och metadata visade fortfarande version 2. De tillfälliga processerna och testcontainrarna avslutades efter testet.

## Docker och Kubernetes

Dockerfile paketerar tjänsten med Node 24 och typsnitt för bildtext. I k8s-mappen finns Deployment, Service och beständig lagring. Se [Kubernetes-guiden](../k8s/README.md) för byggkommandon, lokalt kluster och anslutning till partnerns tjänster.
