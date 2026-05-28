document.addEventListener('DOMContentLoaded', () => {

    // --- Lógica de Autenticación de Sesión ---
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const loggedInUser = JSON.parse(user);
    console.log(`Usuario autenticado: ${loggedInUser.username}`);


    // --- Variables y Elementos del DOM ---
    const statutext = document.querySelector("#statustext");
    const cells = document.querySelectorAll(".cell");
    const btnPVP = document.querySelector("#btnPVP");
    const btnCPU = document.querySelector("#btnCPU");
    const cpuButtons = document.querySelectorAll(".cpuBtn");
    const cpuOptions = document.querySelector("#cpuOptions");
    const btnResetScoreboard = document.querySelector("#resetScoreboard");
    const scoreXEl = document.getElementById("scoreX");
    const scoreOEl = document.getElementById("scoreO");
    const scoreEmpatesEl = document.getElementById("scoreEmpates");

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.querySelector('.close-btn');
    const muteToggle = document.getElementById('muteToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const audio = new Audio("./scr/Js/Audio/tomAndJerry.mp3");
   

    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],// filas

        [0, 3, 6], [1, 4, 7], [2, 5, 8],// columnas

        [0, 4, 8], [2, 4, 6] // diagonales
    ];

    let currentPlayer = 'X';
    let gameActive = false;
    let options = ['', '', '', '', '', '', '', '', ''];
    let mode = "PVP";
    let difficulty = "easy";
    let scores = JSON.parse(localStorage.getItem("scoreboard")) || { X: 0, O: 0, Empates: 0 };


    // --- Funciones de Inicialización y Estado ---
    function initializeGame() {
        document.addEventListener("DOMContentLoaded", () => {
        bgMusic.play().catch(() => {
        console.log("El navegador bloqueó autoplay. Se reproducirá tras la primera interacción.");
      }); });
      
        checkDailyReset();// Reiniciar el marcador si es un nuevo día
        loadGame();// Cargar el estado del juego si existe
        renderWinners();// Mostrar el marcador
        renderBoard();// Renderizar el tablero
        loadSettings();// Cargar configuraciones de audio

        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    }
    
    /// --- Funciones de Control del Juego ---
    function startGame() {
        restartGame();
        gameActive = true;
        statustext.textContent = `Turno de ${currentPlayer}`;
    }
    
    // Reiniciar el juego
    function restartGame() {
        currentPlayer = 'X';
        gameActive = false;
        options = ['', '', '', '', '', '', '', '', ''];
        cells.forEach(cell => {
            cell.classList.remove('X', 'O');
        });
        localStorage.removeItem("ticTacToe");
        renderBoard();
        statustext.textContent = `Turno de ${currentPlayer}`;
    }

    // --- Funciones de Juego ---
    function handleCellClick(e) {
        if (!gameActive) {
            statutext.textContent = "¡Presiona 'X vs O' o 'X vs CPU' para empezar!";
            return;
        }
        // Obtener el índice de la celda clickeada
        const cellIndex = e.target.getAttribute("cellGame");
        if (options[cellIndex] !== "") return;
        // Colocar la marca y verificar el ganador
        placeMark(e.target, cellIndex);
        checkWinner();
        // Si es el turno del CPU, hacer su movimiento
        if (gameActive && mode === "CPU" && currentPlayer === "O") {
            setTimeout(cpuMove, 400);
        }
    }
    // Colocar la marca en la celda
    function placeMark(cell, index) {
    if (!muteToggle.checked) {
        if (!audio.paused) {
            audio.pause();
        }
        audio.currentTime = 0; 
        audio.volume = volumeSlider.value;
        audio.play().catch(err => console.error("Error al reproducir audio:", err));
    }
    // Colocar la marca y actualizar el estado
    options[index] = currentPlayer;
    cell.classList.add(currentPlayer);}

    // Cambiar el jugador actual
    function changePlayer() {
        currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
        statutext.textContent = "Turno de " + currentPlayer;
    }
    // Verificar si hay un ganador o empate
    function checkWinner() {
        let roundWon = false;
        for (let combo of winCombos) {
            const [a, b, c] = combo;
            if (options[a] && options[a] === options[b] && options[a] === options[c]) {
                roundWon = true;
                break;
            }
        }
        // Actualizar el estado del juego
        if (roundWon) {
            statutext.textContent = `¡${currentPlayer} gana!`;
            gameActive = false;
            saveWinner(currentPlayer);
        } else if (!options.includes('')) {
            statutext.textContent = "¡Empate!";
            gameActive = false;
            saveWinner("Empate");
        } else {
            changePlayer();
        }
        saveGame();
    }

    // --- Lógica del CPU ---
    function cpuMove() {
        let move;
        if (difficulty === "easy") move = cpuEasyMove();
        if (difficulty === "medium") move = cpuMediumMove();
        if (difficulty === "hard") move = cpuHardMove();

        if (move !== undefined && move !== null) {
            placeMark(cells[move], move);
            checkWinner();
        }
    }
// Lógica del CPU Dificultad facil
    function cpuEasyMove() {
        let available = options.map((val, idx) => val === "" ? idx : null).filter(v => v !== null);
        if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
        }
        return null;
    }
// Lógica del CPU Dificultad intermedia
    function cpuMediumMove() {
        let move = findWinningMove("O");
        if (move !== null) return move;
        move = findWinningMove("X");
        if (move !== null) return move;
        return cpuEasyMove();
    }
// Buscar movimiento ganador o bloquear al oponente
    function findWinningMove(player) {
        for (let combo of winCombos) {
            let [a, b, c] = combo;
            let line = [options[a], options[b], options[c]];
            if (line.filter(v => v === player).length === 2 && line.includes("")) {
                const emptyIndex = line.indexOf("");
                return combo[emptyIndex];
            }
        }
        return null;
    }
