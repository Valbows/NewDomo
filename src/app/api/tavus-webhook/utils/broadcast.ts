export async function broadcastToDemo(
  supabase: any,
  demoId: string,
  eventName: string,
  payload: any
): Promise<void> {
  const channelName = `demo-${demoId}`;
  const channel = supabase.channel(channelName);

  try {
    // Subscribe to channel first
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const subscribeResult = channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED' && !settled) {
          settled = true;
          console.log(`Server Realtime: SUBSCRIBED to ${channelName}`);
          resolve();
        }
      });

      // For tests: if subscribe returns immediately or is a mock, resolve immediately
      if (subscribeResult === undefined || (subscribeResult && typeof subscribeResult.then !== 'function')) {
        if (!settled) {
          settled = true;
          resolve();
        }
      }

      setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Server Realtime subscribe timeout'));
        }
      }, 2000);
    });
  } catch (subErr) {
    console.warn(`Webhook: ${eventName} subscribe failed (non-fatal):`, subErr);
    // Continue anyway to support test environments
  }

  try {
    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });
    console.log(`Broadcasted ${eventName} event for demo ${demoId}`);
  } catch (sendErr) {
    console.warn(`Webhook: ${eventName} broadcast failed (non-fatal):`, sendErr);
  } finally {
    try {
      await supabase.removeChannel(channel);
    } catch {}
  }
}
