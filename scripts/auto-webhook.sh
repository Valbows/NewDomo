#!/bin/bash

# Auto-restart localtunnel and update webhook URL
# Usage: ./auto-webhook.sh

echo "🚀 Starting auto-webhook manager..."

# Configuration
PORT=3000
SUBDOMAIN_PREFIX="workday-demo"
LOG_FILE="webhook-manager.log"

# Function to get current timestamp
timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

# Function to log messages
log() {
    echo "[$(timestamp)] $1" | tee -a "$LOG_FILE"
}

# Function to kill existing localtunnel processes
cleanup() {
    log "🧹 Cleaning up existing localtunnel processes..."
    pkill -f "lt --port" 2>/dev/null || true
    sleep 2
}

# Function to start localtunnel
start_tunnel() {
    local subdomain="${SUBDOMAIN_PREFIX}-$(date +%s)"
    log "🌐 Starting localtunnel with subdomain: $subdomain"
    
    # Start localtunnel in background
    lt --port $PORT --subdomain "$subdomain" > /dev/null 2>&1 &
    local lt_pid=$!
    
    # Wait for tunnel to establish
    sleep 5
    
    # Check if process is still running
    if kill -0 $lt_pid 2>/dev/null; then
        local tunnel_url="https://${subdomain}.loca.lt"
        log "✅ Tunnel started: $tunnel_url"
        echo "$tunnel_url"
        return 0
    else
        log "❌ Failed to start tunnel"
        return 1
    fi
}

# Function to update webhook URL in database
update_webhook() {
    local webhook_url="$1"
    log "🔄 Updating webhook URL: $webhook_url"
    
    node -e "
    require('dotenv').config({ path: '.env.local' });
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY
    );
    
    async function updateWebhook() {
        try {
            const { data: objectives, error } = await supabase
                .from('custom_objectives')
                .select('*')
                .eq('name', 'Workday Sales Demo Flow')
                .eq('is_active', true);
            
            if (error || !objectives || objectives.length === 0) {
                console.log('❌ Objective not found');
                return;
            }
            
            const objective = objectives[0];
            const updatedObjectives = objective.objectives.map(obj => {
                if (obj.objective_name === 'greeting_and_qualification') {
                    return { ...obj, callback_url: '$webhook_url/api/webhooks/events/qualification' };
                }
                return obj;
            });
            
            await supabase
                .from('custom_objectives')
                .update({ 
                    objectives: updatedObjectives,
                    updated_at: new Date().toISOString()
                })
                .eq('id', objective.id);
            
            console.log('✅ Webhook URL updated in database');
        } catch (error) {
            console.log('❌ Update failed:', error.message);
        }
    }
    
    updateWebhook();
    "
}

# Function to test webhook
test_webhook() {
    local webhook_url="$1"
    log "🧪 Testing webhook: $webhook_url"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$webhook_url/api/webhooks/events/qualification" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        log "✅ Webhook is accessible"
        return 0
    else
        log "⚠️  Webhook returned status: $response"
        return 1
    fi
}

# Main function
main() {
    log "🚀 Auto-webhook manager started"
    
    # Cleanup existing processes
    cleanup
    
    # Start new tunnel
    local tunnel_url=$(start_tunnel)
    
    if [ $? -eq 0 ]; then
        # Update webhook URL in database
        update_webhook "$tunnel_url"
        
        # Test webhook (with retry)
        sleep 3
        if test_webhook "$tunnel_url"; then
            log "🎉 Webhook setup complete!"
            echo ""
            echo "✅ Webhook URL: $tunnel_url/api/webhooks/events/qualification"
            echo "📊 Check data: http://localhost:3000/api/qualification-data"
            echo "🔄 To restart: ./auto-webhook.sh"
            echo ""
            echo "⚠️  Keep this terminal open or run in background with:"
            echo "   nohup ./auto-webhook.sh > webhook.log 2>&1 &"
        else
            log "⚠️  Webhook test failed, but tunnel is running"
        fi
        
        # Keep script running to monitor tunnel
        log "👀 Monitoring tunnel... (Ctrl+C to stop)"
        while true; do
            sleep 30
            if ! pgrep -f "lt --port" > /dev/null; then
                log "❌ Tunnel died, restarting..."
                main
                break
            fi
        done
    else
        log "❌ Failed to start tunnel"
        exit 1
    fi
}

# Handle Ctrl+C
trap 'log "🛑 Stopping auto-webhook manager..."; cleanup; exit 0' INT

# Run main function
main