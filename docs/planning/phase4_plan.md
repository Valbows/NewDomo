# Phase 4: Implement Real-time Tool Calls & Video Playback

**Objective:** Enable the Tavus agent to execute the `play_video` tool call in real-time, causing a video to play in the user interface.

## Backend Development

1.  **Tavus Webhook Integration:**
    *   Create a new API route (`/api/tavus-webhook`) to receive real-time events from the Tavus conversation.
    *   This endpoint must securely process incoming webhooks, validating them with a secret to ensure they originate from Tavus.

2.  **Tool Call Handler:**
    *   Within the webhook, implement logic to specifically handle `tool_call` events.
    *   When a `play_video` tool call is received, parse the `video_title` argument from the payload.

3.  **Database Interaction:**
    *   Query the `demo_videos` table in Supabase to find the video matching the `video_title` for the correct `demo_id`.
    *   Retrieve the video's public URL from Supabase Storage.

## Real-time Frontend Communication

1.  **Supabase Realtime:**
    *   Utilize Supabase Realtime channels to create a communication bridge between the backend and frontend.
    *   The channel will be unique to the active demo session (e.g., `demo-${demoId}`).
    *   When the backend successfully retrieves a video URL, it will broadcast a `play_video` event with the URL to the specific demo channel.

## Frontend Development

1.  **Event Listener:**
    *   In the `DemoConfigurationPage` (or a dedicated component), subscribe to the appropriate Supabase Realtime channel when the component mounts.
    *   Listen for incoming `play_video` events.

2.  **UI Control & Video Playback:**
    *   Upon receiving a `play_video` event, dynamically create and display a video player component.
    *   The video player will load the URL from the event payload.
    *   It will autoplay on mute and enter Picture-in-Picture (PiP) mode, as you requested.
    *   The main agent conversation view will minimize or move to a corner to allow the video to be the primary focus.
