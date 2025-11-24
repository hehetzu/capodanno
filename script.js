// --------------------
// Gestione fieldset
// --------------------
const fieldsets = document.querySelectorAll('fieldset');
let currentStep = 0;
fieldsets.forEach((fs, idx) => fs.classList.contains('active') ? currentStep = idx : null);

function showStep(index) {
    fieldsets.forEach(fs => fs.classList.remove('active'));
    if (fieldsets[index]) fieldsets[index].classList.add('active');
    currentStep = index;
}

document.querySelectorAll('.prev-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(currentStep-1));
});
document.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(currentStep+1));
});

document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const choice = btn.dataset.choice;
        const nextStepName = btn.dataset.nextStep;
        const parentFS = btn.closest('fieldset');
        const hiddenInput = parentFS.querySelector('.choice-holder');
        if(hiddenInput) hiddenInput.value = choice;
        if(nextStepName){
            const nextFS = document.querySelector(`fieldset[data-step-name="${nextStepName}"]`);
            if(nextFS){ fieldsets.forEach(fs => fs.classList.remove('active')); nextFS.classList.add('active'); }
        }
    });
});

// --------------------
// Modal popup
// --------------------
const overlay = document.getElementById('modal-overlay');
function showModal(modalFS){
    overlay.style.display = 'block';
    modalFS.style.display = 'block';
    document.body.classList.add('modal-active');
}
function closeModal(modalFS){
    modalFS.style.display = 'none';
    overlay.style.display = 'none';
    document.body.classList.remove('modal-active');
}
document.getElementById('close-popup-btn')?.addEventListener('click', () => {
    const modal = document.querySelector('fieldset[data-step-name="custom-message-popup"]');
    if(modal) closeModal(modal);
});

// --------------------
// Aggiunta nuove opzioni
// --------------------
document.querySelectorAll('.show-add-form-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const formWrapper = btn.nextElementSibling;
        formWrapper.style.display = (formWrapper.style.display === 'block') ? 'none' : 'block';
    });
});

document.querySelectorAll('.add-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.closest('.add-item-form').querySelector('.new-item-input');
        const value = input.value.trim();
        if(!value) return;
        const container = btn.closest('.add-item-wrapper').previousElementSibling || btn.closest('.add-item-wrapper').parentNode.querySelector('.choice-button-container');
        const newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.className = 'choice-btn';
        newBtn.textContent = value;
        container.appendChild(newBtn);
        input.value = '';
        btn.closest('.add-item-form').style.display = 'none';
        newBtn.addEventListener('click', () => {
            const hiddenInput = container.closest('fieldset').querySelector('.choice-holder');
            if(hiddenInput) hiddenInput.value = value;
        });
    });
});