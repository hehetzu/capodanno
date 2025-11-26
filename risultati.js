import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { nameNormalizationMap, userPhotoMap } from './config.js'; // Importa le mappe corrette

// --- CONFIG FIREBASE ---
// ATTENZIONE: Inserisci qui le tue vere credenziali Firebase.
const firebaseConfig = {
    apiKey: "LA_TUA_API_KEY",
    authDomain: "IL_TUO_AUTH_DOMAIN",
    databaseURL: "IL_TUO_DATABASE_URL",
    projectId: "IL_TUO_PROJECT_ID",
    storageBucket: "IL_TUO_STORAGE_BUCKET",
    messagingSenderId: "IL_TUO_SENDER_ID",
    appId: "LA_TUA_APP_ID",
    measurementId: "IL_TUO_MEASUREMENT_ID"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- FUNZIONI UTILITY ---

// Normalizza il nome utente usando la mappa di configurazione
const getNormalizedUserName = (rawName) => {
    if (!rawName) return 'Ospite';
    const cleanName = rawName.trim().toLowerCase();
    return nameNormalizationMap[cleanName] || rawName;
};

// Ottiene il percorso della foto per un dato nome utente normalizzato
const getPhotoForUser = (name) => {
    // Cerca il nome utente nella mappa delle foto. Se non lo trova, usa 'default'.
    const fileName = userPhotoMap[name] || 'default';
    // Restituisce un oggetto con i percorsi possibili
    return {
        webp: `photos/${fileName}.webp`,
        png: `photos/${fileName}.png`,
        fallback: `photos/default.webp`
    };
};

// --- LIGHTBOX ---
const openLightbox = (src, caption) => {
    const overlay = document.getElementById('lightbox-overlay');
    const content = document.getElementById('lightbox-content');
    document.getElementById('lightbox-image').src = src;
    document.getElementById('lightbox-caption').textContent = caption;
    overlay.classList.add('visible');

    const close = () => {
        overlay.classList.remove('visible');
        overlay.removeEventListener('click', close);
        content.removeEventListener('click', stop);
    };
    const stop = e => e.stopPropagation();
    overlay.addEventListener('click', close);
    content.addEventListener('click', stop);
};

// --- POSIZIONE CASUALE ---
const getRandomPosition = (img, contentRect) => {
    const iw = img.offsetWidth;
    const ih = img.offsetHeight;
    const maxTop = window.innerHeight - ih;
    const top = Math.random() * maxTop;

    const maxLeft = window.innerWidth - iw;
    let left;
    if (Math.random() < 0.5) left = Math.random() * Math.max(0, contentRect.left - iw - 10);
    else left = contentRect.right + 10 + Math.random() * Math.max(0, maxLeft - contentRect.right - 10);

    const rot = Math.random() * 40 - 20;
    return { top, left, rot };
};

// --- ANIMAZIONE FLUTTUANTE ---
const animateAvatar = (img, contentRect) => {
    let directionX = Math.random() < 0.5 ? 1 : -1;
    let directionY = Math.random() < 0.5 ? 1 : -1;
    const speed = 0.2 + Math.random() * 0.3;
    const rotationSpeed = (Math.random() - 0.5) * 0.1;

    const move = () => {
        let top = parseFloat(img.style.top);
        let left = parseFloat(img.style.left);
        let rot = parseFloat(img.style.transform.replace(/[^-?\d.]/g, '')) || 0;

        top += directionY * speed;
        left += directionX * speed;
        rot += rotationSpeed;

        const iw = img.offsetWidth;
        const ih = img.offsetHeight;
        const maxLeft = window.innerWidth - iw;
        const maxTop = window.innerHeight - ih;

        if (top <= 0 || top >= maxTop) directionY *= -1;
        if (left <= 0 || left >= maxLeft) directionX *= -1;

        if(left + iw > contentRect.left && left < contentRect.right &&
           top + ih > contentRect.top && top < contentRect.bottom) {
               directionX *= -1;
               directionY *= -1;
        }

        img.style.top = `${Math.min(Math.max(top,0), maxTop)}px`;
        img.style.left = `${Math.min(Math.max(left,0), maxLeft)}px`;
        img.style.transform = `rotate(${rot}deg)`;

        requestAnimationFrame(move);
    };
    move();
};

// --- MOSTRA FOTO CON ANIMAZIONE ---
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
            Object.values(snapshot.val()).forEach(order => {
                if (order.userName) voterNames.add(getNormalizedUserName(order.userName));
            });
        }
        
        const votersArray = Array.from(voterNames);
        
        // Cicliamo sull'array di nomi
        for (const name of votersArray) {
            // Ora 'name' è una stringa valida (es. "Emanuele")
            const paths = getPhotoForUser(name);

            const img = document.createElement('img');
            img.alt = `Foto di ${name}`;
            img.title = name;
            img.className = 'scattered-avatar';
            img.loading = "lazy"; // lazy load per mobile

            // fallback automatico WebP → PNG → default
            img.src = paths.webp;
            img.onerror = () => {
                img.onerror = () => { img.src = paths.fallback; };
                img.src = paths.png;
            };

            img.addEventListener('click', () => openLightbox(img.src, name));
            container.appendChild(img);

            img.onload = () => {
                requestAnimationFrame(() => {
                    const pos = getRandomPosition(img, contentRect);
                    img.style.position = 'absolute';
                    img.style.top = `${pos.top}px`;
                    img.style.left = `${pos.left}px`;
                    img.style.transform = `rotate(${pos.rot}deg)`;

                    animateAvatar(img, contentRect);
                });
            };
        }
    } catch (error) {
        console.error("Errore caricamento votanti:", error);
    }
};

