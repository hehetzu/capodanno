// -----------------------------
// Canvas fuochi d'artificio
// -----------------------------
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Firework {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.targetY = Math.random() * canvas.height / 2;
        this.radius = Math.random() * 2 + 1;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.speed = Math.random() * 3 + 2;
    }
    update() {
        this.y -= this.speed;
        if (this.y <= this.targetY) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

let fireworks = [];
function initFireworks() {
    const count = window.innerWidth < 768 ? 20 : 50;
    fireworks = [];
    for (let i = 0; i < count; i++) fireworks.push(new Firework());
}
initFireworks();

function animate() {
    ctx.fillStyle = 'rgba(16,23,41,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    fireworks.forEach(fw => {
        fw.update();
        fw.draw();
    });
    requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', initFireworks);

// -----------------------------
// Gestione fieldset e pulsanti
// -----------------------------
const fieldsets = document.querySelectorAll('fieldset');
let currentStep = 0;
fieldsets.forEach((fs, idx) => {
    if (fs.classList.contains('active')) currentStep = idx;
});

function showStep(index) {
    fieldsets.forEach(fs => fs.classList.remove('active'));
    if (fieldsets[index]) fieldsets[index].classList.add('active');
    currentStep = index;
}

// Pulsanti Avanti/Indietro
document.querySelectorAll('.prev-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(currentStep - 1));
});
document.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(currentStep + 1));
});

// Pulsanti di scelta
document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const choice = btn.dataset.choice;
        const nextStepName = btn.dataset.nextStep;
        const parentFS = btn.closest('fieldset');
        const hiddenInput = parentFS.querySelector('.choice-holder');
        if (hiddenInput) hiddenInput.value = choice;

        // Se definito passo successivo
        if (nextStepName) {
            const nextFS = document.querySelector(`fieldset[data-step-name="${nextStepName}"]`);
            if (nextFS) {
                fieldsets.forEach(fs => fs.classList.remove('active'));
                nextFS.classList.add('active');
            }
        }
    });
});

// -----------------------------
// Modal popup
// -----------------------------
const overlay = document.getElementById('modal-overlay');
function showModal(modalFS) {
    overlay.style.display = 'block';
    modalFS.style.display = 'block';
    document.body.classList.add('modal-active');
}

function closeModal(modalFS) {
    modalFS.classList.add('fade-out');
    setTimeout(() => {
        modalFS.style.display = 'none';
        modalFS.classList.remove('fade-out');
        overlay.style.display = 'none';
        document.body.classList.remove('modal-active');
    }, 500);
}

overlay.addEventListener('click', () => {
    const modals = document.querySelectorAll('fieldset[data-modal="true"]');
    modals.forEach(m => closeModal(m));
});

document.getElementById('close-popup-btn')?.addEventListener('click', () => {
    const modal = document.querySelector('fieldset[data-step-name="custom-message-popup"]');
    if (modal) closeModal(modal);
});

// -----------------------------
// Aggiunta nuove opzioni
// -----------------------------
document.querySelectorAll('.show-add-form-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const formWrapper = btn.nextElementSibling;
        if (formWrapper) formWrapper.style.display = formWrapper.style.display === 'block' ? 'none' : 'block';
    });
});

document.querySelectorAll('.add-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.closest('.add-item-form').querySelector('.new-item-input');
        const value = input.value.trim();
        if (!value) return;
        const container = btn.closest('.add-item-wrapper').previousElementSibling || btn.closest('.add-item-wrapper').parentNode.querySelector('.choice-button-container');

        // Crea nuovo pulsante
        const newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.className = 'choice-btn';
        newBtn.textContent = value;
        container.appendChild(newBtn);

        // Resetta input e nasconde form
        input.value = '';
        btn.closest('.add-item-form').style.display = 'none';

        // Riaggiungi listener
        newBtn.addEventListener('click', () => {
            const hiddenInput = container.closest('fieldset').querySelector('.choice-holder');
            if (hiddenInput) hiddenInput.value = value;
        });
    });
});
