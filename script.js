// Selettore canvas e contesto
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');

// Impostiamo dimensioni dinamiche
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Funzione fuochi d'artificio (semplificata per mobile)
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

const fireworks = [];
const fireworkCount = window.innerWidth < 768 ? 20 : 50; // meno fuochi su mobile
for (let i = 0; i < fireworkCount; i++) fireworks.push(new Firework());

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

// --- Avatar Top Row (hover scaling su mobile ridotto) ---
const avatars = document.querySelectorAll('.voter-top-avatar');
avatars.forEach(avatar => {
  avatar.addEventListener('mouseover', () => {
    if (window.innerWidth > 480) avatar.style.transform = 'scale(1.1)';
  });
  avatar.addEventListener('mouseout', () => avatar.style.transform = 'scale(1)');
});

// --- Pulsanti di scelta ---
const choiceButtons = document.querySelectorAll('.choice-btn');
choiceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // toggle attivo
    btn.classList.toggle('active-choice');
    const checkbox = document.querySelector(`#${btn.htmlFor}`);
    if (checkbox) checkbox.checked = !checkbox.checked;
  });
});

// --- Modal / Popup ---
function showModal(modalId) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.querySelector(`fieldset[data-modal="true"]#${modalId}`);
  if (!overlay || !modal) return;
  
  overlay.style.display = 'block';
  modal.style.display = 'block';
  document.body.classList.add('modal-active');
}

function closeModal(modalId) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.querySelector(`fieldset[data-modal="true"]#${modalId}`);
  if (!overlay || !modal) return;

  modal.classList.add('fade-out');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('fade-out');
    overlay.style.display = 'none';
    document.body.classList.remove('modal-active');
  }, 500);
}

// Chiudi modal cliccando overlay
document.getElementById('modal-overlay')?.addEventListener('click', () => {
  document.querySelectorAll('fieldset[data-modal="true"]').forEach(modal => closeModal(modal.id));
});

// --- Ridimensionamento per mobile ---
// Aggiorna numero di fuochi se ridimensioniamo
window.addEventListener('resize', () => {
  const newCount = window.innerWidth < 768 ? 20 : 50;
  while (fireworks.length < newCount) fireworks.push(new Firework());
  fireworks.length = newCount;
});
