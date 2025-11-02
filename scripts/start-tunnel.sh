#!/bin/bash

# Kill any existing tunnel
pkill -f "lt --port"

# Start tunnel with permanent subdomain
echo "Starting permanent tunnel..."
lt --port 3000 --subdomain domo-kelvin-webhook &

# Wait a moment for tunnel to start
sleep 3

echo "✅ Permanent webhook URL: https://domo-kelvin-webhook.loca.lt/api/tavus-webhook"
echo "🔗 Tunnel is running in background"
echo "💡 To stop: pkill -f 'lt --port'"