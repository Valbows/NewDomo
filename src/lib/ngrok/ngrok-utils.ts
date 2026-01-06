/**
 * Ngrok utilities to automatically detect URL changes
 */

/**
 * Get current ngrok URL from ngrok's local API
 */
export async function getCurrentNgrokUrl(): Promise<string | null> {
  try {
    // Ngrok exposes a local API at http://127.0.0.1:4040/api/tunnels
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    
    if (!response.ok) {
      console.warn('⚠️ Could not connect to ngrok API - is ngrok running?');
      return null;
    }
    
    const data = await response.json();
    
    // Find the HTTPS tunnel
    const httpsTunnel = data.tunnels?.find((tunnel: any) => 
      tunnel.proto === 'https' && tunnel.config?.addr === 'http://localhost:3000'
    );
    
    if (httpsTunnel?.public_url) {
      return httpsTunnel.public_url;
    }
    
    console.warn('⚠️ No HTTPS tunnel found for localhost:3000');
    return null;
  } catch (error) {
    console.warn('⚠️ Error getting ngrok URL:', error);
    return null;
  }
}

/**
 * Check if ngrok URL has changed compared to environment variable
 */
export async function checkNgrokUrlChanged(): Promise<{ changed: boolean; currentUrl: string | null; envUrl: string | null }> {
  const currentUrl = await getCurrentNgrokUrl();
  const envUrl = process.env.NGROK_URL || null;
  
  const changed = currentUrl && envUrl && currentUrl !== envUrl;
  
  return {
    changed: !!changed,
    currentUrl,
    envUrl
  };
}

/**
 * Auto-detect and update webhook URLs if ngrok URL changed
 */
export async function autoUpdateWebhookUrls(): Promise<boolean> {
  const { changed, currentUrl, envUrl } = await checkNgrokUrlChanged();
  
  if (changed && currentUrl) {
    
    try {
      const { updateWebhookUrlsForAllObjectives } = await import('../tavus/webhook-url-manager');
      await updateWebhookUrlsForAllObjectives(`${currentUrl}/api/tavus-webhook?t=${process.env.TAVUS_WEBHOOK_TOKEN}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to update webhook URLs:', error);
      return false;
    }
  }
  
  return false;
}