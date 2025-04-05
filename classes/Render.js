export class Render {
	giocatori = null;
	prossimaManoAction = null;

	createCpuAreas(index, CPUName ){
		let htmlArea = `<div id="cpu${index}-opponent-area" class="opponent-area">
							<div id="cpu${index}-main-box" class="cpu-main-box">
								<div id="cpu${index}-hand-box" class="cpu-hand-box">
									<h3><span id="cpu${index}-player-name">${CPUName}</span> <span id="cpu${index}-captures" class="captures-container"></span></h3>
									<div id="cpu${index}-hand" class="cpu-hand cards-container cpu"></div>
								</div>
							</div>
						</div>`;
		return htmlArea;
	}

	renderTable(){
		return  `<!-- Area Tavolo -->
				<div class="table-area">
					<div id="table" class="cards-container"></div>
				</div>`;
	}

	renderPlayerArea(){
		return `<!-- Area Giocatore -->
                <div class="player-area">
                    <h3>Tu <div id="player-captures" class="captures-container"></div></h3>
                    <div id="player-hand" class="cards-container"></div>
                </div>`;
	}
	/**
	 * Mostra un popup animato per indicare che è stata fatta una "Scopa".
	 * Il messaggio si espande dal centro con un'animazione festosa e scompare dopo l'effetto.
	 */
	showScopaPopup(message) {
		return new Promise((resolve) => {
			// Verifica se esiste già un popup e lo rimuove
			const existingPopup = document.querySelector(".scopa-popup");
			if (existingPopup) {
				existingPopup.remove();
			}

			// Crea un nuovo popup pulito
			const popup = document.createElement("div");
			popup.classList.add("scopa-popup");

			// Crea un contenitore per il messaggio per migliore styling
			const messageContainer = document.createElement("div");
			messageContainer.classList.add("scopa-message");
			messageContainer.textContent = message;

			// Aggiungi elementi decorativi (opzionale)
			const leftStar = document.createElement("span");
			leftStar.classList.add("scopa-star", "left-star");
			leftStar.textContent = "★";

			const rightStar = document.createElement("span");
			rightStar.classList.add("scopa-star", "right-star");
			rightStar.textContent = "★";

			// Assembla il popup
			popup.appendChild(leftStar);
			popup.appendChild(messageContainer);
			popup.appendChild(rightStar);

			document.body.appendChild(popup);

			// Forza il reflow per attivare la transizione
			popup.offsetWidth;
			popup.classList.add("show");

			// Mostra per 1.3 secondi, poi attendi 0.5 secondi prima di nascondere
			setTimeout(() => {
				popup.classList.remove("show");
				setTimeout(() => resolve(popup.remove()), 500);
			}, 1800); // 1300ms di animazione + 500ms di attesa
		});
	}

	/**
	 * Mostra un popup riepilogativo della mano:
	 * Se la partita non è finita, il popup mostra il pulsante "Gioca prossima mano"
	 */
	showHandSummaryPopup(partitaFinita, giocatori, giocatoreVincente, manoCorrente, prossimaManoAction, nuovaPartitaAction) {
		this.prossimaManoAction = prossimaManoAction;
		this.nuovaPartitaAction = nuovaPartitaAction;
		const popup = document.getElementById("recap-game-hand");
		popup.innerHTML = ''; // Pulisce il contenuto precedente

		// Creazione dell'HTML della tabella riassuntiva
		let recapHtml = this.createRecapTable(manoCorrente, giocatori);
		popup.innerHTML = recapHtml;

		// Crea il contenitore per i pulsanti
		const buttonContainer = this.createButtonContainer(partitaFinita, giocatoreVincente);
		popup.appendChild(buttonContainer);

		// Mostra il popup
		popup.classList.add("show");
	}
	// Funzione per creare l'HTML della tabella riassuntiva
	createRecapTable(manoCorrente, giocatori) {
		this.giocatori = giocatori;
		let recapHtml = `
				<h2>Mano ${manoCorrente} Terminata</h2>
				<div class="recap-table-container">
					<table class="recap-table">
						<thead>
							<tr><th>Recap</th>`;

		// Creazione delle intestazioni per ogni giocatore
		giocatori.forEach(giocatore => {
			recapHtml += `<th>${giocatore.nome}</th>`;
		});

		recapHtml += `</tr></thead><tbody>`;

		// Creazione delle righe per le statistiche dei giocatori
		recapHtml += this.createStatRow("Prese", giocatore => giocatore.prese.length);
		recapHtml += this.createStatRow("Scope", giocatore => giocatore.scopaCount);
		recapHtml += this.createStatRow("Carte di denari", giocatore => giocatore.carteDenari.length);
		recapHtml += this.createStatRow("Primiera", giocatore => giocatore.punteggioPrimiera);
		recapHtml += this.createStatRow("Settebello", giocatore => giocatore.settebello ? "★" : "");
		recapHtml += this.createStatRow("Punti mano", giocatore => giocatore.punteggioMano);
		recapHtml += this.createStatRow("Punteggio Totale", giocatore => giocatore.punteggioTotale);

		recapHtml += `</tbody></table></div>`;
		return recapHtml;
	}

	// Funzione per creare una singola riga della tabella per una statistica
	createStatRow(label, statFn) {
		let rowHtml = `<tr><td>${label}</td>`;
		this.giocatori.forEach(giocatore => {
			rowHtml += `<td>${statFn(giocatore)}</td>`;
		});
		rowHtml += `</tr>`;
		return rowHtml;
	}

	// Funzione per creare i pulsanti (chiudi o gioca prossima mano)
	createButtonContainer(partitaFinita, giocatoreVincente) {
		const buttonContainer = document.createElement("div");
		buttonContainer.className = "recap-buttons";

		if (partitaFinita && giocatoreVincente) {
			const winnerName = giocatoreVincente.nome;
			const winnerMessage = this.createWinnerMessage(winnerName);
			buttonContainer.appendChild(winnerMessage);
			const btnPlayAgain = this.createPlayAgainButton();
			buttonContainer.appendChild(btnPlayAgain);
		} else {
			const btnNext = this.createNextRoundButton();
			buttonContainer.appendChild(btnNext);
		}

		return buttonContainer;
	}

	// Funzione per creare il messaggio di vittoria
	createWinnerMessage(winnerName) {
		const winnerMessage = document.createElement("p");
		winnerMessage.className = "winner-message";
		winnerMessage.textContent = `🏆 ${winnerName} ha vinto la partita! 🏆`;
		return winnerMessage;
	}

	createPlayAgainButton() {
		const btnNext = document.createElement("button");
		btnNext.textContent = "Gioca di nuovo!";
		btnNext.className = "recap-button playagain-button";
		btnNext.onclick = () => {
			document.getElementById("recap-game-hand").classList.remove("show");
			this.nuovaPartitaAction();
		};
		return btnNext;
	}

	// Funzione per creare il pulsante per la prossima mano
	createNextRoundButton() {
		const btnNext = document.createElement("button");
		btnNext.textContent = "Gioca prossima mano";
		btnNext.className = "recap-button next-button";
		btnNext.onclick = () => {
			document.getElementById("recap-game-hand").classList.remove("show");
			this.prossimaManoAction();
		};
		return btnNext;
	}

	/**
	 * Mostra un popup al player per scegliere tra le possibilità di presa.
	 * @param {Array} possibilities - Array di possibilità (ogni possibilità è un array di carte)
	 * @param {Function} callback - Funzione da chiamare con la possibilità scelta
	 */

	showCapturePopup(possibilities) {
		return new Promise((resolve) => {
			// Creazione del popup
			let popup = document.createElement("div");
			popup.id = "capture-popup";
			popup.innerHTML = `<div class="popup-content">
            <h3>Scegli la presa:</h3>
            <div id="popup-choices"></div>
        </div>`;

			// Aggiunta del popup al body
			document.body.appendChild(popup);

			let choicesContainer = popup.querySelector("#popup-choices");

			// Creazione dei gruppi di carte per ogni possibilità
			possibilities.forEach((poss) => {
				let choiceDiv = document.createElement("div");
				choiceDiv.classList.add("presa-multipla");

				// Aggiunge ogni carta come un elemento figlio del div di scelta
				poss.forEach(carta => {
					let cardElement = carta.renderCard('player'); // Restituisce un div con l'immagine della carta
					choiceDiv.appendChild(cardElement);
				});

				// Click sulla scelta
				choiceDiv.onclick = () => {
					document.body.removeChild(popup); // Rimuove il popup dopo la selezione
					resolve(poss); // Risolve la Promise con la scelta dell'utente
				};
				choicesContainer.appendChild(choiceDiv);
			});
		});
	}


	/**
	 * Aggiorna il testo con chi deve inziare la mano
	 */
	mostraMessaggiMano(messaggio) {
		document.getElementById("hand-message").textContent = messaggio;
	}


	/*
	showCapturePopup(possibilities, callback) {
		let message = "Scegli la presa:\n";
		possibilities.forEach((poss, i) => {
			// Si assume che ogni carta disponga di un metodo toString() per la visualizzazione
			let possStr = poss.map(c => c.toString()).join(" + ");
			message += `${i + 1}: ${possStr}\n`;
		});
		// Utilizziamo window.prompt per la semplicità (in un'app reale sostituire con un popup custom)
		let choice = window.prompt(message, "1");
		let index = parseInt(choice, 10) - 1;
		if (isNaN(index) || index < 0 || index >= possibilities.length) {
			index = 0; // Default alla prima possibilità
		}
		callback(possibilities[index]);
	}
		*/

}