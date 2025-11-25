require('dotenv').config(); // Carica le variabili dal file .env all'inizio dello script
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Importa il pacchetto CORS

const app = express();
const port = process.env.PORT || 3000; // Render userà la sua variabile PORT

// --- CONFIGURAZIONE ---
// Le credenziali vengono lette dalle variabili d'ambiente.
// In locale, le prenderà dal file .env. Su Render, le prenderà dalle impostazioni del servizio.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// --- MIDDLEWARE ---
// Abilita CORS per permettere al tuo script (in esecuzione su un'altra origine) di comunicare con questo server.
app.use(cors()); 
// Middleware per leggere il corpo delle richieste in formato JSON
app.use(express.json());

// --- ENDPOINT PER LA CONFIGURAZIONE DI FIREBASE ---
// Questo endpoint invia al client solo le chiavi pubbliche necessarie per inizializzare Firebase.
app.get('/firebase-config', (req, res) => {
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    };
    res.json(firebaseConfig);
});

// --- ENDPOINT PER LA NOTIFICA ---
// Questo endpoint riceve la richiesta dal file script.js
app.post('/send-telegram-notification', async (req, res) => {
    // Il messaggio arriva già formattato dal frontend

// --- ENDPOINT PER LA NOTIFICA ---
// Questo endpoint riceve la richiesta dal file script.js
app.post('/send-telegram-notification', async (req, res) => {
    // Il messaggio arriva già formattato dal frontend
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Il messaggio non può essere vuoto.' });
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown', // Permette di usare formattazione come *grassetto*
            }),
        });

        const result = await response.json();

        if (result.ok) {
            console.log('Messaggio inviato a Telegram:', result);
            res.status(200).json({ success: true, message: 'Notifica inviata.' });
        } else {
            console.error('Errore dall\'API di Telegram:', result);
            res.status(500).json({ success: false, message: 'Errore API Telegram.', details: result });
        }
    } catch (error) {
        console.error('Errore durante l\'invio a Telegram:', error);
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});

// --- AVVIO DEL SERVER ---
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}. In attesa di notifiche...`);
});