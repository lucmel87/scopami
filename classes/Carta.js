// Classe Carta: rappresenta una singola carta e ne calcola il peso secondo le regole aggiornate
export class Carta {
	constructor(seme, valore) {
		this.seme = seme;
		this.valore = valore;
		this.peso = this.calcolaPeso();
		this.uniqueId = seme + "-" + valore;
	}
	// Calcola il peso in base al seme e al valore:
	// - Se è di Denari: il 7 vale 10, le altre valgono 6.
	// - Negli altri semi: 7 vale 7, 6 vale 6, 5 vale 5, 1 vale 5, le altre valgono 1.
	calcolaPeso() {
		if (this.seme === "Denari") {
			if (this.valore === 7) return 11;
			return 7;
		}
		if (this.valore === 7) return 9;
		if (this.valore === 6) return 7;
		if (this.valore === 5) return 5;
		if (this.valore === 1) return 4;
		return 1;
	}
	// Restituisce una stringa descrittiva della carta
	toStringDebug() {
		return `${this.valore} di ${this.seme} (Peso: ${this.peso})`;
	}
	
	// Restituisce una stringa descrittiva della carta
	toString() {
		return `${this.valore} di ${this.seme}`;
	}

	getCardImagePath(){
		return `images/cards/${this.seme.toLowerCase()}${this.valore}.png`;
	}
	renderCard(destination) {
		let cardDiv = document.createElement("div");
		cardDiv.classList.add("card");
	
		if (destination == 'player') { 
			cardDiv.id = this.uniqueId;
			//cardDiv.textContent = `${this.valore} ${this.seme}`;
	
			// Nome file in lowercase
			let imagePath = this.getCardImagePath();
			
			// Imposta l'immagine di sfondo
			cardDiv.style.backgroundImage = `url('${imagePath}')`;
			cardDiv.style.backgroundSize = "cover";  
			cardDiv.style.backgroundPosition = "center"; 
			cardDiv.style.backgroundRepeat = "no-repeat"; 
	
			// Per migliorare la leggibilità del testo
			cardDiv.style.color = "white";
			cardDiv.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.8)";
			cardDiv.style.display = "flex";
			cardDiv.style.alignItems = "center";
			cardDiv.style.justifyContent = "center";
		}
		// else{
		// 	cardDiv.classList.add("half-card");
		// }
	
		return cardDiv;
	}
}