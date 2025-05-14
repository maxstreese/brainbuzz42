# BrainBuzz POC 🧠

A proof-of-concept implementation of BrainBuzz, a fast-paced multiplayer trivia game.

## Overview

This POC implements the core features described in the project requirements:
- Quick game rooms (create/join with just a nickname)
- Multiple-choice trivia questions
- Real-time updates for scores and player status
- Streaks and instant feedback
- Leaderboard with live scoring
- End-of-game animations and winner display

## Technology Stack

This implementation uses a framework-agnostic approach with vanilla JavaScript:
- **Frontend:** HTML, CSS, JavaScript (no frameworks)
- **Styling:** Bootstrap CSS
- **Backend:** PocketBase (single executable)
- **Data Storage:** LocalStorage (for POC simplicity)
- **Real-time:** Custom events (simulating real-time WebSockets)

## Getting Started

### Prerequisites
- Python 3 (for the simple HTTP server)
- A modern web browser

### Running the Application

1. Make sure the `start.sh` script is executable:
   ```
   chmod +x start.sh
   ```

2. Run the start script:
   ```
   ./start.sh
   ```

3. Open the application in your browser:
   - Web App: http://localhost:8000
   - PocketBase Admin: http://localhost:8090/_/

4. To stop the servers, press `Ctrl+C` in the terminal where the script is running.

## How to Play

1. **Create a Game:**
   - Enter your nickname
   - Click "Create New Room"
   - Share the Room ID with friends

2. **Join a Game:**
   - Enter your nickname
   - Enter the Room ID provided by the host
   - Click "Join Room"

3. **Start the Game:**
   - The host (creator of the room) can start the game
   - All players will see the same questions

4. **Play the Game:**
   - Answer multiple-choice questions
   - Earn 100 points for each correct answer
   - Build a streak for consecutive correct answers
   - Check the leaderboard to see your ranking

## Next Steps for Production

This POC demonstrates the core functionality with a simplified implementation. For a production version:

1. Replace the localStorage implementation with the actual PocketBase collections
2. Implement proper WebSocket connections for real-time updates
3. Add user authentication for persistent user profiles
4. Expand the question database and add categories
5. Implement more sophisticated game modes and settings
6. Add more animations and sound effects

## License

This project is for demonstration purposes only. 