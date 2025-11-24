import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// --- CONFIG FIREBASE ---
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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- FOTO UTENTE ---
const getPhotoForUser = (name) => {
    const lower = name.toLowerCase();
    const map = {
        'emanuele': 'Emanuele.png','dama': 'Dama.png','damato': 'Dama.png','lorenzo': 'Dama.png',
        'giada': 'Giada.png','giulia': 'Giulia.png','luca': 'Luca.png','lucapolla': 'Luca.png','luca polla': 'Luca.png',
        'marta': 'Marta.png','matteo': 'Matteo.png','rocco': 'Rocco.png','saba': 'Saba.png','sabatino': 'Saba.png',
        'alessio': 'Saba.png','anna': 'Anna.png','annachiara': 'Anna.png','anna chiara': 'Anna.png'
    };
    return `photos/${map[lower] || 'Default.jpg'}`;
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
        if (snapshot.exists()) Object.values(snapshot.val()).forEach(order => { if(order.userName) voterNames.add(order.userName); });

        voterNames.forEach(name => {
            const img = document.createElement('img');
            img.src = getPhotoForUser(name);
            img.alt = `Foto di ${name}`;
            img.title = name;
            img.className = 'scattered-avatar';
            img.addEventListener('click', () => openLightbox(img.src, name));
            container.appendChild(img);

            requestAnimationFrame(() => {
                const pos = getRandomPosition(img, contentRect);
                img.style.position = 'absolute';
                img.style.top = `${pos.top}px`;
                img.style.left = `${pos.left}px`;
                img.style.transform = `rotate(${pos.rot}deg)`;

                // Animazione continua
                animateAvatar(img, contentRect);
            });
        });
    } catch (error) {
        console.error("Errore caricamento votanti:", error);
    }
};

// --- ANIMAZIONE FLUTTUANTE ---
const animateAvatar = (img, contentRect) => {
    let directionX = Math.random() < 0.5 ? 1 : -1;
    let directionY = Math.random() < 0.5 ? 1 : -1;
    const speed = 0.2 + Math.random() * 0.3; // px per frame
    const rotationSpeed = (Math.random() - 0.5) * 0.1;

    const move = () => {
        let top = parseFloat(img.style.top);
        let left = parseFloat(img.style.left);
        let rot = parseFloat(img.style.transform.replace(/[^-?\d.]/g, '')) || 0;

        // Aggiorna posizione
        top += directionY * speed;
        left += directionX * speed;
        rot += rotationSpeed;

        const iw = img.offsetWidth;
        const ih = img.offsetHeight;
        const maxLeft = window.innerWidth - iw;
        const maxTop = window.innerHeight - ih;

        // Inversione se raggiunge bordo
        if (top <= 0 || top >= maxTop) directionY *= -1;
        if (left <= 0 || left >= maxLeft) directionX *= -1;

        // Evita sovrapposizione al contenuto centrale
        const contentRectSafe = contentRect;
        if(left + iw > contentRectSafe.left && left < contentRectSafe.right &&
           top + ih > contentRectSafe.top && top < contentRectSafe.bottom) {
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

// --- STATISTICHE ---
const loadAndDisplayStatsSummary = async () => {
    const statsContainer = document.getElementById('stats-summary');
    try {
        const statsRef = ref(db, 'stats');
        const snapshot = await get(statsRef);
        let stats = snapshot.exists() ? snapshot.val() : {};

        if(!Object.keys(stats).length) {
            statsContainer.innerHTML = `<h2>Menu più votato</h2><p>Nessun voto ancora registrato. Sii il primo a votare!</p>`;
            return;
        }

        const getTop = (field) => {
            const counts = stats[field] || {};
            const sorted = Object.entries(counts).sort(([,a],[,b])=>b-a);
            return sorted[0]? sorted[0][0]:"Nessun voto";
        };

        const winner = ((stats.main_choice?.pizza || 0) >= (stats.main_choice?.dolce || 0)) ? 'pizza' : 'dolce';
        let html = '';
        if(winner==='pizza'){
            html = `<h2>La community ha scelto... Pizza! 🍕</h2>
                    <ul>
                    <li><strong>Tipo:</strong> ${getTop('pizza_location').replace('fatta_in_casa','Fatta in casa').replace('asporto','Da asporto')}</li>
                    <li><strong>Gusto:</strong> ${getTop('pizza_flavor')}</li>
                    <li><strong>Dolce:</strong> ${getTop('dessert')}</li>
                    </ul>`;
        } else {
            html = `<h2>La community ha scelto... Menu Completo! 🍝</h2>
                    <ul>
                    <li><strong>Antipasto:</strong> ${getTop('antipasto')}</li>
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
document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayStatsSummary();
    showVoterAvatars();
});