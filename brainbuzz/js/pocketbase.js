// Initialize PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// Sample questions (in a real app these would come from the database)
const sampleQuestions = [
    {
        text: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswerIndex: 2
    },
    {
        text: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswerIndex: 1
    },
    {
        text: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        correctAnswerIndex: 2
    },
    {
        text: "What is the largest mammal in the world?",
        options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
        correctAnswerIndex: 1
    },
    {
        text: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
        correctAnswerIndex: 1
    }
];

// Generate a random room ID
function generateRoomId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// PocketBase Collection operations
const pbCollections = {
    // Create a new room
    async createRoom(hostPlayerId, hostPlayerName) {
        try {
            const roomId = generateRoomId();
            const questions = JSON.stringify(getRandomQuestions(5));
            
            const roomData = {
                roomId: roomId,
                hostPlayerId: hostPlayerId,
                isGameStarted: false,
                currentQuestionIndex: 0,
                questions: questions
            };
            
            // In a real implementation with PocketBase collections, this would be:
            // const createdRoom = await pb.collection('rooms').create(roomData);
            
            // For the POC, we'll simulate this with localStorage
            localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
            
            // Create initial player (host)
            this.addPlayerToRoom(roomId, hostPlayerId, hostPlayerName);
            
            return roomId;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    },
    
    // Add a player to a room
    async addPlayerToRoom(roomId, playerId, playerName) {
        try {
            const playerData = {
                id: playerId,
                name: playerName,
                score: 0,
                streak: 0,
                roomId: roomId
            };
            
            // In a real implementation:
            // const createdPlayer = await pb.collection('players').create(playerData);
            
            // For the POC, simulate with localStorage
            const roomKey = `room_${roomId}`;
            const roomData = JSON.parse(localStorage.getItem(roomKey) || '{}');
            
            if (!roomData.players) {
                roomData.players = [];
            }
            
            roomData.players.push(playerData);
            localStorage.setItem(roomKey, JSON.stringify(roomData));
            
            // Trigger a "player joined" event
            document.dispatchEvent(new CustomEvent('playerJoined', { 
                detail: { roomId, player: playerData, players: roomData.players }
            }));
            
            return playerData;
        } catch (error) {
            console.error('Error adding player to room:', error);
            throw error;
        }
    },
    
    // Start a game
    async startGame(roomId) {
        try {
            // In a real implementation:
            // await pb.collection('rooms').update(roomId, { isGameStarted: true });
            
            // For the POC:
            const roomKey = `room_${roomId}`;
            const roomData = JSON.parse(localStorage.getItem(roomKey) || '{}');
            
            if (!roomData.roomId) {
                throw new Error('Room not found');
            }
            
            roomData.isGameStarted = true;
            localStorage.setItem(roomKey, JSON.stringify(roomData));
            
            // Trigger a "game started" event
            document.dispatchEvent(new CustomEvent('gameStarted', { 
                detail: { roomId, currentQuestion: JSON.parse(roomData.questions)[0] }
            }));
            
            return true;
        } catch (error) {
            console.error('Error starting game:', error);
            throw error;
        }
    },
    
    // Submit an answer
    async submitAnswer(roomId, playerId, answerIndex) {
        try {
            // Get current room data
            const roomKey = `room_${roomId}`;
            const roomData = JSON.parse(localStorage.getItem(roomKey) || '{}');
            
            if (!roomData.roomId) {
                throw new Error('Room not found');
            }
            
            // Get current question
            const questions = JSON.parse(roomData.questions);
            const currentQuestion = questions[roomData.currentQuestionIndex];
            const isCorrect = currentQuestion.correctAnswerIndex === answerIndex;
            
            // Update player score
            const playerIndex = roomData.players.findIndex(p => p.id === playerId);
            if (playerIndex >= 0) {
                if (isCorrect) {
                    roomData.players[playerIndex].score += 100;
                    roomData.players[playerIndex].streak += 1;
                } else {
                    roomData.players[playerIndex].streak = 0;
                }
            }
            
            localStorage.setItem(roomKey, JSON.stringify(roomData));
            
            // Trigger an "answer submitted" event
            document.dispatchEvent(new CustomEvent('answerSubmitted', { 
                detail: { 
                    roomId, 
                    playerId, 
                    isCorrect, 
                    correctAnswerIndex: currentQuestion.correctAnswerIndex,
                    players: roomData.players 
                }
            }));
            
            return { 
                isCorrect, 
                correctAnswerIndex: currentQuestion.correctAnswerIndex,
                players: roomData.players 
            };
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    },
    
    // Move to next question
    async nextQuestion(roomId) {
        try {
            const roomKey = `room_${roomId}`;
            const roomData = JSON.parse(localStorage.getItem(roomKey) || '{}');
            
            if (!roomData.roomId) {
                throw new Error('Room not found');
            }
            
            const questions = JSON.parse(roomData.questions);
            roomData.currentQuestionIndex += 1;
            
            // Check if this was the last question
            if (roomData.currentQuestionIndex >= questions.length) {
                roomData.isGameEnded = true;
                localStorage.setItem(roomKey, JSON.stringify(roomData));
                
                // Trigger game ended event
                document.dispatchEvent(new CustomEvent('gameEnded', { 
                    detail: { roomId, players: roomData.players }
                }));
                
                return { isGameEnded: true, players: roomData.players };
            }
            
            // Get next question
            const nextQuestion = questions[roomData.currentQuestionIndex];
            localStorage.setItem(roomKey, JSON.stringify(roomData));
            
            // Trigger next question event
            document.dispatchEvent(new CustomEvent('nextQuestion', { 
                detail: { roomId, question: nextQuestion }
            }));
            
            return { question: nextQuestion };
        } catch (error) {
            console.error('Error moving to next question:', error);
            throw error;
        }
    },
    
    // Get room data
    async getRoom(roomId) {
        try {
            // In a real implementation:
            // return await pb.collection('rooms').getOne(roomId);
            
            // For the POC:
            const roomKey = `room_${roomId}`;
            const roomData = JSON.parse(localStorage.getItem(roomKey) || '{}');
            
            if (!roomData.roomId) {
                throw new Error('Room not found');
            }
            
            return roomData;
        } catch (error) {
            console.error('Error getting room:', error);
            throw error;
        }
    }
};

// Get random questions
function getRandomQuestions(count) {
    const shuffled = [...sampleQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
