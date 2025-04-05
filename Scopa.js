// scopa.js
import { Mazzo } from './classes/Mazzo.js';
import { CalcolatorePunteggio } from './classes/CalcolatorePunteggio.js';
import { Giocatore } from './classes/Giocatore.js';
import { Render } from './classes/Render.js';

// Classe Scopa: contiene tutta la logica di gioco, incluse le nuove funzionalità di gestione delle mani e del punteggio cumulativo
class Scopa {
	constructor() {
		this.render = new Render();
		this.totCarteGiocate = 0;
		this.carteGiocate = [];
		this.mazzo = new Mazzo(40);
		this.playersNumber = document.getElementById("max-players").value;
		this.giocatori = this.initializePlayers();
		this.cartePerGiocatore = 3; // possibilità di cambiare a scopone facendo this.mazzo.length /  this.giocatori.length
		this.carteSulTavolo = 4; // possibilità di cambiare a scopone inserendo 10
		this.tavolo = [];
		this.turno = Math.floor(Math.random() * this.giocatori.length);
		this.ultimoGiocatoreAPrendere = null;
		this.maxPunti = 0; // Punteggio massimo impostato dall'utente
		this.manoCorrente = 1; // Numero della mano corrente (inizia da 1)
		this.playerCanClick = true;
	}

	initializePlayers() {
		let cpuNames = ['Abbondanzio', 'Aziele', 'Berengario', 'Cremenzio', 'Evodio', 'Ghita', 'Lidania', 'Manetto', 'Maruta', 'Zosima'];
		const playerNameInput = document.getElementById("player-name");
		let playerName = "Tu";
		if (playerNameInput && playerNameInput.value.trim() !== "") {
			playerName = playerNameInput.value.trim();
		}
		let giocatori = []; // inizializza i giocatori
		for (let i = 0; i < this.playersNumber; i++) {
			if (i == 0) { // in posizione 0 c'è sempre il giocatore
				giocatori.push(new Giocatore('player', playerName));
			} else { // tutto il resto è CPU
				let randomIndex = Math.floor(Math.random() * cpuNames.length); //indice casuale
				let selectedCPUName = cpuNames.splice(randomIndex, 1)[0]; // prelevo e rimuovo il nome usato
				let giocatoreCpu = new Giocatore("cpu", selectedCPUName);
				giocatoreCpu.setIndex(i);
				giocatori.push(giocatoreCpu);
				let cpuHtmlArea = this.render.createCpuAreas(i, selectedCPUName);
				document.querySelector('.game-board').insertAdjacentHTML('beforeend', cpuHtmlArea);
			}
		}
		document.querySelector('.game-board').insertAdjacentHTML('beforeend', this.render.renderTable());
		document.querySelector('.game-board').insertAdjacentHTML('beforeend', this.render.renderPlayerArea());
		return giocatori;
	}

	/**
	 * Inizia la partita:
	 */
	iniziaPartita() {
		// Aggiorna il nome del giocatore umano dall'input
		const maxPuntiSelect = document.getElementById("max-punti");
		if (maxPuntiSelect) {
			this.maxPunti = parseInt(maxPuntiSelect.value);
		}
		// Resetta i punteggi cumulativi e il numero della mano
		this.giocatori.forEach(giocatore => {
			giocatore.punteggioTotale = 0;
		});
		this.manoCorrente = 0; // resetto il numero di mano corrente

		// nascondo i settaggi inziali
		document.getElementById("game-settings").style.display = "none";
		document.getElementById("game-title").style.display = "none";
		document.getElementById("game-info").style.display = "block";
		document.querySelector('.game-board').style.display = 'block';
		if (!document.getElementById("show-information").checked) {
			document.getElementById("game-info").style.display = "none";
		}
		// prima mano
		this.preparaNuovaMano();
	}

