create or replace function public.handle_new_video()
returns trigger as $$
declare
  v_path text;
begin
  -- Get the path of the new video
  v_path := new.path_tokens[1];

  -- Invoke the process-video Edge Function
  perform net.http_post(
    url := 'https://zewcvwsirjvgknvrmhhk.functions.supabase.co/process-video',
    headers := '{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpld2N2d3Npcmp2Z2tudnJtaGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDY4NDEsImV4cCI6MjA2ODc4Mjg0MX0.MRPsHXx-53yWCa2UFE4l385uiKspENF5jEwd-x0WQ-c\"}',
    body := jsonb_build_object('type', 'INSERT', 'table', 'objects', 'schema', 'storage', 'record', jsonb_build_object('key', new.name, 'bucket', new.bucket_id))
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create or replace trigger on_new_video
  after insert on storage.objects
  for each row
  when (new.bucket_id = 'demo-videos')
  execute procedure public.handle_new_video();