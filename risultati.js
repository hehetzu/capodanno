import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// --- INIZIO CONFIGURAZIONE FIREBASE ---
// IMPORTANTE: Sostituisci questo oggetto con la configurazione del tuo progetto Firebase!
const firebaseConfig = {
    apiKey: "AIzaSyBUY-spueXuNmiUew_83Ww3BzP2_kQ0wT0",
    authDomain: "manu-dbc85.firebaseapp.com",
    databaseURL: "https://manu-dbc85-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "manu-dbc85",
    storageBucket: "manu-dbc85.firebasestorage.app",
    messagingSenderId: "1081477129666",
    appId: "1:1081477129666:web:e483d7ab2a26e5ed5ca25b",
    measurementId: "G-E1MNRMW7M5"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// --- FINE CONFIGURAZIONE FIREBASE ---


document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayStatsSummary();
    showVoterAvatars(); // Aggiunta chiamata per mostrare le foto
});

// Funzione per ottenere il percorso della foto in base al nome
const getPhotoForUser = (name) => {
    const lowerCaseName = name.toLowerCase();
    // Mappa dei nomi (in minuscolo) ai file delle foto
    const photoMap = {
        'emanuele': 'Emanuele.png',
        'dama': 'Dama.png',
    'damato': 'Dama.png',
    'lorenzo': 'Dama.png',
        'giada': 'Giada.png',
        'giulia': 'Giulia.png',
        'luca': 'Luca.png',
    'lucapolla': 'Luca.png',
    'luca polla': 'Luca.png',
        'marta': 'Marta.png',
        'matteo': 'Matteo.png',
        'rocco': 'Rocco.png',
        'saba': 'Saba.png',
        'sabatino': 'Saba.png',
        'alessio': 'Saba.png',
        'anna': 'Anna.png',
        'annachiara': 'Anna.png',
        'anna chiara': 'Anna.png'
    };
    // Se il nome è nella mappa, restituisce il percorso, altrimenti usa la foto di default
    return `photos/${photoMap[lowerCaseName] || 'Default.jpg'}`;
};

// Funzione per mostrare le foto dei votanti nella barra in alto
const showVoterAvatars = async () => {
    const container = document.getElementById('background-avatars');
    const contentBox = document.querySelector('.container');
    if (!contentBox) return;

    const contentRect = contentBox.getBoundingClientRect();

    try {
        const ordersRef = ref(db, 'orders');
        const snapshot = await get(ordersRef);
        const voterNames = new Set();

        if (snapshot.exists()) {
            const orders = snapshot.val();
            Object.values(orders).forEach(order => {
                if (order.userName) voterNames.add(order.userName);
            });
        }

        // Per ogni votante unico, crea un'immagine e la posiziona casualmente
        voterNames.forEach(name => {
            const img = document.createElement('img');
            img.src = getPhotoForUser(name);
            img.alt = `Foto di ${name}`;
            img.title = name;
            img.className = 'scattered-avatar';

            // Aggiunge l'evento click per aprire la foto ingrandita
            img.addEventListener('click', () => {
                openLightbox(img.src, name);
            });

            // Decide casualmente se posizionare la foto a sinistra o a destra del contenuto
            const placeOnLeft = Math.random() < 0.5;
            let randomLeft;
            const photoWidth = 200; // Aggiornata alla nuova larghezza della foto

            if (placeOnLeft) {
                // Posiziona a sinistra del contenuto
                const maxLeft = contentRect.left - photoWidth - 10; // 10px di margine
                randomLeft = Math.random() * Math.max(0, maxLeft);
            } else {
                // Posiziona a destra del contenuto
                const minLeft = contentRect.right + 10; // 10px di margine
                const maxLeft = window.innerWidth - photoWidth;
                randomLeft = minLeft + (Math.random() * Math.max(0, maxLeft - minLeft));
            }

            const randomTop = Math.random() * (window.innerHeight - photoWidth);

            img.style.top = `${randomTop}px`;
            img.style.left = `${randomLeft}px`;
            img.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;

            container.appendChild(img);
        });

    } catch (error) {
        console.error("Errore nel caricare i votanti:", error);
    }
};