	/**
	 * All'inizio di una nuova mano, la funzione inserisce le carte nell'array this.tavolo
	 * per poi mostrarle via aggiornaUI()
	 */
	mettiCarteSulTavolo() {
		this.tavolo = [];
		for (let ic = 0; ic < this.carteSulTavolo; ic++) {
			let cartePescata = this.mazzo.pescaCarta();
			this.tavolo.push(cartePescata);
			this.carteGiocate.push(cartePescata);
			this.totCarteGiocate++;
		}
	}

	// Distribuisce le carte per ciascun giocatore se il mazzo non è esaurito
	distribuisciCarte() {
		for (let i = 0; i < this.cartePerGiocatore; i++) {
			if (this.mazzo.carte.length > 0) {
				this.giocatori.forEach(giocatore => {
					giocatore.riceviCarta(this.mazzo.pescaCarta());
				});
			}
		}
	}

	/**
	 * Prepara una nuova mano:
	 */
	async preparaNuovaMano() {
		console.log("Preparazione di una nuova mano...");
		this.manoCorrente++; // Incrementa il numero della mano
		this.totCarteGiocate = 0;
		this.carteGiocate = [];
		// Resetta le statistiche di mano per ogni giocatore
		this.giocatori.forEach(giocatore => {
			giocatore.resetMano();
		});
		// Crea un nuovo mazzo per la nuova mano
		this.mazzo = new Mazzo();
		this.mettiCarteSulTavolo(); // 4 carte a terra: possibilità di renderlo scopone passando 0.
		this.distribuisciCarte();
		this.render.mostraMessaggiMano(); // aggiorna this.turno
		this.aggiornaUI();
		await this.render.showScopaPopup('Inizia la mano: ' + this.giocatori[this.turno].nome);
		// se è il turno della CPU inizia lui
		if (this.giocatori[this.turno].isCPU) {
			this.playerCanClick = false; // blocca click player
			setTimeout(() => this.cpuTurno(this.giocatori[this.turno]), 1500);
		}
	}

	/**
	* Gestisce il passaggio al turno successivo:
	* - Se entrambe le mani sono vuote, controlla se il mazzo ha ancora carte.
	*   In caso contrario, gestisce la fine della mano.
	*/
	async turnoSuccessivo() {
		this.aggiornaProssimoTurno();

		if (this.giocatori.every(giocatore => giocatore.mano.length === 0)) {
			if (this.mazzo.carte.length > 0) {
				this.distribuisciCarte();
			} else { // Fine mano: il mazzo è esaurito
				this.gestisciUltimaMano();
				return;
			}
		}
		this.aggiornaUI();
		if (this.giocatori[this.turno].isCPU) { // tocca alla CPU
			setTimeout(() => this.cpuTurno(this.giocatori[this.turno]), 500);
		}
	}

	aggiornaProssimoTurno() {
		this.turno = this.turno + 1;
		if (this.turno >= this.giocatori.length) {
			this.turno = 0;
		}
	}

	/**
	 * Gestisce l'ultima mano:
	 * - Se il tavolo non è vuoto, assegna le carte rimanenti all'ultimo giocatore che ha fatto presa.
	 * - Aggiorna l'interfaccia e poi calcola il punteggio della mano.
	 */
	gestisciUltimaMano() {
		console.log("Ultima mano. Tavolo prima di assegnare: " + this.tavolo.map(c => c.toString()).join(", "));
		if (this.ultimoGiocatoreAPrendere) {
			//console.log(`${this.ultimoGiocatoreAPrendere.nome} prende le carte rimaste sul tavolo.`);
			this.render.mostraMessaggiMano(`${this.ultimoGiocatoreAPrendere.nome} prende le carte rimaste sul tavolo.`);
			this.ultimoGiocatoreAPrendere.prese.push(...this.tavolo);
			this.tavolo = [];
		}
		this.aggiornaProssimoTurno();
		this.aggiornaUI();
		this.calcolaPunteggio(); // Calcola e mostra il riepilogo della mano
	}

