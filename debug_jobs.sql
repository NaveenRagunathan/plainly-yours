SELECT 
    b.id as broadcast_id,
    b.subject,
    b.status as broadcast_status,
    j.status as job_status,
    j.error_message,
    j.attempts,
    j.processed_at
FROM broadcasts b
LEFT JOIN email_jobs j ON j.broadcast_id = b.id
ORDER BY b.created_at DESC
LIMIT 10;
