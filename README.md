# 🥳 Menu di Capodanno - Planner di Votazione

Questo è un progetto web interattivo e divertente creato per decidere democraticamente il menu per la cena di Capodanno. È un'applicazione full-stack che include un'interfaccia utente dinamica, un database in tempo reale e notifiche istantanee.



## ✨ Funzionalità Principali

- **Form di Votazione Multi-step**: Un'esperienza utente guidata e ramificata che cambia le domande in base alle risposte precedenti (es. scelta tra Pizza e Menu Completo).
- **Aggiunta di Opzioni Dinamiche**: Gli utenti possono aggiungere nuovi piatti (antipasti, primi, pizze, ecc.) direttamente dall'interfaccia. Le nuove opzioni vengono salvate nel database e diventano disponibili per tutti gli altri.
- **Gestione Utenti**:
  - Identificazione tramite nome.
  - Normalizzazione dei nomi per raggruppare i voti (es. "Luca Polla" e "lucapolla" contano come "Luca").
  - Gestione dei voti duplicati: se un utente vota di nuovo, il suo voto precedente viene aggiornato, non duplicato.
  - Pre-caricamento delle scelte: se un utente ha già votato, il form viene pre-compilato con le sue scelte precedenti.
- **Pagina dei Risultati in Tempo Reale**:
  - Riepilogo delle scelte più popolari della community.
  - Visualizzazione animata delle foto dei partecipanti che fluttuano sullo sfondo.
- **Notifiche su Telegram**: Un server backend Node.js invia una notifica a una chat Telegram ogni volta che un voto viene inviato o aggiornato.
- **Funzioni di Amministrazione**: Un utente speciale ("Emanuele") ha accesso a un pulsante per resettare completamente tutti i dati (voti, piatti personalizzati, statistiche).
- **Easter Eggs**: Una pagina "segreta" per utenti specifici e piccole interazioni divertenti nell'interfaccia.
- **Animazioni Coinvolgenti**: Fuochi d'artificio in background, animazioni dei pulsanti e transizioni fluide per rendere l'esperienza più piacevole.

## 🛠️ Tecnologie Utilizzate

- **Frontend**:
  - HTML5
  - CSS3 (con animazioni e layout moderni)
  - JavaScript (ES6 Modules, Vanilla JS)
- **Backend**:
  - Node.js
  - Express.js (per creare l'endpoint delle notifiche)
  - `node-fetch` per comunicare con l'API di Telegram
- **Database**:
  - Firebase Realtime Database (per memorizzare voti, piatti personalizzati e statistiche)
- **Deployment**:
  - Il frontend può essere ospitato su qualsiasi servizio di hosting statico (es. GitHub Pages, Netlify, Vercel).
  - Il backend è configurato per essere deployato su servizi come Render o Heroku.

## 🚀 Installazione e Avvio

Per eseguire questo progetto in locale, segui questi passaggi.

### Prerequisiti

- Node.js (versione 18 o superiore)
- Un account Firebase con un progetto Realtime Database configurato.
- Un bot di Telegram e l'ID di una chat.

### 1. Clonare il Repository

```bash
git clone https://github.com/hehetzu/capodanno.git
cd capodanno
```

### 2. Configurazione del Frontend (Firebase)

1.  **Crea il file di configurazione di Firebase**:
    Nella cartella principale del progetto, rinomina il file `firebaseConfig.js.example` in `firebaseConfig.js`.

2.  **Inserisci le tue credenziali Firebase**:
    Apri il file `firebaseConfig.js` e sostituisci i segnaposto con le credenziali del tuo progetto Firebase. Le puoi trovare nella console di Firebase, nelle impostazioni del tuo progetto (`Project settings` > `General` > `Your apps` > `SDK setup and configuration`).

    ```javascript
    // firebaseConfig.js
    export const firebaseConfig = {
        apiKey: "LA_TUA_API_KEY",
        authDomain: "IL_TUO_AUTH_DOMAIN",
        databaseURL: "IL_TUO_DATABASE_URL",
        // ... e così via
    };
    ```

3.  **Avvia il frontend**:
    Il modo più semplice per eseguire il frontend è usare un server di sviluppo locale. Se usi Visual Studio Code, puoi installare l'estensione Live Server e cliccare su "Go Live" in basso a destra.

### 3. Configurazione del Backend (Notifiche Telegram)

Il backend è un piccolo server Node.js che gestisce l'invio di notifiche a Telegram.

1.  **Installa le dipendenze**:
    Dalla cartella principale del progetto, esegui:
    ```bash
    npm install
    ```

2.  **Crea il file di ambiente**:
    Rinomina il file `.env.example` in `.env`.

3.  **Inserisci le tue credenziali Telegram**:
    Apri il file `.env` e inserisci il token del tuo bot e l'ID della chat di destinazione.

    ```env
    # .env
    TELEGRAM_BOT_TOKEN=IL_TUO_TOKEN_SEGRETO
    TELEGRAM_CHAT_ID=L_ID_DELLA_TUA_CHAT
    ```

4.  **Avvia il server**:
    ```bash
    npm start
    ```

Il server sarà in ascolto sulla porta 3000. Ora, ogni volta che un voto viene confermato tramite l'interfaccia web, il server invierà una notifica alla tua chat di Telegram.