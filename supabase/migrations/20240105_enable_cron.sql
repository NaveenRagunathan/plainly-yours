-- Enable the pg_cron extension to schedule jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the email processor to run every minute
-- Note regarding edge functions: 
-- Typically pg_cron calls a SQL function. To call an edge function, 
-- we use `net.http_post` if `pg_net` is available, 
-- OR strictly speaking, the edge function might be invoked by a separate cron trigger in the Supabase Dashboard.
-- HOWEVER, standard practice for self-contained setup is pg_cron -> sql -> edge function (via pg_net) 
-- OR simply letting the edge function run periodically if Supabase platform cron is used.
-- Given the user environment, I will provide the SQL to schedule it assuming pg_net is available,
-- OR better yet, since I am editing the `index.ts`, I can make the `index.ts` be the cron handler itself
-- and just rely on the user adding it to the dashboard or using `pg_cron` to invoke a webhook.

-- Optimally: We use a Postgres function that calls the Edge Function.
-- BUT, to keep it simple and robust:
-- We'll just enabling the extension and providing the command.
-- The actual invocation of the edge function `process-scheduled-emails` is usually done via 
-- Supabase Dashboard -> Edge Functions -> Cron Schedule NOT via SQL directly unless using pg_net.

-- Let's stick to enabling the extension and adding a comment, 
-- but actually, the `process-scheduled-emails` logic I am adding (queueing) 
-- can be called directly by the edge function itself.

-- So this file is just to enable the extension in case they want DB-level scheduling.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Example schedule (commented out as it requires the project URL/Key which varies)
-- SELECT cron.schedule(
--   'process-emails-every-minute',
--   '* * * * *',
--   $$
--   select
--     net.http_post(
--       url:='https://project-ref.supabase.co/functions/v1/process-scheduled-emails',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--       body:='{}'::jsonb
--     ) as request_id;
--   $$
-- );
