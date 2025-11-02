#!/bin/bash

# Keep tunnel alive script
# This will restart the tunnel if it goes down

SUBDOMAIN="domo-kelvin-webhook"
PORT="3000"

while true; do
    # Check if tunnel is running
    if ! pgrep -f "lt --port $PORT --subdomain $SUBDOMAIN" > /dev/null; then
        echo "🔄 Tunnel not running, starting..."
        lt --port $PORT --subdomain $SUBDOMAIN &
        sleep 5
        echo "✅ Tunnel started: https://$SUBDOMAIN.loca.lt"
    fi
    
    # Check if tunnel is responding
    if ! curl -s --max-time 5 "https://$SUBDOMAIN.loca.lt" > /dev/null; then
        echo "⚠️ Tunnel not responding, restarting..."
        pkill -f "lt --port $PORT"
        sleep 2
        lt --port $PORT --subdomain $SUBDOMAIN &
        sleep 5
        echo "✅ Tunnel restarted: https://$SUBDOMAIN.loca.lt"
    fi
    
    # Wait 30 seconds before next check
    sleep 30
done