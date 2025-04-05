// Classe Mazzo: gestisce la creazione, la mescolatura e la pesca delle carte
import {Carta} from './Carta.js';
export class Mazzo {
	constructor() {
		this.carte = [];
		this.originalLength=0;
		this.semi = ["Coppe", "Denari", "Spade", "Bastoni"];
		let cartePerSeme = 10; //Math.floor(numeroDiCarte/semi.length);
		// Crea tutte le carte del mazzo
		for (let seme of this.semi) {
			for (let valore = 1; valore <= cartePerSeme; valore++) {
				this.carte.push(new Carta(seme, valore));
				this.originalLength++;
			}
		}
		this.mescola();
	}

	// Mescola le carte casualmente
	mescola() {
		this.carte.sort(() => Math.random() - 0.5);
	}

	// Restituisce l'ultima carta del mazzo (la "pesca")
	pescaCarta() {
		return this.carte.pop();
	}
}