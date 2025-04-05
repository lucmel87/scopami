// Classe GameAI: set di azioni utili per la CPU
export class GameAI {
    
    getCPUBestMove(giocatoreCpu, cartaDaGiocare, tavolo, mazzo, carteGiocate) {
		let bestMove = null;
		let bestWeight = -1;
		let bestCount = -1;
		let hand = cartaDaGiocare != null ? [cartaDaGiocare] : giocatoreCpu.mano;
		//console.log("Mano CPU: " + hand.map(c => c.toString()).join(", "));
		for (let card of hand) {
			// controllaPrese restituisce un array di possibilità (ogni possibilità è un array di carte)
			let possibilities = this.controllaPrese(card, tavolo);
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
				if (bestPossibilityForCard.length === tavolo.length && tavolo.length > 0) {
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
			bestMove = { card: this.getLessValuableCard(hand, tavolo, mazzo, carteGiocate), captureSet: null, isScopa: false };
		}
		return bestMove;
	}

	/**
	 * Sceglie la carta con il valore più alto ma con il peso più piccolo
	 * @param {Array<Carta>} hand 
	 * @returns Carta
	 */
	getLessValuableCard(hand, tavolo, mazzo, carteGiocate) {
		console.log("Carte in mano:", hand.map(c => `${c.seme} ${c.valore} (Peso: ${c.peso})`).join(", "));
		console.log("Carte sul tavolo:", tavolo.map(c => `${c.seme} ${c.valore}`).join(", "));
		const sommaTavolo = tavolo.reduce((sum, carta) => sum + carta.valore, 0);
		console.log("Somma valori tavolo:", sommaTavolo);

		// Filtra le carte che possono essere giocate strategicamente
        let carteGiocatore = hand;
		let playableCards = hand.filter(carta => {
			let newTotal = sommaTavolo + carta.valore;
			let cardUnavailable = this.countRemainingCards(newTotal, carteGiocate, carteGiocatore) === mazzo.semi.length; // se sono uscite tutte le carte di quel valore

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
	countRemainingCards(value, carteGiocate, manoGiocatore) {
		let remainingCards = carteGiocate.concat(manoGiocatore); // carte giocate + carte del giocatore CPU
		let remaining = remainingCards.filter(carta => carta.valore === value).length;
		return remaining;
	}

	/**
	 * Controlla quali carte sul tavolo possono essere prese con la carta giocata.
	 * Se esiste una carta con lo stesso valore, restituisce quella possibilità.
	 * Altrimenti, restituisce tutte le combinazioni trovate che sommano al valore.
	 * Ogni possibilità è rappresentata come un array di carte.
	 */
	controllaPrese(cartaGiocata, tavolo) {
		// Filtra tutte le carte sul tavolo con lo stesso valore della carta giocata
		let equalCards = tavolo.filter(c => c.valore === cartaGiocata.valore);
		if (equalCards.length > 0) {
			//console.log("carte uguali: ", equalCards);
			// Restituisce una possibilità per ogni carta uguale trovata
			return equalCards.map(card => [card]);
		}
		// Altrimenti, trova tutte le combinazioni che sommano al valore della carta giocata
		let combinazioni = this.trovaCombinazioni(tavolo, cartaGiocata.valore);
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

}