	// Funzione per verificare se la partita è finita
	checkIfGameFinished() {
		let partitaFinita = false;
		let giocatoriVincenti = []; // Array per memorizzare i giocatori con il punteggio massimo
		let punteggioMaggiore = 0; // Imposta il punteggio massimo inizialmente a un valore molto basso
		let puntiVittoria = this.maxPunti;

		let giocatoreVincente = null;
		for (let giocatore of this.giocatori) {
			if (giocatore.punteggioTotale >= puntiVittoria && giocatore.punteggioTotale > punteggioMaggiore) {
				// Nuovo punteggio massimo trovato, resettiamo l'array dei vincitori
				giocatoriVincenti = [giocatore];
				punteggioMaggiore = giocatore.punteggioTotale;
			} else if (giocatore.punteggioTotale === punteggioMaggiore) {
				// Aggiungiamo il giocatore all'array se ha lo stesso punteggio massimo
				giocatoriVincenti.push(giocatore);
			}
		}
		// La partita è finita se c'è almeno un giocatore vincente e non ci sono pareggi
		if (giocatoriVincenti.length == 1) {
			partitaFinita = true;
			giocatoreVincente = giocatoriVincenti[0];
		}else if(giocatoriVincenti.length>1){
			partitaFinita = false;
		}

		return { partitaFinita, giocatoreVincente };
	}

	/**
	 * Aggiorna lo stato del gioco quando viene effettuata una presa.
	 * Aggiunge la carta giocata e quelle catturate alle prese del giocatore,
	 * rimuove le carte catturate dal tavolo e controlla se viene fatta scopa.
	 */
	async processCapture(giocatore, carta, presa) {
		this.ultimoGiocatoreAPrendere = giocatore;
		// Aggiunge le carte catturate e la carta giocata alle prese del giocatore
		giocatore.prese.push(...presa, carta);
		// Rimuove le carte catturate dal tavolo
		this.tavolo = this.tavolo.filter(c => !presa.includes(c));
		const scopaUltimaCarta = this.mazzo.carte.length === 0 && this.totCarteGiocate === this.mazzo.originalLength;
		// Verifica se è l'ultima giocata
		if (this.tavolo.length === 0) {
			if (scopaUltimaCarta) {
				console.log("Ultima mano, presa totale ma non è Scopa.");
			} else {
				giocatore.scopaCount++;
				await this.render.showScopaPopup(`Scopa!`);
				this.render.mostraMessaggiMano(`${giocatore.nome}: scopa con ${carta.toString()}!`);
			}
		}
		//console.log("Tavolo dopo la giocata DI : " + giocatore.nome + " " + this.tavolo.map(c => c.toString()).join(", "));
	}

	/**
	 * Logica di gioco carta con animazione al termine
	 * @param {Giocatore} giocatore 
	 * @param {Carta} carta 
	 * @param {HTMLElement} cardElement 
	 */

	async giocaCarta(giocatore, carta, cardElement) {
		// Impedisce ulteriori click durante l'animazione/giocata
		this.playerCanClick = false;
		this.carteGiocate.push(carta);
		this.totCarteGiocate++;
		// Rimuove la carta dalla mano del giocatore
		giocatore.mano = giocatore.mano.filter(c => c !== carta);

		let messaggio = giocatore.isCPU
			? `${giocatore.nome} ha giocato ${carta.toString()}`
			: `Hai giocato ${carta.toString()}`;

		//console.log(`--- Giocata di ${giocatore.nome} ---`);
		//console.log("Tavolo prima della giocata: " + this.tavolo.map(c => c.toString()).join(", "));
		// Controlla se la carta giocata permette di effettuare prese
		const possibiliPrese = this.controllaPrese(carta);
		let prese = null;
		if (possibiliPrese.length > 0) {
			// Se esiste almeno una possibilità di presa, sceglie quella di default
			prese = possibiliPrese[0];
			if (!giocatore.isCPU && possibiliPrese.length > 1) {
				// Per il giocatore umano, se ci sono più opzioni, chiede di scegliere quale presa effettuare
				prese = await this.render.showCapturePopup(possibiliPrese);
			} else if (giocatore.isCPU) {
				// Per la CPU, calcola la mossa migliore
				const bestMove = this.getCPUBestMove(giocatore, carta);
				prese = bestMove.captureSet;
			}
			// Elabora la presa e avvia l'animazione della carta
			this.processCapture(giocatore, carta, prese);
			await this.animazioneCarte(giocatore, carta, cardElement, prese);
		} else {
			// Nessuna presa disponibile: mostra un messaggio e aggiunge la carta sul tavolo
			//messaggio += " senza prese";
			this.tavolo.push(carta);
			await this.animazioneCarte(giocatore, carta, cardElement, null);
		}
		this.render.mostraMessaggiMano(messaggio);
		//console.log(`Rimuovo la carta: ${carta.valore} dalla mano del giocatore: ${giocatore.nome}`);
		// aggiorno il prossimo turno
		setTimeout(() => this.turnoSuccessivo(), 500);
	}