// Funzione per impostare la logica del Lightbox (apertura/chiusura)
const setupLightbox = () => {
    // Questa funzione non è più necessaria, la logica è stata spostata.
};

// Funzione per aprire il lightbox con una specifica immagine e nome
const openLightbox = (src, caption) => {
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxContent = document.getElementById('lightbox-content');

    document.getElementById('lightbox-image').src = src;
    document.getElementById('lightbox-caption').textContent = caption;
    lightboxOverlay.classList.add('visible');

    // Funzione per chiudere il lightbox
    const closeLightbox = () => {
        lightboxOverlay.classList.remove('visible');
        // Rimuove i listener per evitare accumuli
        lightboxOverlay.removeEventListener('click', closeLightbox);
        lightboxContent.removeEventListener('click', stopPropagation);
    };

    const stopPropagation = (e) => e.stopPropagation();

    // Aggiunge i listener solo quando il lightbox è aperto
    lightboxOverlay.addEventListener('click', closeLightbox);
    lightboxContent.addEventListener('click', stopPropagation);
};
/**
 * Carica e mostra il riepilogo delle statistiche pre-calcolate da Firebase.
 */
const loadAndDisplayStatsSummary = async () => {
    const statsContainer = document.getElementById('stats-summary');
    
    try {
        const statsRef = ref(db, 'stats');
        const snapshot = await get(statsRef);
        let stats = {};
        if (snapshot.exists()) {
            stats = snapshot.val();
        }

        if (Object.keys(stats).length === 0) {
            statsContainer.innerHTML = `<h2>Menu più votato</h2><p>Nessun voto ancora registrato. Sii il primo a votare!</p>`;
            return;
        }

        const getTopVotedItem = (field) => {
            const counts = stats[field] || {};
            if (!counts || Object.keys(counts).length === 0) return "Nessun voto";

            const sortedChoices = Object.entries(counts)
                .sort(([, a], [, b]) => b - a);
            
            return sortedChoices[0] ? sortedChoices[0][0] : "Nessun voto"; // Ritorna solo il nome del vincitore
        };

        const getMainChoiceWinner = () => {
            const counts = stats.main_choice || { pizza: 0, dolce: 0 };
            // 'dolce' rappresenta il menu completo
            return (counts.pizza || 0) >= (counts.dolce || 0) ? 'pizza' : 'dolce';
        };

        const winner = getMainChoiceWinner();
        let statsHtml = '';

        if (winner === 'pizza') {
            const topPizzaLocation = getTopVotedItem('pizza_location').replace('fatta_in_casa', 'Fatta in casa').replace('asporto', 'Da asporto');
            const topPizzaFlavor = getTopVotedItem('pizza_flavor');
            const topDessert = getTopVotedItem('dessert');

            statsHtml = `<h2>La community ha scelto... Pizza! 🍕</h2>
                         <ul>
                            <li><strong>Tipo:</strong> ${topPizzaLocation}</li>
                            <li><strong>Gusto:</strong> ${topPizzaFlavor}</li>
                            <li><strong>Dolce:</strong> ${topDessert}</li>
                         </ul>`;

        } else { // Il vincitore è il menu completo
            const topAntipasto = getTopVotedItem('antipasto');
            const topPrimo = getTopVotedItem('primo');
            const topSecondo = getTopVotedItem('secondo');
            const topDessert = getTopVotedItem('dessert');

            statsHtml = `<h2>La community ha scelto... Menu Completo! 🍝</h2>
                         <ul>
                            <li><strong>Antipasto:</strong> ${topAntipasto}</li>
                            <li><strong>Primo:</strong> ${topPrimo}</li>
                            <li><strong>Secondo:</strong> ${topSecondo}</li>
                            <li><strong>Dolce:</strong> ${topDessert}</li>
                         </ul>`;
        }

        statsContainer.innerHTML = statsHtml;

    } catch (error) {
        console.error("Errore nel caricare le statistiche: ", error);
        statsContainer.innerHTML = `<h2>Oops!</h2><p>Non è stato possibile caricare le statistiche. Riprova più tardi.</p>`;
    }
};