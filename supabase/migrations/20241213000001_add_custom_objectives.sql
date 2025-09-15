-- Add custom objectives table for user-defined demo objectives
CREATE TABLE IF NOT EXISTS public.custom_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    objectives JSONB NOT NULL DEFAULT '[]',
    tavus_objectives_id TEXT, -- Store the Tavus API objectives ID
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for custom_objectives
ALTER TABLE public.custom_objectives ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_objectives
CREATE POLICY "Users can view their custom objectives" ON public.custom_objectives 
FOR SELECT USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());

CREATE POLICY "Users can insert their custom objectives" ON public.custom_objectives 
FOR INSERT WITH CHECK ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());

CREATE POLICY "Users can update their custom objectives" ON public.custom_objectives 
FOR UPDATE USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());

CREATE POLICY "Users can delete their custom objectives" ON public.custom_objectives 
FOR DELETE USING ((SELECT user_id FROM public.demos WHERE id = demo_id) = auth.uid());

-- Add index for better performance
CREATE INDEX IF NOT EXISTS custom_objectives_demo_id_idx ON public.custom_objectives(demo_id);
CREATE INDEX IF NOT EXISTS custom_objectives_active_idx ON public.custom_objectives(demo_id, is_active) WHERE is_active = true;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_objectives_updated_at 
    BEFORE UPDATE ON public.custom_objectives 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();