document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gameState = {
        currentPlayer: null,
        currentRoom: null,
        players: [],
        timer: null,
        timerValue: 30,
        isHost: false,
        syncInterval: null
    };

    // DOM Elements
    const screens = {
        welcome: document.getElementById('welcome-screen'),
        lobby: document.getElementById('lobby-screen'),
        game: document.getElementById('game-screen'),
        gameOver: document.getElementById('game-over-screen')
    };

    const elements = {
        nickname: document.getElementById('nickname'),
        roomId: document.getElementById('room-id'),
        createRoomBtn: document.getElementById('create-room-btn'),
        joinRoomBtn: document.getElementById('join-room-btn'),
        roomIdDisplay: document.getElementById('room-id-display'),
        playersList: document.getElementById('players-list'),
        startGameBtn: document.getElementById('start-game-btn'),
        timer: document.getElementById('timer'),
        playerScore: document.getElementById('player-score'),
        playerStreak: document.getElementById('player-streak'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        leaderboardList: document.getElementById('leaderboard-list'),
        finalScores: document.getElementById('final-scores'),
        winnerDisplay: document.getElementById('winner-display'),
        playAgainBtn: document.getElementById('play-again-btn')
    };

    // Show a specific screen
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        screens[screenId].classList.add('active');
    }

    // Generate a player ID
    function generatePlayerId() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    // Create a new room
    async function createRoom() {
        const nickname = elements.nickname.value.trim();
        if (!nickname) {
            alert('Please enter a nickname');
            return;
        }

        try {
            // Generate player ID
            const playerId = generatePlayerId();
            
            // Set up current player
            gameState.currentPlayer = {
                id: playerId,
                name: nickname,
                score: 0,
                streak: 0
            };
            gameState.isHost = true;

            console.log('Creating new room as host...');
            const roomId = await pbCollections.createRoom(playerId, nickname);
            console.log(`Room created with ID: ${roomId}`);
            
            gameState.currentRoom = roomId;
            elements.roomIdDisplay.textContent = roomId;
            
            // Get full room data and update UI
            const room = await pbCollections.getRoom(roomId);
            updatePlayersList(room.players);
            
            // Start polling for room updates to sync state across browsers
            startRoomStateSyncing();
            
            showScreen('lobby');
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    }

    // Join an existing room
    async function joinRoom() {
        const nickname = elements.nickname.value.trim();
        const roomId = elements.roomId.value.trim().toUpperCase();
        
        if (!nickname || !roomId) {
            alert('Please enter both nickname and room ID');
            return;
        }

        try {
            // Generate a player ID
            const playerId = generatePlayerId();
            
            // Set up current player in game state
            gameState.currentPlayer = {
                id: playerId,
                name: nickname,
                score: 0,
                streak: 0
            };
            
            // Try to get the existing room - this will throw an error if the room doesn't exist
            let room = await pbCollections.getRoom(roomId);
            
            console.log('Successfully found room to join:', room);
            
            // If we get here, the room exists
            gameState.currentRoom = roomId;
            gameState.isHost = false;
            
            // Add player to room
            await pbCollections.addPlayerToRoom(roomId, playerId, nickname);
            
            // Get the updated room data after adding the player
            room = await pbCollections.getRoom(roomId);
            
            // Display room ID and update player list
            elements.roomIdDisplay.textContent = roomId;
            updatePlayersList(room.players);
            
            // Force refresh players list from localStorage
            refreshPlayersFromStorage();
            
            // Start polling for room updates
            startRoomStateSyncing();
            
            if (room.isGameStarted) {
                startGame();
            } else {
                showScreen('lobby');
            }
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please check the room ID and try again.');
        }
    }

    // Directly refresh the players list from localStorage
    function refreshPlayersFromStorage() {
        if (gameState.currentRoom) {
            const roomKey = `room_${gameState.currentRoom}`;
            const roomDataStr = localStorage.getItem(roomKey);
            
            if (roomDataStr) {
                try {
                    const roomData = JSON.parse(roomDataStr);
                    if (roomData && roomData.players) {
                        updatePlayersList(roomData.players);
                        console.log('Refreshed players from storage:', roomData.players);
                    }
                } catch (error) {
                    console.error('Error parsing room data:', error);
                }
            }
        }
    }

    // Update the players list in the lobby and game
    function updatePlayersList(players) {
        if (!players || !Array.isArray(players)) {
            console.error('Invalid players list:', players);
            return;
        }
        
        console.log('Updating players list with:', players);
        gameState.players = players;
        
        // Update lobby players list
        elements.playersList.innerHTML = '';
        players.forEach(player => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="player-score badge bg-primary">${player.score}</span>
            `;
            elements.playersList.appendChild(li);
        });
        
        // Show/hide start button based on whether player is host
        elements.startGameBtn.style.display = gameState.isHost ? 'block' : 'none';
        
        // Update game leaderboard
        updateLeaderboard();
    }

    // Update the leaderboard
    function updateLeaderboard() {
        const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
        
        elements.leaderboardList.innerHTML = '';
        sortedPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            // Add crown for the leader
            const leaderIndicator = index === 0 ? '👑 ' : '';
            
            // Add streak indicator
            const streakIndicator = player.streak > 0 ? 
                `<span class="badge bg-warning text-dark">🔥 ${player.streak}</span>` : '';
            
            li.innerHTML = `
                <div>
                    <span class="player-name">${leaderIndicator}${player.name}</span>
                </div>
                <div>
                    <span class="player-score badge bg-primary">${player.score}</span>
                    ${streakIndicator}
                </div>
            `;
            elements.leaderboardList.appendChild(li);
        });
        
        // Update current player score
        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer.id);
        if (currentPlayer) {
            elements.playerScore.textContent = `Score: ${currentPlayer.score}`;
            elements.playerStreak.textContent = `Streak: ${currentPlayer.streak}`;
        }
    }

    // Start the game
    async function startGame() {
        try {
            if (gameState.isHost) {
                await pbCollections.startGame(gameState.currentRoom);
            } else {
                // For non-host players, just transition to game screen
                // The actual game start will come through the gameStarted event
                showScreen('game');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Failed to start game. Please try again.');
        }
    }

    // Display a question
    function displayQuestion(question) {
        elements.questionText.textContent = question.text;
        
        elements.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.dataset.index = index;
            button.addEventListener('click', () => submitAnswer(index));
            elements.optionsContainer.appendChild(button);
        });
        
        // Start timer
        startTimer();
    }

    // Start the timer
    function startTimer() {
        clearInterval(gameState.timer);
        gameState.timerValue = 30;
        elements.timer.textContent = gameState.timerValue;
        
        gameState.timer = setInterval(() => {
            gameState.timerValue -= 1;
            elements.timer.textContent = gameState.timerValue;
            
            if (gameState.timerValue <= 0) {
                clearInterval(gameState.timer);
                // Auto-submit a wrong answer on timeout
                submitAnswer(-1);
            }
        }, 1000);
    }

    // Submit an answer
    async function submitAnswer(answerIndex) {
        clearInterval(gameState.timer);
        
        try {
            const result = await pbCollections.submitAnswer(
                gameState.currentRoom, 
                gameState.currentPlayer.id, 
                answerIndex
            );
            
            // Show feedback
            const options = elements.optionsContainer.querySelectorAll('.option-btn');
            options.forEach((option, index) => {
                option.disabled = true;
                
                if (index === result.correctAnswerIndex) {
                    option.classList.add('correct');
                } else if (index === answerIndex && answerIndex !== result.correctAnswerIndex) {
                    option.classList.add('incorrect');
                }
            });
            
            // Update player scores
            updatePlayersList(result.players);
            
            // Move to next question after delay
            setTimeout(() => {
                if (gameState.isHost) {
                    pbCollections.nextQuestion(gameState.currentRoom);
                }
            }, 3000);
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    }

    // Show the game over screen
    function showGameOver(players) {
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];
        
        elements.winnerDisplay.innerHTML = `
            <div class="winner-crown">👑</div>
            <div>${winner.name} wins with ${winner.score} points!</div>
        `;
        
        elements.finalScores.innerHTML = '';
        sortedPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span class="player-name">${index + 1}. ${player.name}</span>
                <span class="player-score badge bg-primary">${player.score}</span>
            `;
            elements.finalScores.appendChild(li);
        });
        
        showScreen('gameOver');
    }

    // Event listeners
    elements.createRoomBtn.addEventListener('click', createRoom);
    elements.joinRoomBtn.addEventListener('click', joinRoom);
    elements.startGameBtn.addEventListener('click', startGame);
    elements.playAgainBtn.addEventListener('click', () => {
        stopRoomStateSyncing();
        showScreen('welcome');
    });

    // Handle real-time events (custom events for our POC)
    document.addEventListener('playerJoined', (event) => {
        updatePlayersList(event.detail.players);
    });
    
    document.addEventListener('gameStarted', (event) => {
        showScreen('game');
        displayQuestion(event.detail.currentQuestion);
    });
    
    document.addEventListener('answerSubmitted', (event) => {
        updatePlayersList(event.detail.players);
    });
    
    document.addEventListener('nextQuestion', (event) => {
        displayQuestion(event.detail.question);
    });
    
    document.addEventListener('gameEnded', (event) => {
        showGameOver(event.detail.players);
    });

    // Start with welcome screen
    showScreen('welcome');

    // Start syncing room state across browser windows
    function startRoomStateSyncing() {
        console.log('Starting room state syncing');
        
        // Clear any existing sync interval
        if (gameState.syncInterval) {
            clearInterval(gameState.syncInterval);
        }
        
        // Keep track of the last question index we've seen
        let lastQuestionIndex = -1;
        let lastPlayerCount = 0;
        
        // Initially refresh players from storage
        refreshPlayersFromStorage();
        
        // Start checking for room updates regularly
        gameState.syncInterval = setInterval(() => {
            if (gameState.currentRoom) {
                try {
                    // Direct access to localStorage for more reliable sync
                    const roomKey = `room_${gameState.currentRoom}`;
                    const roomDataStr = localStorage.getItem(roomKey);
                    
                    if (roomDataStr) {
                        const updatedRoom = JSON.parse(roomDataStr);
                        console.log('Room sync check:', updatedRoom);
                        
                        // Update player list if number of players has changed
                        if (updatedRoom.players && updatedRoom.players.length !== lastPlayerCount) {
                            console.log('Player count changed, updating list');
                            updatePlayersList(updatedRoom.players);
                            lastPlayerCount = updatedRoom.players.length;
                        }
                        
                        // Check if game was started by host from another window
                        if (updatedRoom.isGameStarted && !screens.game.classList.contains('active')) {
                            console.log('Game started in another window, updating UI');
                            showScreen('game');
                            // Get the first question
                            const questions = JSON.parse(updatedRoom.questions);
                            displayQuestion(questions[updatedRoom.currentQuestionIndex]);
                            lastQuestionIndex = updatedRoom.currentQuestionIndex;
                        }
                        
                        // Check if question has changed (for non-host players)
                        if (updatedRoom.isGameStarted && 
                            lastQuestionIndex !== -1 && 
                            updatedRoom.currentQuestionIndex !== lastQuestionIndex) {
                            
                            console.log('Question changed, updating UI');
                            
                            // Question has changed, update UI
                            const questions = JSON.parse(updatedRoom.questions);
                            
                            // Check for game over
                            if (updatedRoom.isGameEnded) {
                                showGameOver(updatedRoom.players);
                            } else if (updatedRoom.currentQuestionIndex < questions.length) {
                                displayQuestion(questions[updatedRoom.currentQuestionIndex]);
                            }
                            
                            lastQuestionIndex = updatedRoom.currentQuestionIndex;
                        }
                    }
                } catch (error) {
                    console.error('Error syncing room state:', error);
                }
            }
        }, 1000); // Check every second for faster updates
    }
    
    // Stop syncing when game ends or player leaves
    function stopRoomStateSyncing() {
        if (gameState.syncInterval) {
            clearInterval(gameState.syncInterval);
            gameState.syncInterval = null;
        }
    }
});
