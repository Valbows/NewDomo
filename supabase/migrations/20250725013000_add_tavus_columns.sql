-- Add Tavus Persona and Conversation IDs to the demos table
ALTER TABLE public.demos
ADD COLUMN IF NOT EXISTS tavus_persona_id TEXT,
ADD COLUMN IF NOT EXISTS tavus_conversation_id TEXT;
