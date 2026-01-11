-- Function to queue due broadcasts
CREATE OR REPLACE FUNCTION public.queue_due_broadcasts()
RETURNS void AS $$
DECLARE
    broadcast_record RECORD;
BEGIN
    -- Loop through all scheduled broadcasts that are due
    -- Also include 'sending' broadcasts that have NO jobs (stuck in transition)
    FOR broadcast_record IN 
        SELECT b.* 
        FROM public.broadcasts b
        WHERE (b.status = 'scheduled' AND b.scheduled_for <= now())
        OR (b.status = 'sending' AND NOT EXISTS (SELECT 1 FROM email_jobs WHERE broadcast_id = b.id))
        FOR UPDATE SKIP LOCKED
    LOOP
        -- 1. Insert jobs for all active subscribers of this user
        -- Note: Handling simple tag filtering if present
        INSERT INTO public.email_jobs (
            user_id,
            broadcast_id,
            subscriber_id,
            status,
            scheduled_at,
            created_at
        )
        SELECT 
            broadcast_record.user_id,
            broadcast_record.id,
            s.id,
            'pending',
            now(), -- Schedule immediately
            now()
        FROM public.subscribers s
        WHERE s.user_id = broadcast_record.user_id
        AND s.status = 'active'
        AND (
            -- Logical filter: If tags are present in filter, user must have at least one matching tag
            (broadcast_record.recipient_filter->'tags') IS NULL 
            OR jsonb_array_length(broadcast_record.recipient_filter->'tags') = 0
            OR (
                -- Check overlap between subscriber tags (text[]) and filter tags (jsonb array)
                s.tags && ARRAY(
                    SELECT jsonb_array_elements_text(broadcast_record.recipient_filter->'tags')
                )
            )
        );

        -- 2. Update broadcast status to sending
        UPDATE public.broadcasts
        SET status = 'sending'
            -- processed_at = now() -- If you add this column later
        WHERE id = broadcast_record.id;

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