	/**
 * Animazione della presa:
 * - Clona le carte catturate, applica l'effetto "highlight" e le anima verso l'area delle prese.
 * - Rimuove le carte originali per evitare duplicazioni.
 * - Attende il completamento di tutte le animazioni prima di risolvere.
 */
	animateCapture(giocatore, prese) {
		//console.log("START ANIMATE CAPTURE ----");
		// Recupera l'area delle prese e ottiene il suo rettangolo di destinazione
		const captureDiv = document.getElementById(`${giocatore.generateDivPrefix()}-hand`);
		const destRect = captureDiv.getBoundingClientRect();

		// Per ogni carta da catturare, crea un clone e lo anima
		const clonePromises = prese.map(cardPrese => {
			let originalCard = document.getElementById(cardPrese.uniqueId);
			if (!originalCard) return Promise.resolve(); // Se l'elemento non esiste, salta

			// Ottieni la posizione e dimensioni della carta originale
			const startRect = originalCard.getBoundingClientRect();

			// Crea il clone per l'animazione e applica gli stili necessari
			const clone = originalCard.cloneNode(true);
			clone.classList.add("capture-highlight", "animated-clone");
			clone.style.position = "absolute";
			clone.style.left = `${startRect.left}px`;
			clone.style.top = `${startRect.top}px`;
			clone.style.width = `${startRect.width}px`;
			clone.style.height = `${startRect.height}px`;
			clone.style.zIndex = 1000;
			clone.style.transition = "transform 0.5s ease-out";
			document.body.appendChild(clone);
			// Rimuove l'originale per evitare duplicazioni
			originalCard.remove();
			// Forza il reflow per assicurarsi che lo stile sia applicato
			clone.offsetWidth;
			// Calcola la distanza (delta) tra la posizione di partenza e l'area di destinazione
			const deltaX = destRect.left - startRect.left;
			const deltaY = destRect.top - startRect.top;
			clone.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

			// Ritorna una Promise che si risolve quando l'animazione termina
			return new Promise(resolve => {
				clone.addEventListener("transitionend", () => {
					clone.remove();
					document.querySelectorAll(".animated-clone").forEach(clone => clone.remove());
					resolve();
				}, { once: true });
			});
		});

		// Attende il completamento di tutte le animazioni
		return Promise.all(clonePromises);
	}

