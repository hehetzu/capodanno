// config.js

// Mappa per normalizzare i nomi degli utenti.
// La chiave è la variante del nome (tutto in minuscolo),
// il valore è il nome "ufficiale" che vuoi che appaia nei risultati.
export const nameNormalizationMap = {
    // Varianti per Anna (include Annachiara)
    'anna': 'Anna',
    'annachiara': 'Anna',
    'anna chiara': 'Anna',
    
    // Varianti per Emanuele
    'emanuele': 'Emanuele',

    // Nomi senza varianti (aggiunti per coerenza)
    'giada': 'Giada',
    'giulia': 'Giulia',
    'cagacazzo': 'Giulia',
    'marta': 'Marta',

    // Varianti per Matteo
    'matteo': 'Matteo',

    // Varianti per Luca
    'luca': 'Luca',
    'lucapolla': 'Luca',
    'luca polla': 'Luca',

    // Varianti per Dama (include Lorenzo)
    'dama': 'Dama',
    'damato': 'Dama',
    "d' amato": 'Dama',
    'lorenzo': 'Dama',
    'lori': 'Dama',
    
    // Varianti per Saba
    'saba': 'Saba',
    'sabatino': 'Saba',
    'alessio': 'Saba',
    
    // Varianti per Rocco
    'rocco': 'Rocco',
    
    // Aggiungi qui altre varianti che vuoi unificare
    // 'variante': 'NomeUfficiale'
};

// Mappa per associare il nome "ufficiale" dell'utente al nome del file della sua foto.
// La chiave è il nome ufficiale (case-sensitive, es. "Annachiara"),
// il valore è il nome del file senza estensione (es. 'annachiara').
export const userPhotoMap = {
    // Nomi Utente -> Nome File Foto
    'Anna': 'anna',
    'Giada': 'giada',
    'Giulia': 'giulia',
    'Marta': 'marta',
    'Emanuele': 'emanuele',
    'Matteo': 'matteo',
    'Luca': 'luca',
    'Dama': 'dama',
    'Saba': 'saba',
    'Rocco': 'rocco',
    
    // Aggiungi qui tutti gli altri utenti
    // 'NomeUfficiale': 'nomefilefoto',
    
    // Ospite e default
    'Ospite': 'default',
};