// config.js
// Questo file è la "sorgente unica di verità" per gestire eccezioni nei nomi dei file.
// Per far funzionare tutto correttamente, i nomi dei file delle foto devono essere
// tutti in minuscolo (es. 'giulia.webp', 'matteo.webp', 'luca.webp').
// In questo modo, la logica di default funziona e questa lista può rimanere vuota.

export const specialFileNames = {
    // Esempio: se il file di 'anna' si chiamasse 'foto_di_anna.webp',
    // la regola sarebbe: 'anna': 'foto_di_anna'
    // Al momento, con i file standardizzati in minuscolo, non servono regole speciali.
};