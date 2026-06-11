# BioBin X

**Et datadrevet system som hjelper skoler og kommuner med å redusere matsvinn, spare kostnader og samle miljødata.**

---

## Kort forklart

BioBin X er et smart system som hjelper skoler og kommuner med å:

- Redusere matavfall gjennom bevisstgjøring og gamification
- Samle verdifull data om avfallsmønstre og miljøpåvirkning
- Engasjere elever gjennom teknologi, poeng og konkurranser
- Dokumentere resultater for kommunale rapporteringskrav

**Resultat:** Mindre avfall. Lavere kostnader. Bedre miljødata.

---

## Brukerroller & Funksjoner

### Elever (student)
| Funksjon | Beskrivelse |
|----------|-------------|
| 📸 Skanne matavfall | Bruke kamera til å logge matavfall med AI-gjenkjenning |
| 🍽️ Logge avfall | Registrere vekt og type mat som kastes |
| 💰 Tjen poeng | Få 10 poeng per kg registrert |
| 🏆 Leaderboard | Se egen plassering i klassen og på skolen |
| 🧪 Live Quiz | Bli med på Kahoot-style quiz med PIN-kode |
| 📊 Personlig statistikk | Se CO₂ spart, energi produsert, og historikk |
| 🏅 Badges | Samle merker som "Første kast", "10kg", "50kg", "100kg" |

### Lærere (teacher)
| Funksjon | Beskrivelse |
|----------|-------------|
| 👩‍🎓 Administrere klasser | Opprette, redigere og slette klasser |
| 📋 Elevliste | Se alle elever i klassen med poengoversikt |
| 📈 Klassestatistikk | Grafer over avfall, CO₂, og poeng |
| 🎯 Ukentlige mål | Sette mål for klassen med bonuspoeng ved suksess |
| 🎮 Starte Live Quiz | Opprette og host Kahoot-style quiz med AI-spørsmål |
| 📤 Eksportere data | Laste ned CSV-filer med elev- og avfallsdata |
| 🤖 AI-assistent | Få hjelp til å analysere klassedata |

### Foreldre (parent)
| Funksjon | Beskrivelse |
|----------|-------------|
| 📊 Se fremgang | Følge med på barnets aktivitet og poeng |
| 🏆 Klasseligaen | Se klassens samlede resultater |

### Administratorer (admin)
| Funksjon | Beskrivelse |
|----------|-------------|
| ⚙️ Full kontroll | Tilgang til alle data og innstillinger |
| 🎁 Gi bonpoeng | Belønne enkeltelever eller hele klasser |
| 🔄 Nullstille data | Tilbakestille poeng, slette logger |
| 📊 Systemstatistikk | Oversikt over alle brukere, skoler, klasser |
| 🔧 Admin-verktøy | Spesielle verktøy for systemadministrasjon |
| ✨ Super-krefter | Hurtigvalg for å gi bonuspoeng (Lucky Winner, Miljø-Helt, Crown Jewel) |

---

## Quiz System

- **AI-genererte spørsmål** via Groq API om matsvinn, biogass og miljø
- **PIN-basert påmelding** - elever blir med ved å skrive 6-siffer PIN
- **Sanntid poengberegning** - riktig svar + hurtighet = flere poeng (opptil 1000 poeng)
- **Live resultater** - se svarfordeling og ledertavle i sanntid
- **Quiz-historiek** - alle tidligere quizzer lagres

---

## Hva er problemet?

| Problem | Konsekvens |
|---------|------------|
| 40 kg mat kastes per nordmann årlig | Metan-utslipp (25x kraftigere enn CO₂) |
| Unge mangler kunnskap | Ingen forståelse for sammenheng mat-klima |
| Kommuner mangler data | Vanskelig å måle effekten av tiltak |

---

## Løsningen

BioBin X lar elever registrere matavfall med et klikk:

| Hva skjer | Resultat |
|-----------|----------|
| Elev scanner mat | +10 poeng, +0.8 kg CO₂ spart |
| Data samles | Kommunen får oversikt |
| Engasjement økes | Klasser konkurrerer |

*Tallene er estimater basert på forskning og modeller.*

---

## For kommuner

- **Miljørapportering** - Reelle data for kommunale krav
- **Kostnadseffektivitet** - Mindre matsvinn = lavere kostnader
- **Bærekraftsmål** - Bidrar til FNs mål 12.3, 13 og 7

---

## Miljøpåvirkning (estimater)

| Per 1000 kg matavfall | Verdi |
|----------------------|-------|
| CO₂ spart | ~800 kg |
| Deponikostnad unngått | ~500 kr |

| Per skole (300 elever) / år | Verdi |
|-----------------------------|-------|
| CO₂ spart | ~1,600 kg |
| Ekvivalent med | ~20 trær plantet |

---

## Teknisk informasjon

### Tech Stack
Next.js · React · Tailwind CSS · Firebase (Auth + Firestore) · TensorFlow.js · Groq API · Vercel

### Kom i gang

```bash
git clone https://github.com/yassiraouad/BioBin-X-v3.git
cd biobin-x-v1
npm install
cp .env.example .env.local
# Fyll inn Firebase-nøkler og Groq API-nøkkel i .env.local
npm run dev
```

### Miljøvariabler (Environment Variables)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GROQ_API_KEY=your_groq_api_key
```

### Krav
- Firebase-prosjekt med Authentication og Firestore aktivert
- Groq API-nøkkel fra [console.groq.com](https://console.groq.com)

---

## Status

- Prototype utviklet (web-app)
- Funksjonell registrering av data
- AI-genererte quizzer
- Live quiz med PIN-kode
- Multi-admin støtte
- CSV-eksport
- Klar for pilot-testing

---

## Samarbeid

Interessert i å teste BioBin X? Ta kontakt!

---

## Lisens

MIT License
