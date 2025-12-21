require('dotenv').config({ path: '.env.development' });

async function checkTavusConversation() {
  const conversationId = "c9e097393f3e74b2"; // From the screenshot - one with good data
  const apiKey = process.env.TAVUS_API_KEY || "";

  if (!apiKey) {
    console.log("TAVUS_API_KEY not found in environment");
    return;
  }

  console.log("Checking Tavus API for conversation:", conversationId);

  const resp = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
    headers: { "x-api-key": apiKey }
  });

  if (resp.ok) {
    const data = await resp.json();
    console.log("\nFull Tavus response:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n--- Key fields ---");
    console.log("status:", data.status);
    console.log("duration:", data.duration);
    console.log("created_at:", data.created_at);
    console.log("completed_at:", data.completed_at);
  } else {
    console.log("Error:", resp.status);
    console.log(await resp.text());
  }
}

checkTavusConversation();
