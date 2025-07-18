class TicTacToePro {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = false;
        this.gameMode = null; // 'pvp', 'easy', 'medium', 'hard'
        this.isAIGame = false;
        this.aiPlayer = 'O';
        this.humanPlayer = 'X';
        this.soundEnabled = true;
        
        // Statistics
        this.stats = this.loadStats();
        
        // Game state
        this.scores = {
            X: 0,
            O: 0,
            draw: 0
        };
        
        this.winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupElements();
        this.attachEventListeners();
        this.showGameModes();
        this.updateStatsDisplay();
        this.createSoundContext();
    }

    setupElements() {
        // Game mode elements
        this.gameModesElement = document.getElementById('game-modes');
        this.gameInterfaceElement = document.getElementById('game-interface');
        this.currentModeElement = document.getElementById('current-mode');
        this.backButton = document.getElementById('back-btn');
        
        // Game elements
        this.cells = document.querySelectorAll('.cell');
        this.currentPlayerElement = document.getElementById('current-player');
        this.playerIndicatorElement = document.getElementById('player-indicator');
        this.gameStatusElement = document.getElementById('game-status');
        this.aiThinkingElement = document.getElementById('ai-thinking');
        
        // Score elements
        this.scoreXElement = document.getElementById('score-x');
        this.scoreOElement = document.getElementById('score-o');
        this.scoreDrawElement = document.getElementById('score-draw');
        
        // Control buttons
        this.resetGameButton = document.getElementById('reset-game');
        this.resetScoreButton = document.getElementById('reset-score');
        this.hintButton = document.getElementById('hint-btn');
        this.soundToggle = document.getElementById('sound-toggle');
        
        // Statistics elements
        this.gamesPlayedElement = document.getElementById('games-played');
        this.winRateElement = document.getElementById('win-rate');
        this.bestStreakElement = document.getElementById('best-streak');
        this.currentStreakElement = document.getElementById('current-streak');
    }

    attachEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectGameMode(e.target.dataset.mode));
        });
        
        // Game controls
        this.backButton.addEventListener('click', () => this.showGameModes());
        this.resetGameButton.addEventListener('click', () => this.resetGame());
        this.resetScoreButton.addEventListener('click', () => this.resetScore());
        this.hintButton.addEventListener('click', () => this.showHint());
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        
        // Cell clicks
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
    }

    selectGameMode(mode) {
        this.gameMode = mode;
        this.isAIGame = mode !== 'pvp';
        
        const modeNames = {
            pvp: '👥 Player vs Player',
            easy: '🤖 vs AI (Easy)',
            medium: '🧠 vs AI (Medium)',
            hard: '💀 vs AI (Hard)'
        };
        
        this.currentModeElement.textContent = modeNames[mode];
        this.hintButton.style.display = this.isAIGame ? 'inline-block' : 'none';
        
        // Update player indicator for AI games
        if (this.isAIGame) {
            this.playerIndicatorElement.textContent = 'Your turn:';
        } else {
            this.playerIndicatorElement.textContent = 'Current Player:';
        }
        
        this.showGameInterface();
        this.resetGame();
        this.playSound('start');
    }

    showGameModes() {
        this.gameModesElement.style.display = 'block';
        this.gameInterfaceElement.style.display = 'none';
        this.gameActive = false;
    }

    showGameInterface() {
        this.gameModesElement.style.display = 'none';
        this.gameInterfaceElement.style.display = 'block';
        this.gameActive = true;
    }

    handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (this.board[clickedCellIndex] !== '' || !this.gameActive) {
            return;
        }

        // Human player makes move
        this.makeMove(clickedCellIndex, this.currentPlayer);
        
        // Check for game end
        if (this.checkWinner() || this.checkDraw()) {
            return;
        }

        // AI turn in AI game modes
        if (this.isAIGame && this.currentPlayer === this.aiPlayer) {
            this.aiThinkingElement.style.display = 'block';
            setTimeout(() => {
                this.makeAIMove();
                this.aiThinkingElement.style.display = 'none';
            }, this.getAIThinkingTime());
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        const cell = this.cells[index];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
        
        this.playSound('move');
        
        if (this.checkWinner()) {
            this.handleGameEnd('win');
        } else if (this.checkDraw()) {
            this.handleGameEnd('draw');
        } else {
            this.switchPlayer();
        }
    }

    makeAIMove() {
        let move;
        
        switch (this.gameMode) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = this.getMediumAIMove();
                break;
            case 'hard':
                move = this.getHardAIMove();
                break;
            default:
                move = this.getRandomMove();
        }
        
        if (move !== -1) {
            this.makeMove(move, this.aiPlayer);
        }
    }

    getRandomMove() {
        const availableMoves = this.getAvailableMoves();
        return availableMoves.length > 0 ? 
            availableMoves[Math.floor(Math.random() * availableMoves.length)] : -1;
    }

    getMediumAIMove() {
        // 70% chance to play optimally, 30% random
        if (Math.random() < 0.7) {
            return this.getHardAIMove();
        }
        return this.getRandomMove();
    }

    getHardAIMove() {
        // Use minimax algorithm for optimal play
        const bestMove = this.minimax(this.board, this.aiPlayer, 0, true);
        return bestMove.index;
    }

    minimax(board, player, depth, isMaximizing) {
        const winner = this.checkWinnerForBoard(board);
        
        if (winner === this.aiPlayer) return { score: 10 - depth };
        if (winner === this.humanPlayer) return { score: depth - 10 };
        if (this.getAvailableMovesForBoard(board).length === 0) return { score: 0 };

        const moves = [];
        const availableMoves = this.getAvailableMovesForBoard(board);
        
        for (let move of availableMoves) {
            const newBoard = [...board];
            newBoard[move] = player;
            
            const result = isMaximizing ?
                this.minimax(newBoard, this.humanPlayer, depth + 1, false) :
                this.minimax(newBoard, this.aiPlayer, depth + 1, true);
            
            moves.push({ index: move, score: result.score });
        }
        
        if (isMaximizing) {
            const bestMove = moves.reduce((best, move) => 
                move.score > best.score ? move : best);
            return bestMove;
        } else {
            const bestMove = moves.reduce((best, move) => 
                move.score < best.score ? move : best);
            return bestMove;
        }
    }

    getAvailableMoves() {
        return this.board.map((cell, index) => cell === '' ? index : null)
                        .filter(cell => cell !== null);
    }

    getAvailableMovesForBoard(board) {
        return board.map((cell, index) => cell === '' ? index : null)
                   .filter(cell => cell !== null);
    }

    checkWinnerForBoard(board) {
        for (let condition of this.winningConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    getAIThinkingTime() {
        const times = { easy: 500, medium: 800, hard: 1200 };
        return times[this.gameMode] || 500;
    }

    showHint() {
        if (!this.isAIGame || this.currentPlayer !== this.humanPlayer) return;
        
        const bestMove = this.getHardAIMove();
        if (bestMove !== -1) {
            const cell = this.cells[bestMove];
            cell.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
            cell.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                cell.style.background = '';
                cell.style.transform = '';
            }, 1000);
        }
        
        this.playSound('hint');
    }

    checkWinner() {
        for (let condition of this.winningConditions) {
            const [a, b, c] = condition;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.highlightWinningCells(condition);
                return true;
            }
        }
        return false;
    }

    highlightWinningCells(winningIndexes) {
        winningIndexes.forEach(index => {
            this.cells[index].classList.add('winner');
        });
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    handleGameEnd(result) {
        this.gameActive = false;
        
        if (result === 'win') {
            this.scores[this.currentPlayer]++;
            
            if (this.isAIGame) {
                if (this.currentPlayer === this.humanPlayer) {
                    this.gameStatusElement.textContent = `🎉 You Win! Great job!`;
                    this.updateStats('win');
                    this.playSound('win');
                } else {
                    this.gameStatusElement.textContent = `🤖 AI Wins! Try again!`;
                    this.updateStats('loss');
                    this.playSound('lose');
                }
            } else {
                this.gameStatusElement.textContent = `🎉 Player ${this.currentPlayer} Wins!`;
                this.playSound('win');
            }
            
            this.gameStatusElement.className = 'game-status winner';
        } else if (result === 'draw') {
            this.scores.draw++;
            this.gameStatusElement.textContent = "🤝 It's a Draw!";
            this.gameStatusElement.className = 'game-status draw';
            this.updateStats('draw');
            this.playSound('draw');
        }
        
        this.updateScoreDisplay();
        this.updateStatsDisplay();
        
        // Auto-reset after 3 seconds
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updatePlayerDisplay();
    }

    updatePlayerDisplay() {
        this.currentPlayerElement.textContent = this.currentPlayer;
        this.currentPlayerElement.style.color = this.currentPlayer === 'X' ? '#e53e3e' : '#3182ce';
        
        if (this.isAIGame) {
            this.playerIndicatorElement.textContent = 
                this.currentPlayer === this.humanPlayer ? 'Your turn:' : 'AI turn:';
        }
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameStatusElement.textContent = '';
        this.gameStatusElement.className = 'game-status';
        this.aiThinkingElement.style.display = 'none';

        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.style.background = '';
            cell.style.transform = '';
        });

        this.updatePlayerDisplay();
    }

    resetScore() {
        this.scores = { X: 0, O: 0, draw: 0 };
        this.updateScoreDisplay();
        this.playSound('reset');
    }

    updateScoreDisplay() {
        this.scoreXElement.textContent = this.scores.X;
        this.scoreOElement.textContent = this.scores.O;
        this.scoreDrawElement.textContent = this.scores.draw;
    }

    // Statistics system
    loadStats() {
        const defaultStats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            currentStreak: 0,
            bestStreak: 0
        };
        
        try {
            const saved = localStorage.getItem('ticTacToeProStats');
            return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
        } catch {
            return defaultStats;
        }
    }

    saveStats() {
        try {
            localStorage.setItem('ticTacToeProStats', JSON.stringify(this.stats));
        } catch {
            // Ignore storage errors
        }
    }

    updateStats(result) {
        this.stats.gamesPlayed++;
        
        switch (result) {
            case 'win':
                this.stats.wins++;
                this.stats.currentStreak++;
                if (this.stats.currentStreak > this.stats.bestStreak) {
                    this.stats.bestStreak = this.stats.currentStreak;
                }
                break;
            case 'loss':
                this.stats.losses++;
                this.stats.currentStreak = 0;
                break;
            case 'draw':
                this.stats.draws++;
                break;
        }
        
        this.saveStats();
    }

    updateStatsDisplay() {
        this.gamesPlayedElement.textContent = this.stats.gamesPlayed;
        
        const winRate = this.stats.gamesPlayed > 0 ? 
            Math.round((this.stats.wins / this.stats.gamesPlayed) * 100) : 0;
        this.winRateElement.textContent = `${winRate}%`;
        
        this.bestStreakElement.textContent = this.stats.bestStreak;
        this.currentStreakElement.textContent = this.stats.currentStreak;
    }

    // Sound system
    createSoundContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            this.soundEnabled = false;
        }
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const frequencies = {
            move: 440,
            win: [523, 659, 784],
            lose: [392, 349, 294],
            draw: 523,
            start: 659,
            reset: 349,
            hint: 880
        };
        
        const freq = frequencies[type];
        
        if (Array.isArray(freq)) {
            // Play chord
            freq.forEach((f, i) => {
                setTimeout(() => this.playTone(f, 0.2), i * 100);
            });
        } else {
            this.playTone(freq, 0.2);
        }
    }

    playTone(frequency, duration) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch {
            // Ignore sound errors
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
        
        if (this.soundEnabled && !this.audioContext) {
            this.createSoundContext();
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToePro();
}); 