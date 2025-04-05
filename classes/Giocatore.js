export class Giocatore {
	constructor(type, nome) {
		this.type = type; // 'player o CPU
		this.isCPU = (type!=null && type.toLowerCase()=="cpu") ? true : false; // 'player o CPU
		this.index = 0; // indice 0 è sempre il giocatore
		this.nome = nome;
		this.mano = [];
		this.prese = [];
		this.carteDenari = []; // Totale carte denaro raccolte
		this.settebello = false;     // Scope fatte in questa mano
		this.scopaCount = 0;     // Scope fatte in questa mano
		this.cartePrimiera = {}; // carte della primiera
		this.punteggioPrimiera = 0; // Punti primiera fatti nella mano terminata
		this.punteggioMano = 0; // Totale punti della mano
		this.punteggioTotale = 0; // Punti cumulativi di tutte le mani
	}

	setIndex(index){ // imposta a che indice si trova il giocatore nell'array giocatori
		this.index = index;
	}

	generateDivPrefix(){
		return (this.index==0) ? this.type : this.type + this.index;
		
	}
	getCaputureDivName(){
		
		return `${cpuPrefix}-captures`;
	}
	// Aggiunge una carta alla mano del giocatore
	riceviCarta(carta) {
		this.mano.push(carta);
	}
	togliCarta(carta){
		this.mano.pop(carta);
	}
	resetMano(){
		this.mano = [];
		this.prese = [];
		this.settebello = false; 	// Scope fatte in questa mano
		this.cartePrimiera = {}; 	// Punti della mano
		this.carteDenari = []; 	// Totale carte denaro raccolte
		this.punteggioMano = 0; 	// Punti della mano
		this.punteggioPrimiera = 0;// Punti primiera fatti nella mano terminata
		this.scopaCount = 0;
	}
}