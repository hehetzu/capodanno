let ordine = {
    pizza: [],
    antipasti: [],
    primi: [],
    secondi: [],
    dolci: [],
    fuochi: ''
};

function scegliPizza(scelta){
    if(scelta === 'yes'){
        document.getElementById('gustoPizzaSection').style.display = 'block';
    }
    ordine.pizza = scelta === 'yes' ? [] : [];
}

function proseguiAntipasti(){
    // raccogli pizza scelta
    let gusti = document.querySelectorAll('.gustoPizza:checked');
    gusti.forEach(g => ordine.pizza.push(g.value));
    let altro = document.getElementById('altroGustoPizza').value;
    if(altro) ordine.pizza.push(altro);

    document.getElementById('pizzaSection').style.display = 'none';
    document.getElementById('gustoPizzaSection').style.display = 'none';
    document.getElementById('antipastiSection').style.display = 'block';
}

function proseguiPrimo(){
    let antipasti = document.querySelectorAll('.antipasti:checked');
    ordine.antipasti = [];
    antipasti.forEach(a => ordine.antipasti.push(a.value));
    let altro = document.getElementById('altroAntipastoText').value;
    if(altro) ordine.antipasti.push(altro);

    document.getElementById('antipastiSection').style.display = 'none';
    document.getElementById('primoSection').style.display = 'block';
}

function proseguiSecondo(){
    let primi = document.querySelectorAll('.primi:checked');
    ordine.primi = [];
    primi.forEach(p => ordine.primi.push(p.value));
    let altro = document.getElementById('altroPrimoText').value;
    if(altro) ordine.primi.push(altro);

    document.getElementById('primoSection').style.display = 'none';
    document.getElementById('secondoSection').style.display = 'block';
}

function proseguiDolce(){
    let secondi = document.querySelectorAll('.secondi:checked');
    ordine.secondi = [];
    secondi.forEach(s => ordine.secondi.push(s.value));
    let altro = document.getElementById('altroSecondoText').value;
    if(altro) ordine.secondi.push(altro);

    document.getElementById('secondoSection').style.display = 'none';
    document.getElementById('dolceSection').style.display = 'block';
}

function proseguiFuochi(){
    let dolci = document.querySelectorAll('.dolci:checked');
    ordine.dolci = [];
    dolci.forEach(d => ordine.dolci.push(d.value));
    let altro = document.getElementById('altroDolceText').value;
    if(altro) ordine.dolci.push(altro);

    document.getElementById('dolceSection').style.display = 'none';
    document.getElementById('fuochiSection').style.display = 'block';
}

function proseguiRiepilogo(){
    ordine.fuochi = document.getElementById('fuochiSi').checked ? 'Sì' : 'No';

    document.getElementById('fuochiSection').style.display = 'none';
    document.getElementById('riepilogoSection').style.display = 'block';

    aggiornaRiepilogo();
}

function aggiornaRiepilogo(){
    let riepilogo = `Pizza: ${ordine.pizza.join(', ') || 'Nessuna'}\n`;
    riepilogo += `Antipasti: ${ordine.antipasti.join(', ') || 'Nessuno'}\n`;
    riepilogo += `Primi: ${ordine.primi.join(', ') || 'Nessuno'}\n`;
    riepilogo += `Secondi: ${ordine.secondi.join(', ') || 'Nessuno'}\n`;
    riepilogo += `Dolci: ${ordine.dolci.join(', ') || 'Nessuno'}\n`;
    riepilogo += `Fuochi d'artificio: ${ordine.fuochi}`;

    document.getElementById('riepilogoText').textContent = riepilogo;
}