	/**
	 * Animazione della giocata per il giocatore umano:
	 * - Anima la carta dal punto di origine (nella mano) al tavolo.
	 * - Se la giocata ha generato prese, attende e poi avvia l'animazione della cattura.
	 */
	async animazioneCarte(giocatore, carta, cardElement, prese) {
		this.playerCanClick = false;

		// Ottieni la posizione iniziale della carta e dell'area del tavolo
		const startRect = cardElement.getBoundingClientRect();
		const tableDiv = document.getElementById("table");
		const tableRect = tableDiv.getBoundingClientRect();
		const cardWidth = startRect.width;
		let targetX, targetY;

		// Se il tavolo è vuoto, centra la carta; altrimenti, posizionala accanto all'ultima esistente
		if (tableDiv.children.length === 0) {
			targetX = tableRect.left + (tableRect.width / 2) - (cardWidth / 2);
			targetY = tableRect.top + 10;
		} else {
			const lastCardRect = tableDiv.lastElementChild.getBoundingClientRect();
			targetX = lastCardRect.right + 10;
			targetY = lastCardRect.top;

			// Verifica se la carta supera il bordo destro della finestra
			const windowWidth = window.innerWidth;
			if (targetX + cardWidth > windowWidth) {
				// La carta va oltre il bordo destro della finestra
				targetX = tableRect.left + (tableRect.width / 2) - (cardWidth / 2); // Rimettere al centro
				targetY = lastCardRect.bottom + 10; // Posizionarla sotto l'ultima carta
			}
		}

		// Crea il clone della carta per l'animazione, applicando lo stile e l'effetto highlight
		const animatedCard = cardElement.cloneNode(true);
		animatedCard.style.backgroundImage = `url('${carta.getCardImagePath()}')`;
		animatedCard.id = carta.uniqueId;
		animatedCard.classList.add("capture-highlight", "animated-clone");
		animatedCard.style.backgroundSize = "cover";
		animatedCard.style.backgroundPosition = "center";
		animatedCard.style.backgroundRepeat = "no-repeat";
		animatedCard.style.position = "absolute";
		animatedCard.style.left = `${startRect.left}px`;
		animatedCard.style.top = `${startRect.top}px`;
		animatedCard.style.zIndex = 1000;
		animatedCard.style.transition = "all 0.5s ease-out";
		document.body.appendChild(animatedCard);

		// Rimuove l'elemento originale per evitare duplicazioni
		if (cardElement.parentElement) {
			cardElement.remove();
		}
		// Forza il reflow per assicurarsi che le modifiche siano applicate
		animatedCard.offsetWidth;
		// Calcola la distanza per l'animazione
		const deltaX = targetX - startRect.left;
		const deltaY = targetY - startRect.top;
		animatedCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

		// Attende il completamento della transizione
		await new Promise(resolve => {
			if (prese && prese.length > 0) {
				setTimeout(() => {
					this.animateCapture(giocatore, prese).then(resolve);
				}, 800);
			} else {
				resolve();
			}
		});
	}

	/**
	 * 1. Se esiste una mossa che cattura tutte le carte sul tavolo (scopa), la sceglie immediatamente.
	 * 2. Altrimenti, valuta ogni carta in mano:
	 *    - Per ciascuna, considera tutte le possibilità di presa (somma dei pesi e numero di carte).
	 *    - Sceglie la mossa che massimizza il punteggio (peso totale); in caso di parità, quella che cattura più carte.
	 * Se nessuna mossa permette una cattura, gioca la carta con il peso minore.
	 */
	cpuTurno(giocatoreCpu) {
		if (giocatoreCpu.mano.length > 0) {
			let bestMove = this.getCPUBestMove(giocatoreCpu, null); // la CPU non sa ancora che carta giocare, lascio NULL
			//console.log("best move scelta da CPU:", bestMove);
			let cardElement = document.getElementById(giocatoreCpu.generateDivPrefix() + "-hand").firstElementChild;
			this.giocaCarta(giocatoreCpu, bestMove.card, cardElement);
		}
	}

