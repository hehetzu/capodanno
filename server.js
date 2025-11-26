const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Importa il pacchetto CORS

const app = express();
const port = 3000;

// --- CONFIGURAZIONE ---
// ATTENZIONE: Inserisci qui le tue vere credenziali di Telegram.
const TELEGRAM_BOT_TOKEN = "IL_TUO_TOKEN_SEGRETO_DAL_BOTFATHER";
const TELEGRAM_CHAT_ID = "L_ID_DELLA_TUA_CHAT";

// --- MIDDLEWARE ---
// Abilita CORS per permettere al tuo script (in esecuzione su un'altra origine) di comunicare con questo server.
app.use(cors()); 
// Middleware per leggere il corpo delle richieste in formato JSON
app.use(express.json());


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