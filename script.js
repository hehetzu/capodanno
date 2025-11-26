import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get, set, push, runTransaction } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { nameNormalizationMap, userPhotoMap } from './config.js'; // Importa le liste centralizzate
import { firebaseConfig } from './firebaseConfig.js'; // Importa la configurazione di Firebase


document.addEventListener('DOMContentLoaded', async () => {
    // --- INIZIO SCRIPT FUOCHI D'ARTIFICIO SU CANVAS ---
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    let fireworks = [];
    let particles = [];

    function setupCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    setupCanvas();

    // Funzione per generare un numero casuale in un range
    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Classe per le particelle dell'esplosione
    class Particle {
        constructor(x, y, color, isTrail = false) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.angle = random(0, Math.PI * 2);
            // Le particelle della scia sono più lente
            this.speed = isTrail ? random(1, 3) : random(2, 12);
            this.friction = 0.95;
            // La gravità ha un effetto più realistico
            this.gravity = 0.2;
            this.alpha = 1;
            // Le particelle della scia svaniscono più in fretta
            this.decay = isTrail ? random(0.04, 0.06) : random(0.01, 0.02);
            this.shouldTwinkle = !isTrail && Math.random() > 0.7; // Alcune particelle scintillano
        }

        update() {
            this.speed *= this.friction;
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed + this.gravity;
            this.alpha -= this.decay;

            // Effetto scintillio
            if (this.shouldTwinkle) {
                this.alpha = Math.max(0, this.alpha - this.decay * (Math.random() * 3));
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    // Classe per il razzo del fuoco d'artificio
    class Firework {
        constructor() {
            this.x = random(canvas.width * 0.2, canvas.width * 0.8);
            this.y = canvas.height;
            this.targetY = random(canvas.height * 0.2, canvas.height * 0.5);
            this.color = `hsl(${random(0, 360)}, 100%, 50%)`; // Colore casuale
        }

        update() {
            // Sale fino al punto di esplosione
            const distanceToTarget = this.y - this.targetY;
            const speed = Math.max(2, distanceToTarget / 20); // Rallenta man mano che sale

            if (distanceToTarget > 1) {
                this.y -= speed;
                // Crea particelle per la scia
                particles.push(new Particle(this.x + random(-2, 2), this.y, 'hsl(40, 100%, 70%)', true));
            } else {
                // Esplode
                const particleCount = 150; // Più particelle per un'esplosione più ricca
                for (let i = 0; i < particleCount; i++) {
                    particles.push(new Particle(this.x, this.y, this.color));
                }
                // Rimuove se stesso
                return true;
            }
            return false;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    let animationFrameId;
    let isAnimationRunning = true;

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        // Se l'animazione è in pausa, non fare nulla
        if (!isAnimationRunning) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Sfondo nero con scia più lunga
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Lancia un nuovo fuoco d'artificio casualmente
        // Riduciamo la frequenza quando la finestra non è a fuoco per risparmiare risorse
        const launchFrequency = document.hidden ? 0.5 : 2;
        if (random(0, 100) < launchFrequency) {
            fireworks.push(new Firework());
        }

        fireworks = fireworks.filter(fw => !fw.update());
        particles = particles.filter(p => p.alpha > 0);

        fireworks.forEach(fw => fw.draw());
        particles.forEach(p => { p.update(); p.draw(); });
    }

    // Mette in pausa l'animazione se la finestra non è visibile
    document.addEventListener('visibilitychange', () => {
        isAnimationRunning = !document.hidden;
    });

    window.addEventListener('resize', () => {
        setupCanvas();
        // Riavvia l'animazione per evitare che si blocchi dopo un resize
        isAnimationRunning = true;
    });

    animate();
    // --- FINE SCRIPT FUOCHI D'ARTIFICIO ---

    const form = document.querySelector('form');
    const h1Title = document.querySelector('h1');
    const summaryContainer = document.getElementById('summary');
    const modalOverlay = document.getElementById('modal-overlay');
    const loadingIndicator = document.getElementById('loading-indicator'); // Aggiunto per l'indicatore di caricamento
    let previousVoteData = null; // Per memorizzare il voto precedente dell'utente
    const allSteps = Array.from(form.querySelectorAll('fieldset'));
    const mainChoiceHolder = document.getElementById('mainChoiceHolder');
    let stepHistory = [allSteps[0]]; // Tiene traccia dei passi visitati

    // --- INIZIO CONFIGURAZIONE FIREBASE ---
    // Inizializza Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    // --- FINE CONFIGURAZIONE FIREBASE ---
    
    // --- Logica per normalizzare il nome utente ---
    const getNormalizedUserName = () => {
        const rawName = localStorage.getItem('userName') || 'Ospite';
        if (rawName === 'Ospite') return 'Ospite';

        const cleanName = rawName.trim().toLowerCase();
        
        // 1. Cerca una corrispondenza esatta nella mappa di normalizzazione.
        if (nameNormalizationMap[cleanName]) {
            return nameNormalizationMap[cleanName];
        }

        // 2. Se non trova corrispondenze, controlla se il nome contiene "giul".
        if (cleanName.includes('giul')) {
            return 'Giulia';
        }

        // 3. Se non trova nessuna regola, usa il nome originale.
        return rawName;
    };

    const userName = getNormalizedUserName();

    // --- Logica per determinare il genere in base al nome ---
    const femaleNames = ['giada', 'giulia', 'marta', 'anna', 'annachiara', 'anna chiara'];
    let userGender = 'm'; // Default a maschile

    if (femaleNames.includes(userName.toLowerCase())) {
        userGender = 'f'; // Imposta a femminile se il nome è nella lista
    }
    // Potresti anche salvare questa informazione per sessioni future (opzionale)
    // localStorage.setItem('userGender', userGender);

    let pizzaYesClickCount = 0;

    // Mostra il pulsante di reset solo per l'utente "emanuele"
    if (userName.toLowerCase() === 'emanuele') {
        const adminResetBtn = document.getElementById('admin-reset-btn');
        if (adminResetBtn) {
            adminResetBtn.style.display = 'block'; // O 'inline-block' a seconda dello stile
        }
    }

    // --- FUNZIONE PER CARICARE I PIATTI PERSONALIZZATI DA FIREBASE ---
    const loadCustomDishes = async () => {
        try {
            const dishesRef = ref(db, 'customDishes');
            const snapshot = await get(dishesRef);
            if (snapshot.exists()) {
                const dishes = snapshot.val();
                for (const key in dishes) {
                    addDishToDOM(dishes[key].category, dishes[key].name);
                }
            }
        } catch (error) {
            console.error("Errore nel caricamento dei piatti personalizzati:", error);
        }
    };

    // Funzione helper per aggiungere un piatto al DOM nella categoria corretta
    const addDishToDOM = (category, name) => {
        let container;
        let stepName;

        switch (category) {
            case 'antipasto':
                stepName = 'antipasto-choice';
                break;
            case 'primo':
                stepName = 'primo-choice';
                break;
            case 'secondo':
                stepName = 'secondo-choice';
                break;
            case 'dessert':
                stepName = 'dessert-choice';
                break;
            case 'pizza_flavor':
                stepName = 'pizza-flavor';
                break;
            default:
                return; // Categoria non riconosciuta
        }

        const stepElement = form.querySelector(`[data-step-name="${stepName}"]`);
        if (!stepElement) return;

        container = stepElement.querySelector('.choice-button-container');
        if (!container) return;

        if (category === 'antipasto') {
            const newLabel = document.createElement('label');
            newLabel.className = 'choice-btn';
            
            const newCheckbox = document.createElement('input');
            newCheckbox.type = 'checkbox';
            newCheckbox.name = 'antipasto[]';
            newCheckbox.value = name;
            
            newLabel.appendChild(newCheckbox);
            newLabel.append(name);

            // Inserisce il nuovo antipasto prima del wrapper per l'aggiunta di nuove opzioni
            container.appendChild(newLabel);
        } else {
            const newButton = document.createElement('button');
            newButton.type = 'button';
            newButton.className = 'choice-btn';
            newButton.dataset.choice = name;
            newButton.textContent = name;

            // Usa la funzione centralizzata per determinare il passo successivo
            const nextStep = getNextStepForDish(category, name);
            if (nextStep) {
                newButton.dataset.nextStep = nextStep;
            }

            container.appendChild(newButton);
        }

        // Ordina i pulsanti alfabeticamente per mantenere una lista pulita,
        // assicurandosi che "Aggiungi opzione" rimanga alla fine.
        const buttons = Array.from(container.children).filter(el => el.tagName === 'BUTTON' || el.tagName === 'LABEL');
        const addOptionWrapper = container.querySelector('.add-item-wrapper');
        buttons.sort((a, b) => a.textContent.localeCompare(b.textContent));
        buttons.forEach(btn => container.appendChild(btn));
        if (addOptionWrapper) container.appendChild(addOptionWrapper);
    };

    /**
     * Determina il passo successivo in base alla categoria e al nome del piatto.
     * @param {string} category - La categoria del piatto (es. 'primo').
     * @param {string} name - Il nome del piatto.
     * @returns {string|null} Il nome del passo successivo o null.
     */
    const getNextStepForDish = (category, name) => {
        const nameLower = name.toLowerCase();
        if (category === 'primo' && nameLower.includes('agnolotti')) {
            return 'agnolotti-sauce';
        }
        if (category === 'secondo' && nameLower.includes('arrosto')) {
            return 'arrosto-potatoes';
        }
        if (category === 'secondo' && (nameLower.includes('cappello del prete') || nameLower.includes('cappello prete'))) {
            return 'cappello-prete-side';
        }
        if (category === 'dessert' && (nameLower.includes('panna cotta') || nameLower.includes('pannacotta'))) {
            return 'pannacotta-flavor';
        }
        return null;
    };
    // Funzione per ottenere il percorso della foto in base al nome
    const getPhotoForUser = (name) => {
        // Cerca il nome utente nella mappa delle foto. Se non lo trova, usa 'default'.
        const fileName = userPhotoMap[name] || 'default';
        // Restituisce un oggetto con i percorsi possibili, per coerenza con risultati.js
        return {
            webp: `photos/${fileName}.webp`,
            png: `photos/${fileName}.png`,
            fallback: `photos/default.webp` // Usa un'immagine di default in formato webp
        };
    };

    const showSummary = () => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        let summaryHtml = `<h2>Ecco le tue scelte, ${userName}:</h2><ul>`;

        if (data.main_choice === 'pizza') {
            summaryHtml += `<li><strong>Scelta principale:</strong> Pizza</li>`;
            summaryHtml += `<li><strong>Tipo:</strong> ${data.pizza_location.replace('fatta_in_casa', 'Fatta in casa').replace('asporto', 'Da asporto')}</li>`;
            if (data.pizza_location === 'fatta_in_casa') {
                summaryHtml += `<li><strong>Gusto Pizza:</strong> ${data.pizza_flavor}</li>`;
            }
        } else {
            summaryHtml += `<li><strong>Scelta principale:</strong> Menu completo</li>`;
            const antipasti = formData.getAll('antipasto[]');
            if (antipasti.length > 0) {
                summaryHtml += `<li><strong>Antipasti:</strong> ${antipasti.join(', ')}</li>`;
            }
            if (data.primo) summaryHtml += `<li><strong>Primo:</strong> ${data.agnolotti_sauce ? `${data.primo} (${data.agnolotti_sauce})` : data.primo}</li>`;
            if (data.secondo) {
                let secondoText = data.secondo;
                if (data.secondo === 'Cappello del prete al Barolo') {
                    secondoText += data.cappello_prete_side === 'Polenta' ? ' con Polenta' : ` con ${data.arrosto_potatoes}`;
                } else if (data.secondo === 'Arrosto con patate') {
                    secondoText += ` con ${data.arrosto_potatoes}`;
                }
                summaryHtml += `<li><strong>Secondo:</strong> ${secondoText}</li>`;
            }
        }

        if (data.dessert) summaryHtml += `<li><strong>Dolce:</strong> ${data.pannacotta_flavor ? `${data.dessert} (${data.pannacotta_flavor})` : data.dessert}</li>`;
        summaryHtml += `<li><strong>Fuochi d'artificio:</strong> ${data.fireworks_choice === 'si' ? 'Sì' : 'No'}</li>`;
        summaryHtml += `</ul>`;

        const contentArea = summaryContainer.querySelector('.summary-content');
        if (contentArea) contentArea.innerHTML = summaryHtml;

        form.style.display = 'none';
        summaryContainer.style.display = 'block';
        summaryContainer.classList.add('active');

    };

    /**
     * Invia una notifica a Telegram tramite un servizio backend.
     * @param {object} orderData - L'oggetto contenente i dati dell'ordine.
     */
    const sendTelegramNotification = async (orderData) => {
        // URL del tuo server personale online (es. su Render).
        const backendUrl = 'https://server-menu-capodanno-manu.onrender.com/send-telegram-notification';

        // Formatta il messaggio per Telegram
        let message = `🎉 *Nuova Votazione da ${orderData.userName}!* 🎉\n\n`;

        if (orderData.main_choice === 'pizza') {
            message += `🍕 *Scelta Principale:* Pizza\n`;
            const location = orderData.pizza_location === 'fatta_in_casa' ? 'Fatta in casa' : 'Da asporto';
            message += `📍 *Tipo:* ${location}\n`;
            if (orderData.pizza_flavor) {
                message += `🌶️ *Gusto:* ${orderData.pizza_flavor}\n`;
            }
        } else {
            message += `🍽️ *Scelta Principale:* Menù Completo\n`;
            if (orderData.antipasto && orderData.antipasto.length > 0) {
                message += `🧀 *Antipasti:* ${orderData.antipasto.join(', ')}\n`;
            }
            if (orderData.primo) message += `🍝 *Primo:* ${orderData.primo}\n`;
            if (orderData.secondo) message += `🍖 *Secondo:* ${orderData.secondo}\n`;
        }

        if (orderData.dessert) message += `🍰 *Dolce:* ${orderData.dessert}\n`;
        message += `🎆 *Fuochi d'artificio:* ${orderData.fireworks_choice === 'si' ? 'Sì, ci sta!' : 'No'}\n`;

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            if (response.ok) {
                console.log('Notifica Telegram inviata con successo!');
            } else {
                console.error('Il server ha risposto con un errore durante l\'invio della notifica Telegram.');
            }
        } catch (error) {
            console.error('Errore di rete o del server durante l\'invio della notifica a Telegram:', error);
        }
    };


    const confirmOrder = async () => {
        try {
            summaryContainer.style.display = 'none';
            // Mostra un indicatore di caricamento (opzionale, ma consigliato)
            // document.getElementById('loading-spinner').style.display = 'block';

            const formData = new FormData(form);
            // Usiamo un oggetto separato per i dati da salvare, per poterlo manipolare
            const orderData = Object.fromEntries(formData.entries());

            // Assicura che main_choice sia sempre valorizzato, anche se non fosse nel form
            orderData.main_choice = mainChoiceHolder.value;
            
            // Aggiunge il nome dell'utente ai dati dell'ordine
            orderData.userName = userName;

            // Gestione antipasti
            const antipasti = formData.getAll('antipasto[]');
            if (antipasti.length > 0) {
                orderData.antipasto = antipasti;
            }
            // Rimuovi la chiave vuota creata da FormData per i checkbox
            delete orderData['antipasto[]']; 

            // Se la pizza è da asporto, non c'è un gusto, quindi rimuoviamo la chiave
            if (orderData.pizza_location === 'asporto') {
                delete orderData.pizza_flavor;
            }

            // --- LOGICA PER GESTIRE IL VOTO UNICO ---
            // 1. Cerca se l'utente ha già votato
            const ordersRef = ref(db, 'orders');
            const snapshot = await get(ordersRef);
            let existingOrderKey = null;
            let oldOrderData = null;

            if (snapshot.exists()) {
                const allOrders = snapshot.val();
                for (const key in allOrders) {
                    if (allOrders[key].userName === userName) {
                        existingOrderKey = key;
                        oldOrderData = allOrders[key];
                        break;
                    }
                }
            }

            // Unisci le scelte condizionali per il riepilogo della notifica
            const notificationOrderData = { ...orderData };
            if (notificationOrderData.agnolotti_sauce) {
                notificationOrderData.primo = `${notificationOrderData.primo} (${notificationOrderData.agnolotti_sauce})`;
            }
            if (notificationOrderData.cappello_prete_side) {
                const side = notificationOrderData.cappello_prete_side === 'Polenta' ? 'con Polenta' : `con ${notificationOrderData.arrosto_potatoes}`;
                notificationOrderData.secondo = `${notificationOrderData.secondo} (${side})`;
            } 
            else if (notificationOrderData.arrosto_potatoes) {
                notificationOrderData.secondo = `${notificationOrderData.secondo} (${notificationOrderData.arrosto_potatoes})`;
            }
            if (notificationOrderData.pannacotta_flavor) {
                notificationOrderData.dessert = `${notificationOrderData.dessert} (${notificationOrderData.pannacotta_flavor})`;
            }

            // Invia la notifica a Telegram (non blocca il resto del processo)
            // Passiamo la versione modificata per la notifica
            await sendTelegramNotification(notificationOrderData);

            // Aggiorna le statistiche
            const statsRef = ref(db, 'stats');
            await runTransaction(statsRef, (currentData) => {
                if (!currentData) {
                    currentData = {};
                }
                // Funzione per modificare il conteggio (incremento o decremento)
                const updateCount = (data, operation, mainChoice) => {
                    if (!data) return;
                    const multiplier = operation === 'increment' ? 1 : -1;

                    const processItem = (category, item) => {
                        if (!item) return;
                        // Pulisce il nome dell'item per evitare duplicati (es. "  Piatto  " diventa "Piatto")
                        item = typeof item === 'string' ? item.trim() : item;
                        if (!currentData[category]) currentData[category] = {};
                        if (!currentData[category][item]) currentData[category][item] = 0;
                        currentData[category][item] += multiplier;
                    };

                    // Processa ogni chiave nei dati
                    for (const key in data) {
                        if (key === 'userName' || key === 'main_choice') continue; // Salta il nome utente e la scelta principale
                        const value = data[key];
                        if (Array.isArray(value)) {
                            value.forEach(item => processItem('antipasto', item));
                        } else {
                            processItem(key, value);
                        }
                    }

                    // Processa la scelta principale separatamente
                    if (mainChoice) {
                        processItem('main_choice', mainChoice);
                    }
                };

                // 2. Se esiste un vecchio ordine, decrementa le sue statistiche
                if (oldOrderData) {
                    updateCount(oldOrderData, 'decrement', oldOrderData.main_choice);
                }

                // 3. Incrementa le statistiche con il nuovo ordine
                updateCount(orderData, 'increment', orderData.main_choice);

                return currentData;
            });

            // 4. Salva il singolo ordine: aggiorna se esiste, crea se non esiste
            if (existingOrderKey) {
                // Aggiorna il voto esistente
                // Assicuriamoci di mantenere il nome utente originale per coerenza
                // con la logica delle foto (es. "Emanuele" con la E maiuscola)
                orderData.userName = userName;
                await set(ref(db, `orders/${existingOrderKey}`), orderData);
                console.log("Ordine esistente aggiornato per l'utente:", userName);
            } else {
                // Salva come nuovo ordine
                const newOrderRef = push(ref(db, 'orders'));
                await set(newOrderRef, orderData);
                console.log("Nuovo ordine salvato con ID: ", newOrderRef.key);
            }

            // Reindirizza alla pagina dei risultati
            window.location.href = 'risultati.html';
        } catch (error) {
            console.error("Errore durante la conferma dell'ordine: ", error);
            alert("Si è verificato un errore nel salvataggio. Riprova.");
            // Nascondi l'indicatore di caricamento in caso di errore
            // document.getElementById('loading-spinner').style.display = 'none'; // Rimuovi il commento se hai uno spinner
        }
    };

    const sendResetNotification = async () => {
        const backendUrl = 'https://server-menu-capodanno-manu.onrender.com/send-telegram-notification';
        const resetMessage = `⚠️ *RESET TOTALE ESEGUITO* ⚠️\n\nL'utente *${userName}* ha cancellato tutti i voti e le statistiche.\n\nSi riparte da zero!`;

        try {
            await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: resetMessage })
            });
        } catch (error) {
            console.error('Errore durante l\'invio della notifica di reset a Telegram:', error);
        }
    };

    const resetAllData = async () => {
        if (confirm("Sei assolutamente sicuro di voler cancellare TUTTI i voti, i piatti personalizzati e le statistiche? L'azione è irreversibile.")) {
            try {
                console.log("Inizio reset totale...");
                // Cancella tutti gli ordini
                await set(ref(db, 'orders'), null);
                // Cancella tutti i piatti personalizzati
                await set(ref(db, 'customDishes'), null);
                // Cancella tutte le statistiche
                await set(ref(db, 'stats'), null);

                // Invia la notifica di reset a Telegram
                await sendResetNotification();

                alert("Dati cancellati con successo! La pagina verrà ricaricata.");
                window.location.reload();
            } catch (error) {
                console.error("Errore durante il reset totale:", error);
                alert("Si è verificato un errore durante la cancellazione dei dati.");
            }
        }
    };

    const editChoices = () => {
        // Nascondi il riepilogo e mostra di nuovo il form
        summaryContainer.style.display = 'none';
        summaryContainer.classList.remove('active');
        form.style.display = 'block';

        // Mostra l'ultimo step visitato prima del riepilogo.
        // Aggiungiamo un controllo per sicurezza.
        if (stepHistory.length > 0) {
            const lastStep = stepHistory[stepHistory.length - 1];
            showStep(lastStep);
        }
    };


    const showStep = (step) => {
        const isModal = step && step.dataset.modal === 'true';

        // Nascondi tutti i passi non modali
        allSteps.forEach(s => {
            if (s.dataset.modal !== 'true') s.classList.remove('active');
        });

        if (!isModal) { // Se il nuovo passo non è un modale, nascondi anche i modali e l'overlay
            allSteps.forEach(s => s.classList.remove('active'));
            document.body.classList.remove('modal-active');
        } else {
            // Se è un modale, attiva l'overlay
            document.body.classList.add('modal-active');
        }

        if (step) {
            // Se stiamo aprendo un modale, assicuriamoci che tutti gli altri modali siano chiusi
            if (isModal) {
                allSteps.forEach(s => { if (s.dataset.modal === 'true' && s !== step) s.classList.remove('active'); });
            }
            step.classList.add('active');
        }
    };

    // --- GESTIONE DEGLI EVENTI SUL FORM ---

    /**
     * Gestisce i click sui pulsanti di scelta che non sono nel primo step.
     * Si occupa di salvare la scelta, aggiornare la UI e navigare al passo successivo.
     */
    const handleChoiceClick = (e) => {
            const currentStep = e.target.closest('fieldset');
            const currentStepName = currentStep.dataset.stepName;
            const choice = e.target.dataset.choice;

            // Salva la scelta nell'input nascosto del fieldset
            const choiceHolder = currentStep.querySelector('.choice-holder');
            if (choiceHolder) {
                choiceHolder.value = choice;
            }

            // Gestione della selezione visiva
            if (currentStepName === 'antipasto-choice') {
                // Per gli antipasti, la selezione visiva è gestita automaticamente dal CSS
                // tramite lo pseudo-selettore :checked. Non è necessaria logica JS qui.
            } else {
                // Per le altre sezioni (radio-like), deseleziona gli altri e seleziona quello cliccato.
                e.target.closest('fieldset').querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active-choice'));
                e.target.classList.add('active-choice');
            }

            // Se siamo nella sezione degli antipasti, non navighiamo automaticamente.
            // L'utente userà il pulsante "Avanti" per procedere.
            if (currentStepName === 'antipasto-choice') {
                return; // Interrompe l'esecuzione per questo step
            }

            // Logica di navigazione automatica
            const nextStepName = e.target.dataset.nextStep;
            let nextStep = null;

            if (nextStepName) {
                nextStep = form.querySelector(`[data-step-name="${nextStepName}"]`);
            } else {
                // Se non c'è un next-step specifico, trova lo step successivo nell'ordine del DOM.
                const currentIndex = allSteps.indexOf(currentStep);
                if (currentIndex !== -1 && currentIndex < allSteps.length - 1) {
                    // Prendi il prossimo fieldset nella lista
                    nextStep = allSteps[currentIndex + 1];
                }
            }

             if (nextStep) {
                 stepHistory.push(nextStep);
                 showStep(nextStep);
             }
    };

    const handleFireworksClick = (e) => {
         if (e.target.matches('.choice-btn') && e.target.closest('[data-step-name="fireworks-choice"]')) {
            const choice = e.target.dataset.choice;
            form.querySelector('input[name="fireworks_choice"]').value = choice;

            if (choice === 'no') {
                const mainChoice = mainChoiceHolder.value;
                const popup = form.querySelector('[data-step-name="custom-message-popup"]');
                const messageP = popup.querySelector('#custom-popup-message');
                const iconSpan = popup.querySelector('#custom-popup-icon');

                // Imposta il messaggio in base alla scelta principale
                if (mainChoice === 'pizza') {
                    messageP.innerHTML = `${userName}, sempre tu! 😂`;
                    iconSpan.textContent = '🤦';
                } else {
                    messageP.innerHTML = '😢😢😢';
                    iconSpan.textContent = '😭';
                }

                // Mostra il popup e nascondi il pulsante "Ok"
                popup.querySelector('.navigation-buttons').style.display = 'none';
                popup.classList.remove('fade-out'); // Rimuovi animazione di uscita se presente
                showStep(popup);

                // Dopo 4 secondi, nascondi il popup e vai al riepilogo
                setTimeout(() => {
                    popup.classList.add('fade-out'); // Avvia animazione di uscita
                    setTimeout(() => {
                        showSummary();
                        document.body.classList.remove('modal-active'); // Rimuovi lo stato modale
                        popup.querySelector('.navigation-buttons').style.display = 'flex'; // Ripristina il pulsante
                    }, 500); // Attendi la fine dell'animazione
                }, 3500); // Impostato a 3.5s per avviare l'animazione prima dei 4s
            } else { // Se la scelta è "sì", vai direttamente al riepilogo
                showSummary();
            }
        }
    };

    const handlePopupClose = (e) => {
         // Gestione chiusura popup personalizzato
        if (e.target.matches('#close-popup-btn')) {
            const nextStepName = e.target.dataset.nextStep;
            if (nextStepName) {
                // Se il pulsante ha un 'data-next-step', vai a quel passo
                mainChoiceHolder.value = 'dolce'; // Imposta la scelta
                const nextStep = form.querySelector(`[data-step-name="${nextStepName}"]`);
                stepHistory.push(nextStep);
                showStep(nextStep);
            } else {
                // Ri-mostra il pulsante se era stato nascosto
                e.target.closest('.navigation-buttons').style.display = 'flex';
                // Comportamento di default: vai al riepilogo
                showSummary();
            }
        }
    };

    const handleNextButtonClick = (e) => {
        if (e.target.matches('.next-btn')) {
            const currentStep = e.target.closest('fieldset');
            const currentStepName = currentStep.dataset.stepName;

            // Logica specifica per il pulsante "Avanti" degli antipasti
            if (currentStepName === 'antipasto-choice') {
                const checkedInputs = currentStep.querySelectorAll('input[type="checkbox"]:checked');
                if (checkedInputs.length === 0) {
                    alert('Ehi, scegli almeno un antipasto prima di andare avanti!');
                    return;
                }
                const nextStep = form.querySelector('[data-step-name="primo-choice"]');
                if (nextStep) {
                    stepHistory.push(nextStep);
                    showStep(nextStep);
                }
            }
        }
    };

    const handlePrevButtonClick = (e) => {
        if (e.target.matches('.prev-btn')) {
            if (stepHistory.length > 1) {
                let prevStep;
                // Continua a tornare indietro finché non troviamo un passo che NON è un modale
                do {
                    stepHistory.pop(); // Rimuove il passo corrente (o il modale)
                    prevStep = stepHistory[stepHistory.length - 1];
                } while (stepHistory.length > 1 && prevStep.dataset.modal === 'true');

                // Se si torna al primo passo, resetta lo scherzo della pizza.
                if (prevStep === allSteps[0]) {
                    pizzaYesClickCount = 0;
                    // Trova il pulsante "Sì" nel primo step e ripristina il testo
                    const pizzaButton = prevStep.querySelector('[data-choice="pizza"]');
                    if (pizzaButton) pizzaButton.textContent = 'Sì 🍕';
                }

                // Nascondi il passo corrente (che potrebbe essere un modale)
                const currentStep = e.target.closest('fieldset');
                currentStep.classList.remove('active');

                // Se il passo precedente non era un modale, nascondi l'overlay
                if (!prevStep.dataset.modal) {
                    document.body.classList.remove('modal-active');
                }
                showStep(prevStep);
            }
        }
    };

    const handleFirstStepChoice = (e) => {
        const currentStep = e.target.closest('fieldset');
        if (e.target.matches('.choice-btn') && currentStep && currentStep === allSteps[0]) {
            const choice = e.target.dataset.choice;

            if (choice === 'pizza') {
                pizzaYesClickCount++;
                const pizzaButton = e.target;
                let nextStep = null;

                switch (pizzaYesClickCount) {
                    case 1: pizzaButton.textContent = userGender === 'f' ? 'Sicura? 🤔' : 'Sicuro? 🤔'; break;
                    case 2: pizzaButton.textContent = userGender === 'f' ? 'Sicurissima?? 🤨' : 'Sicurissimo?? 🤨'; break;
                    case 3: pizzaButton.textContent = userGender === 'f' ? `Dai ${userName}, fai la seria!` : `Dai ${userName}, fai il serio!`; break;
                    default:
                        mainChoiceHolder.value = 'pizza';
                        nextStep = form.querySelector('[data-step-name="pizza-location"]');
                        stepHistory.push(nextStep);
                        showStep(nextStep);
                        break;
                }
            } else if (choice === 'dolce') {
                mainChoiceHolder.value = 'dolce'; // Imposta la scelta principale
                const nextStep = form.querySelector('[data-step-name="antipasto-choice"]');
                if (nextStep) {
                    stepHistory.push(nextStep);
                    showStep(nextStep);
                }
            }
        }
    };

    const handleAddItem = (e) => {
        if (e.target.matches('.show-add-form-btn')) {
            const wrapper = e.target.closest('.add-item-wrapper');
            const form = wrapper.querySelector('.add-item-form');
            const input = form.querySelector('.new-item-input');

            e.target.style.display = 'none'; // Nasconde il pulsante "Aggiungi opzione"
            form.style.display = 'flex'; // Mostra il form di inserimento
            input.focus(); // Mette il focus sull'input di testo
        }
        if (e.target.matches('#add-flavor-btn, .add-item-btn')) {
            const input = e.target.previousElementSibling;
            const newItemText = input.value.trim();

            if (newItemText === '') {
                alert('Scrivi qualcosa se vuoi aggiungerlo!');
                return;
            }

            const currentStep = e.target.closest('fieldset');
            const isAntipastoSection = currentStep.dataset.stepName === 'antipasto-choice';
            const listContainer = currentStep.querySelector('.choice-button-container');

            if (isAntipastoSection) {                
                const newDishRef = push(ref(db, 'customDishes'));
                set(newDishRef, { category: 'antipasto', name: newItemText });

                // Usa la funzione centralizzata che gestisce anche l'ordinamento
                addDishToDOM('antipasto', newItemText);
                const newCheckbox = listContainer.querySelector(`input[value="${newItemText}"]`);
                newCheckbox.checked = true;
            } else if (listContainer) {
                const categoryMap = {
                    'pizza-flavor': 'pizza_flavor',
                    'primo-choice': 'primo',
                    'secondo-choice': 'secondo',
                    'dessert-choice': 'dessert'
                };
                const category = categoryMap[currentStep.dataset.stepName];

                if (category) {
                    const newDishRef = push(ref(db, 'customDishes'));
                    set(newDishRef, { category: category, name: newItemText });
                }

                const newButton = document.createElement('button');
                newButton.type = 'button';
                newButton.className = 'choice-btn';
                newButton.dataset.choice = newItemText;
                newButton.textContent = newItemText;

                // Usa la funzione centralizzata per determinare il passo successivo
                const nextStep = getNextStepForDish(category, newItemText);
                if (nextStep) {
                    newButton.dataset.nextStep = nextStep;
                }

                listContainer.appendChild(newButton);
                newButton.click();
            }

            input.value = '';

            const wrapper = e.target.closest('.add-item-wrapper');
            if (wrapper) {
                const addItemForm = wrapper.querySelector('.add-item-form');
                const showAddFormBtn = wrapper.querySelector('.show-add-form-btn');
                addItemForm.style.display = 'none';
                showAddFormBtn.style.display = 'block';
            }
        }
    };

    // Listener di eventi unificato e più efficiente
    form.addEventListener('click', (e) => {
        const target = e.target;
        const currentStep = target.closest('fieldset');

        // Se il click non è su un pulsante o su un elemento che si comporta come tale, non fare nulla.
        // Questo corregge il problema degli antipasti (che sono <label>) che non erano più cliccabili.
        const isClickable = target.matches('button, .choice-btn');
        if (!isClickable) return;

        // Gestione pulsanti di scelta (es. Pizza, Primo, Secondo...)
        if (target.matches('.choice-btn')) {
            const stepName = currentStep ? currentStep.dataset.stepName : null;

            if (currentStep === allSteps[0]) {
                handleFirstStepChoice(e); // Gestisce solo lo scherzo del primo step
            } else if (stepName === 'antipasto-choice') {
                // Per gli antipasti, non facciamo nulla.
                // La selezione è gestita dal CSS con :has(:checked) e la navigazione avviene con il pulsante "Avanti".
                return;
            } else if (stepName === 'fireworks-choice') {
                handleFireworksClick(e); // Gestisce la scelta dei fuochi d'artificio
            } else if (stepName) { // Assicurati che ci sia uno step prima di procedere
                handleChoiceClick(e); // Gestisce tutte le altre scelte
            }
        } // Fine del blocco if per .choice-btn

        // Gestione pulsanti di navigazione
        if (target.matches('.next-btn')) handleNextButtonClick(e);
        if (target.matches('.prev-btn')) handlePrevButtonClick(e);

        // Gestione pulsanti per aggiungere opzioni
        if (target.matches('.show-add-form-btn') || target.matches('.add-item-btn')) handleAddItem(e);

        // Gestione pulsante di chiusura del popup
        if (target.matches('#close-popup-btn')) handlePopupClose(e);
    });




    // Gestione della pressione del tasto "Invio" nei campi di testo per aggiungere opzioni
    form.addEventListener('keydown', (e) => { 
        // Controlla se il tasto premuto è "Invio" e se l'evento proviene da un campo di input per aggiungere un nuovo elemento
        if (e.key === 'Enter' && e.target.matches('.new-item-input')) {
            e.preventDefault(); // Impedisce il comportamento predefinito del form (che potrebbe essere l'invio)

            // Trova il pulsante "Aggiungi" associato a questo input e simula un click
            const addButton = e.target.nextElementSibling;
            if (addButton && addButton.matches('.add-item-btn')) {
                addButton.click();
            }
        }
    });

    // Gestione dei pulsanti fuori dal form (nel riepilogo)
    document.addEventListener('click', (e) => {
        if (e.target.matches('#edit-choices-btn')) {
            editChoices();
        }
        if (e.target.matches('#confirm-order-btn')) {
            confirmOrder();
        }
        if (e.target.matches('#reset-all-btn')) {
            resetAllData();
        }
        if (e.target.matches('#admin-reset-btn')) {
            resetAllData();
        }
    });

    // Mostra il form e nascondi il caricamento
    const showForm = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (form) form.style.display = 'block';
    };

    // Esegui le operazioni di avvio in sequenza
    await loadCustomDishes();
    await loadUserPreviousVote();

    // Infine, mostra il form (questa riga è già presente e corretta)
    showForm();
});