	getCPUBestMove(giocatoreCpu, cartaDaGiocare) {
		let bestMove = null;
		let bestWeight = -1;
		let bestCount = -1;
		let hand = cartaDaGiocare != null ? [cartaDaGiocare] : giocatoreCpu.mano;
		//console.log("Mano CPU: " + hand.map(c => c.toString()).join(", "));
		for (let card of hand) {
			// controllaPrese restituisce un array di possibilità (ogni possibilità è un array di carte)
			let possibilities = this.controllaPrese(card);
			if (possibilities.length > 0) {
				// Per la CPU scegliamo la possibilità migliore per questa carta
				let bestPossibilityForCard = possibilities[0];
				let bestPossWeightForCard = bestPossibilityForCard.reduce((acc, c) => acc + c.peso, card.valore);
				for (let possibility of possibilities) {
					let possWeight = possibility.reduce((acc, c) => acc + c.peso, card.valore);
					if (possWeight > bestPossWeightForCard) {
						bestPossibilityForCard = possibility;
						bestPossWeightForCard = possWeight;
					} else if (possWeight === bestPossWeightForCard && possibility.length > bestPossibilityForCard.length) {
						bestPossibilityForCard = possibility;
					}
				}
				// Se questa possibilità cattura tutte le carte sul tavolo, è una scopa
				if (bestPossibilityForCard.length === this.tavolo.length && this.tavolo.length > 0) {
					bestMove = { card: card, captureSet: bestPossibilityForCard, isScopa: true };
					break;
				}
				// Altrimenti, aggiorna la scelta se il punteggio (peso totale) è migliore
				if (bestPossibilityForCard.length > 0) {
					let weightSum = bestPossWeightForCard;
					let count = bestPossibilityForCard.length;
					if (weightSum > bestWeight || (weightSum === bestWeight && count > bestCount)) {
						bestWeight = weightSum;
						bestCount = count;
						bestMove = { card: card, captureSet: bestPossibilityForCard, isScopa: false };
					}
				}
			}
		}
		if (bestMove === null) {
			/* scelgo di usare la carta che ha meno valore
			@todo implementare controllo se la carta scelta con il totale sul tavolo è inferiore a 11 (non permettere di far fare scopa all'avversario)
			*/
			bestMove = { card: this.getLessValuableCard(hand), captureSet: null, isScopa: false };
		}
		return bestMove;
	}

	/**
	 * Sceglie la carta con il valore più alto ma con il peso più piccolo
	 * @param {Array<Carta>} hand 
	 * @returns Carta
	 */
	getLessValuableCard(hand) {
		console.log("Carte in mano:", hand.map(c => `${c.seme} ${c.valore} (Peso: ${c.peso})`).join(", "));
		console.log("Carte sul tavolo:", this.tavolo.map(c => `${c.seme} ${c.valore}`).join(", "));
		const sommaTavolo = this.tavolo.reduce((sum, carta) => sum + carta.valore, 0);
		console.log("Somma valori tavolo:", sommaTavolo);

		// Filtra le carte che possono essere giocate strategicamente
		let playableCards = hand.filter(carta => {
			let newTotal = sommaTavolo + carta.valore;
			let cardUnavailable = this.countRemainingCards(newTotal) === this.mazzo.semi.length; // se sono uscite tutte le carte di quel valore

			return (newTotal > 10 && newTotal !== 7) || cardUnavailable;
		});

		console.log("Carte giocabili strategicamente:",
			playableCards.length > 0 ? playableCards.map(c => `${c.seme} ${c.valore}`).join(", ") : "Nessuna, si userà tutta la mano"
		);

		let candidateCards = playableCards.length > 0 ? playableCards : hand;
		let leastValuableCard = candidateCards[0];
		let minWeight = leastValuableCard.peso;
		let minValue = leastValuableCard.valore;

		console.log("Inizio selezione della carta meno preziosa...");

		for (let card of candidateCards) {
			console.log(`Analizzando: ${card.seme} ${card.valore} (Peso: ${card.peso})`);
			if (card.peso < minWeight || (card.peso === minWeight && card.valore < minValue)) {
				console.log(`→ Nuova scelta: ${card.seme} ${card.valore} (Peso: ${card.peso}) perché ha peso minore o stesso peso con valore inferiore`);
				minWeight = card.peso;
				minValue = card.valore;
				leastValuableCard = card;
			}
		}

		console.log(`Carta scelta: ${leastValuableCard.seme} ${leastValuableCard.valore} (Peso: ${leastValuableCard.peso})`);

		return leastValuableCard;
	}

	// Filtra il mazzo per trovare le carte con il valore specificato
	countRemainingCards(value) {
		let remainingCards = this.carteGiocate.concat(this.giocatori[this.turno].mano); // carte giocate + carte del giocatore CPU
		let remaining = remainingCards.filter(carta => carta.valore === value).length;
		return remaining;
	}

