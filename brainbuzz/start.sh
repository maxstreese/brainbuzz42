#!/bin/bash

# Start PocketBase in the background
echo "Starting PocketBase..."
cd pocketbase
./pocketbase serve &
POCKETBASE_PID=$!

# Serve the web application with Python's built-in HTTP server
echo "Serving BrainBuzz web application..."
cd ..
python3 -m http.server 8000 &
HTTP_SERVER_PID=$!

echo "BrainBuzz is running!"
echo "- PocketBase Admin UI: http://localhost:8090/_/"
echo "- Web Application: http://localhost:8000"

# Function to handle script termination
function cleanup {
    echo "Stopping servers..."
    kill $POCKETBASE_PID
    kill $HTTP_SERVER_PID
    echo "Servers stopped."
    exit
}

# Trap SIGINT (Ctrl+C) and call the cleanup function
trap cleanup SIGINT

# Wait for user input to keep the script running
echo "Press Ctrl+C to stop the servers..."
while true; do
    sleep 1
done 