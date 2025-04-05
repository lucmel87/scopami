export class CalcolatorePunteggio {
	constructor(prese) {
		this.prese = prese;
		this.primieraCarteValide = [1, 2, 3, 4, 5, 6, 7];
		this.carteDenari = [];
		this.cartePrimiera = { "Coppe": [], "Denari": [], "Spade": [], "Bastoni": [] };
	}

	calcolaPesoPrimiera(valore) {
		if (valore === 7) return 21;
		if (valore === 6) return 18;
		if (valore === 1) return 16;
		if (valore === 5) return 15;
		if (valore === 4) return 14;
		if (valore === 3) return 13;
		if (valore === 2) return 12;
	}

	calcolaCarteDenari() {
		this.carteDenari = this.prese.filter(carta => (carta.seme === 'Denari'));
		console.log("carteDenari", this.carteDenari);
		return this.carteDenari;
	}

	organizzaCartePrimiera() {
		this.prese.forEach(carta => {
			if (this.primieraCarteValide.includes(carta.valore)) {
				this.cartePrimiera[carta.seme].push(carta);
			}
		});
		console.log("cartePrimiera", this.cartePrimiera);
	}

	calcolaSettebello() {
		const cartaSettebello = this.prese.find(carta => carta.valore === 7 && carta.seme === "Denari");
		return cartaSettebello !== undefined;
	}

	calcolaPrimiera() {
		let sommaPrimiera = 0;
		// Organizza le carte nei semi
		this.organizzaCartePrimiera();
		// Verifica ogni seme e calcola il peso della primiera
		for (let seme in this.cartePrimiera) {
			let carteSeme = this.cartePrimiera[seme];
			if (carteSeme.length === 0) {
				// Se non ci sono carte valide per un seme, restituisci 0
				return 0;
			}
			// Trova la carta con il valore massimo per il seme
			let cartaMax = carteSeme.reduce((max, carta) => {
				return carta.valore > max.valore ? carta : max;
			});
			// Aggiungi il peso della carta con il valore massimo
			sommaPrimiera += this.calcolaPesoPrimiera(cartaMax.valore);
		}
		return sommaPrimiera;
	}
}