	/**
	 * Controlla quali carte sul tavolo possono essere prese con la carta giocata.
	 * Se esiste una carta con lo stesso valore, restituisce quella possibilità.
	 * Altrimenti, restituisce tutte le combinazioni trovate che sommano al valore.
	 * Ogni possibilità è rappresentata come un array di carte.
	 */
	controllaPrese(cartaGiocata) {
		// Filtra tutte le carte sul tavolo con lo stesso valore della carta giocata
		let equalCards = this.tavolo.filter(c => c.valore === cartaGiocata.valore);
		if (equalCards.length > 0) {
			//console.log("carte uguali: ", equalCards);
			// Restituisce una possibilità per ogni carta uguale trovata
			return equalCards.map(card => [card]);
		}
		// Altrimenti, trova tutte le combinazioni che sommano al valore della carta giocata
		let combinazioni = this.trovaCombinazioni(this.tavolo, cartaGiocata.valore);
		//console.log("Ci sono possibili caombinazioniii ", combinazioni);
		return combinazioni; // Ogni elemento è un array di carte
	}

	trovaCombinazioni(carte, valore) {
		let risultati = [];
		function cercaCombinazioni(parziale, startIndex, somma) {
			if (somma === valore) {
				risultati.push([...parziale]);
				return;
			}
			if (somma > valore || startIndex >= carte.length) return;
			// Prova ad includere la carta corrente
			cercaCombinazioni([...parziale, carte[startIndex]], startIndex + 1, somma + carte[startIndex].valore);
			// Prova a escludere la carta corrente
			cercaCombinazioni([...parziale], startIndex + 1, somma);
		}
		cercaCombinazioni([], 0, 0);
		return risultati;
	}

	/**
	 * Aggiorna l'interfaccia
	 */
	aggiornaUI() {
		// Rimuove eventuali cloni animati residui
		document.querySelectorAll(".animated-clone").forEach(clone => clone.remove());
		// Aggiorna il numero della mano, se presente
		const handNumberDiv = document.getElementById("hand-number");
		if (handNumberDiv) {
			handNumberDiv.textContent = `Mano ${this.manoCorrente} - Carte nel mazzo: ${this.mazzo.carte.length} `; //(${this.carteGiocate})
		}
		// Aggiorna il tavolo: svuota il contenuto e aggiunge le carte secondo lo stato interno (this.tavolo)
		const tableDiv = document.getElementById("table");
		tableDiv.innerHTML = "";
		this.tavolo.forEach(carta => {
			let cardDiv = carta.renderCard('player'); // scoperta
			// Verifica se ci sono più di 6 carte e riduci la dimensione
			if (this.tavolo.length > 6) {
				cardDiv.style.transform = 'scale(0.8)'; // Rimpicciolisce del 10%
			}
			tableDiv.appendChild(cardDiv);
		});

		this.giocatori.forEach(giocatore => {
			let handDiv = document.getElementById(giocatore.generateDivPrefix() + "-hand");
			handDiv.innerHTML = "";
			giocatore.mano.forEach(carta => {
				let cardDiv = carta.renderCard(giocatore.type); //prod: carta.renderCard(giocatore.type);
				if (giocatore.type === 'player') {
					cardDiv.addEventListener("click", (event) => {
						if (!this.playerCanClick) return;
						event.currentTarget.style.pointerEvents = "none";
						this.giocaCarta(giocatore, carta, event.currentTarget);
					});
				}
				handDiv.appendChild(cardDiv);
			});
			// Aggiorna il riepilogo delle prese per il giocatore umano
			let capturesDiv = document.getElementById(giocatore.generateDivPrefix() + "-captures");
			if (capturesDiv) {
				capturesDiv.innerHTML = "";
				capturesDiv.textContent = `Prese: ${giocatore.prese.length} carte | Scope: ${giocatore.scopaCount} | Punti: ${giocatore.punteggioTotale}`;
			}
		});
		if (!this.giocatori[this.turno].isCPU) {
			this.playerCanClick = true;
		}
	}