// --- Lógica del CPU Dificultad difil (Minimax) ---
    function cpuHardMove() {
        let bestScore = -Infinity;// Inicializar mejor puntaje
        let move = null;
        for (let i = 0; i < options.length; i++) {
            if (options[i] === "") {
                options[i] = "O";
                let score = minimax(options, 0, false);
                options[i] = "";
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }
    // Algoritmo Minimax
    function minimax(board, depth, isMaximizing) {
        let result = evaluate(board);
        if (result !== null) return result - depth;

        const availableCells = board.map((val, idx) => val === "" ? idx : null).filter(v => v !== null);// Celdas disponibles
        // Si es el turno del CPU (maximizando)
        if (isMaximizing) {
            let bestScore = -Infinity;// Inicializar mejor puntaje
            for (let i of availableCells) {
                board[i] = "O";
                let score = minimax(board, depth + 1, false);
                board[i] = "";
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {// Si es el turno del jugador (minimizando)
            let bestScore = Infinity;// Inicializar con el peor puntaje
            for (let i of availableCells) {
                board[i] = "X";
                let score = minimax(board, depth + 1, true);
                board[i] = "";
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;// Devolver el mejor puntaje encontrado
        }
    }
// Evaluar el estado del tablero
    function evaluate(board) {
        for (let combo of winCombos) {// Verificar combinaciones ganadoras
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                if (board[a] === "O") return 10;
                if (board[a] === "X") return -10;
            }
        }
        if (!board.includes("")) return 0;// Empate
        return null;
    }

    // --- Lógica del Marcador y Local Storage ---
    function checkDailyReset() {
        const today = new Date().toISOString().split("T")[0];// Formato YYYY-MM-DD
        const savedDate = localStorage.getItem("scoreboardDate");// Fecha guardada
        if (savedDate !== today) {
            localStorage.setItem("scoreboardDate", today);// Actualizar fecha
            localStorage.setItem("scoreboard", JSON.stringify({ X: 0, O: 0, Empates: 0 }));// Reiniciar marcador
            scores = { X: 0, O: 0, Empates: 0 };// Reiniciar marcador en memoria
        }
    }
     // Renderizar el marcador en el DOM
    function renderWinners() {
        scoreXEl.textContent = `Victorias de X: ${scores.X}`;
        scoreOEl.textContent = `Victorias de O: ${scores.O}`;
        scoreEmpatesEl.textContent = `Empates: ${scores.Empates}`;
    }
    // Guardar el ganador y actualizar el marcador
    function saveWinner(winner) {
        if (winner === "X") {
            scores.X++;
        } else if (winner === "O") {
            scores.O++;
        } else if (winner === "Empate") {
            scores.Empates++;
        }
        localStorage.setItem("scoreboard", JSON.stringify(scores));
        renderWinners();
    }
    // Guardar y cargar el estado del juego
    function saveGame() {
        const gameData = {
            currentPlayer,
            gameActive,
            options,
            statutext: statutext.textContent
        };
        localStorage.setItem("ticTacToe", JSON.stringify(gameData));
    }
    // Cargar el estado del juego guardado
    function loadGame() {
        const savedGame = localStorage.getItem("ticTacToe");
        if (savedGame) {
            const { currentPlayer: savedPlayer, options: savedOptions, statutext: savedText, gameActive: savedActive } = JSON.parse(savedGame);
            currentPlayer = savedPlayer;
            options = savedOptions;
            statutext.textContent = savedText;
            gameActive = savedActive;
        }
    }
    // Renderizar el tablero según el estado actual
    function renderBoard() {
        cells.forEach((cell, index) => {
            cell.classList.remove('X', 'O');
            if (options[index] !== '') {
                cell.classList.add(options[index]);
            }
        });
    }

    // --- Lógica de Configuraciones ---
    const loadSettings = () => {
        const isMuted = localStorage.getItem('isMuted') === 'true';
        const volume = localStorage.getItem('volume') || 1;
        // Aplicar configuraciones al DOM y al audio
        muteToggle.checked = isMuted;
        volumeSlider.value = volume;
        audio.muted = isMuted;
        audio.volume = volume;
    };
    // Guardar configuraciones de audio
    const saveSettings = () => {
        localStorage.setItem('isMuted', muteToggle.checked);
        localStorage.setItem('volume', volumeSlider.value);
    };
    // Manejar eventos de la interfaz de configuraciones
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });
    // Cerrar el modal de configuraciones
    closeBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    // Actualizar volumen y estado de mute
    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value;
        muteToggle.checked = false;
        saveSettings();
    });
    //  Actualizar estado de mute
    muteToggle.addEventListener('change', () => {
        audio.muted = muteToggle.checked;
        saveSettings();
    });

    // --- Event Listeners Principales ---
    btnPVP.addEventListener("click", () => {
        mode = "PVP";
        cpuOptions.style.display = "none";
        startGame();
    });
    // Mostrar opciones de dificultad al seleccionar jugar contra CPU
    btnCPU.addEventListener("click", () => {
        cpuOptions.style.display = "block";
        statutext.textContent = "Selecciona la dificultad";
    });
    // Manejar selección de dificultad y comenzar el juego
    cpuButtons.forEach(button => {
        button.addEventListener("click", () => {
            mode = "CPU";
            difficulty = button.dataset.difficulty;
            cpuOptions.style.display = "none";
            startGame();
        });
    });
    // Reiniciar el marcador
    btnResetScoreboard.addEventListener("click", () => {
        localStorage.setItem("scoreboard", JSON.stringify({ X: 0, O: 0, Empates: 0 }));
        scores = { X: 0, O: 0, Empates: 0 };
        renderWinners();
    });

    initializeGame();
});