// --- STATISTICHE ---
const loadAndDisplayStatsSummary = async () => {
    const statsContainer = document.getElementById('stats-summary');
    try {
        const statsRef = ref(db, 'stats');
        const snapshot = await get(statsRef);
        let stats = snapshot.exists() ? snapshot.val() : {};

        if(!Object.keys(stats).length) {
            statsContainer.innerHTML = `<h2>Riepilogo Community</h2><p>Nessun voto ancora registrato. Sii il primo a votare!</p>`;
            return;
        }

        const getTop = (field) => {
            const counts = stats[field] || {};
            const sorted = Object.entries(counts).sort(([,a],[,b])=>b-a);
            return sorted[0]? sorted[0][0]:"Nessun voto";
        };

        const getTopMultiple = (field, limit = 3) => {
            const counts = stats[field] || {};
            const sorted = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, limit)
                .map(([name]) => name); // Prende solo il nome
            
            return sorted.length > 0 ? sorted.join(', ') : "Nessun voto";
        };

        const winner = ((stats.main_choice?.pizza || 0) >= (stats.main_choice?.dolce || 0)) ? 'pizza' : 'dolce';
        let html = '';
        if(winner==='pizza'){
            html = `<h2>La community ha scelto... Pizza! 🍕</h2>
                    <ul>
                    <li><strong>Tipo:</strong> ${getTop('pizza_location').replace(/_/g, ' ')}</li>
                    <li><strong>Gusto:</strong> ${getTop('pizza_flavor')}</li>
                    <li><strong>Dolce:</strong> ${getTop('dessert')}</li>
                    </ul>`;
        } else {
            html = `<h2>La community ha scelto... Menu Completo! 🍝</h2>
                    <ul>
                    <li><strong>Antipasti più scelti:</strong> ${getTopMultiple('antipasto', 3)}</li>
                    <li><strong>Primo:</strong> ${getTop('primo')}</li>
                    <li><strong>Secondo:</strong> ${getTop('secondo')}</li>
                    <li><strong>Dolce:</strong> ${getTop('dessert')}</li>
                    </ul>`;
        }
        statsContainer.innerHTML = html;

    } catch(e){
        console.error("Errore caricamento stats:", e);
        statsContainer.innerHTML = `<h2>Oops!</h2><p>Non è stato possibile caricare le statistiche.</p>`;
    }
};

// --- INIZIO ---
// Eseguiamo il codice direttamente dopo che lo script è stato caricato e tutte le funzioni sono definite.
// Rimuoviamo l'evento DOMContentLoaded che si attivava troppo presto, prima che Firebase fosse pronto.
try {
    loadAndDisplayStatsSummary();
    showVoterAvatars();
} catch (error) {
    console.error("Errore nell'esecuzione principale di risultati.js:", error);
    // Potresti mostrare un messaggio di errore all'utente qui, se necessario.
}