	/**
	 * Calcola il punteggio della mano corrente e lo somma al punteggio cumulativo.
	 */
	calcolaPunteggio() {
		// inizializza e calcola i punti della mano partendo dalle scope
		this.giocatori.forEach(giocatore => {
			let punteggio = new CalcolatorePunteggio(giocatore.prese);
			giocatore.punteggioMano = giocatore.scopaCount; // inizializzazione e somma scope
			giocatore.carteDenari = punteggio.calcolaCarteDenari();
			giocatore.punteggioPrimiera = punteggio.calcolaPrimiera();
			giocatore.cartePrimiera = punteggio.cartePrimiera;
			giocatore.settebello = punteggio.calcolaSettebello();
			giocatore.punteggioMano += giocatore.settebello;
		});
		let maxPrese = this.giocatori.reduce((max, giocatore) => {
			return giocatore.prese.length > max ? giocatore.prese.length : max;
		}, 0);
		// Trova tutti i giocatori che hanno il numero massimo di prese
		let giocatoriConMaxPrese = this.giocatori.filter(giocatore => giocatore.prese.length === maxPrese);
		if (giocatoriConMaxPrese.length === 1) {
			// Trova l'indice del giocatore nell'array originale `this.giocatori`
			let indiceGiocatore = this.giocatori.indexOf(giocatoriConMaxPrese[0]);
			// Aggiungi 1 al punteggio del giocatore
			this.giocatori[indiceGiocatore].punteggioMano += 1;
			//console.log(`${this.giocatori[indiceGiocatore].nome} ha raccolto più carte: ${this.giocatori[indiceGiocatore].prese.length}`);
		}
		let maxCarteDenaro = this.giocatori.reduce((max, giocatore) => {
			return giocatore.carteDenari.length > max ? giocatore.carteDenari.length : max;
		}, 0);
		// Trova tutti i giocatori che hanno il numero massimo di prese
		let giocatoriConMaxCarteDenaro = this.giocatori.filter(giocatore => giocatore.carteDenari.length === maxCarteDenaro);
		// Se c'è solo un giocatore con il numero massimo di prese, aggiorna il suo punteggio
		if (giocatoriConMaxCarteDenaro.length === 1) {
			let indiceGiocatoreDenari = this.giocatori.indexOf(giocatoriConMaxCarteDenaro[0]);
			this.giocatori[indiceGiocatoreDenari].punteggioMano += 1; // 1 punto per i denari
		}
		let maxPrimiera = this.giocatori.reduce((max, giocatore) => {
			return giocatore.punteggioPrimiera > max ? giocatore.punteggioPrimiera : max;
		}, 0);
		// Trova tutti i giocatori che hanno il numero massimo di prese
		let giocatoriPrimiera = this.giocatori.filter(giocatore => giocatore.punteggioPrimiera === maxPrimiera);
		// Se c'è solo un giocatore con il numero massimo di prese, aggiorna il suo punteggio
		if (giocatoriPrimiera.length === 1) {
			let indiceGiocatoriPrimiera = this.giocatori.indexOf(giocatoriPrimiera[0]);
			this.giocatori[indiceGiocatoriPrimiera].punteggioMano += 1;
		}
		// Aggiorna il punteggio cumulativo
		this.giocatori.forEach(giocatore => {
			giocatore.punteggioTotale += giocatore.punteggioMano;
		});
		// Mostra il popup riepilogativo della mano
		const { partitaFinita, giocatoreVincente } = this.checkIfGameFinished();
		this.render.showHandSummaryPopup(partitaFinita, this.giocatori, giocatoreVincente, this.manoCorrente, this.preparaNuovaMano.bind(this), this.iniziaPartita.bind(this));
		(partitaFinita, giocatoriVincenti);
	}
}


// Inizializza il gioco una volta che il DOM è pronto
document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("start-game").addEventListener("click", () => {
		const gioco = new Scopa();
		gioco.iniziaPartita();
	});
});
