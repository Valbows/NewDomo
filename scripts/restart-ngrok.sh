#!/bin/bash

# Script to restart ngrok and automatically update webhook URLs
# Usage: ./scripts/restart-ngrok.sh

echo "🔄 Restarting ngrok and updating webhook URLs..."

# Kill existing ngrok processes
echo "🛑 Stopping existing ngrok processes..."
pkill -f ngrok

# Wait a moment
sleep 2

# Start ngrok
echo "🚀 Starting ngrok..."
ngrok http 3000 --log=stdout &

# Wait for ngrok to start
echo "⏳ Waiting for ngrok to initialize..."
sleep 5

# Get the new ngrok URL and update webhook URLs
echo "🔍 Detecting new ngrok URL and updating webhooks..."
curl -X POST http://localhost:3000/api/check-ngrok-url

echo "✅ Done! Check the output above for the new ngrok URL."