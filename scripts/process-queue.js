
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || 'Plainly';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

const resend = new Resend(RESEND_API_KEY);

const BATCH_SIZE = 50;
const DELAY_BETWEEN_EMAILS_MS = 100;

async function processQueue() {
    console.log('Starting email queue processing...');

    try {
        // 1. Queue due broadcasts
        const { error: queueError } = await supabase.rpc('queue_due_broadcasts');
        if (queueError) {
            console.error('Error queueing broadcasts:', queueError);
        }

        // 2. Fetch pending jobs
        const { data: jobs, error: jobsError } = await supabase
            .from('email_jobs')
            .select(`
                id,
                user_id,
                broadcast_id,
                sequence_id,
                step_id,
                subscriber_id,
                attempts,
                subscribers (email, first_name, status),
                broadcasts (subject, body),
                sequence_steps (subject, body)
            `)
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString())
            .lt('attempts', 3)
            .limit(BATCH_SIZE);

        if (jobsError) throw jobsError;

        if (!jobs || jobs.length === 0) {
            console.log('No pending jobs found.');
            return;
        }

        console.log(`Found ${jobs.length} pending jobs.`);

        let sentCount = 0;
        let failedCount = 0;
        const processedBroadcastIds = new Set();

        for (const job of jobs) {
            processedBroadcastIds.add(job.broadcast_id);

            // Mark as processing
            await supabase
                .from('email_jobs')
                .update({ status: 'processing', attempts: job.attempts + 1 })
                .eq('id', job.id);

            const subscriber = job.subscribers;
            const broadcast = job.broadcasts;
            const sequenceStep = job.sequence_steps;

            if (!subscriber || subscriber.status !== 'active') {
                console.log(`Skipping job ${job.id}: Subscriber not active`);
                await supabase
                    .from('email_jobs')
                    .update({ status: 'failed', error_message: 'Subscriber not active', processed_at: new Date().toISOString() })
                    .eq('id', job.id);
                failedCount++;
                continue;
            }

            const subject = broadcast?.subject || sequenceStep?.subject;
            const body = broadcast?.body || sequenceStep?.body;

            if (!subject || !body) {
                console.error(`Job ${job.id} content missing`);
                await supabase
                    .from('email_jobs')
                    .update({ status: 'failed', error_message: 'Content missing', processed_at: new Date().toISOString() })
                    .eq('id', job.id);
                failedCount++;
                continue;
            }

            const personalizedBody = body.replace(/\{\{first_name\}\}/g, subscriber.first_name || 'there');

            try {
                const { data, error } = await resend.emails.send({
                    from: `${FROM_NAME} <${FROM_EMAIL}>`,
                    to: subscriber.email,
                    subject: subject,
                    html: personalizedBody.replace(/\n/g, '<br>'),
                });

                if (error) {
                    throw new Error(error.message);
                }

                await supabase
                    .from('email_jobs')
                    .update({ status: 'sent', processed_at: new Date().toISOString() })
                    .eq('id', job.id);

                // Log event
                await supabase.from('email_events').insert({
                    user_id: job.user_id,
                    subscriber_id: job.subscriber_id,
                    broadcast_id: job.broadcast_id,
                    sequence_id: job.sequence_id,
                    step_id: job.step_id,
                    event_type: 'sent'
                });

                console.log(`Sent email to ${subscriber.email}`);
                sentCount++;

            } catch (err) {
                console.error(`Failed to send to ${subscriber.email}:`, err.message);

                if (err.message && err.message.includes("only send testing emails to your own email address")) {
                    console.log("\x1b[33m%s\x1b[0m", "\n[TIP] You are in Resend Sandbox mode.");
                    console.log("\x1b[33m%s\x1b[0m", "To test for FREE, you must send emails ONLY to: teammedicqr@gmail.com");
                    console.log("\x1b[33m%s\x1b[0m", "Update your subscriber email in the database to match this address.\n");
                }

                await supabase
                    .from('email_jobs')
                    .update({
                        status: job.attempts >= 2 ? 'failed' : 'pending',
                        error_message: err.message,
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', job.id);
                failedCount++;
            }

            // Rate limit
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
        }

        // Update Broadcast Stats
        for (const broadcastId of processedBroadcastIds) {
            if (!broadcastId) continue;

            const { data: jobStats, error: statsError } = await supabase
                .from('email_jobs')
                .select('status')
                .eq('broadcast_id', broadcastId);

            if (statsError) {
                console.error(`Error fetching stats for broadcast ${broadcastId}`, statsError);
                continue;
            }

            const total = jobStats.length;
            const sent = jobStats.filter(j => j.status === 'sent').length;
            const failed = jobStats.filter(j => j.status === 'failed').length;
            const pending = jobStats.filter(j => j.status === 'pending' || j.status === 'processing').length;

            const { data: broadcastData } = await supabase
                .from('broadcasts')
                .select('stats')
                .eq('id', broadcastId)
                .single();

            const currentStats = broadcastData?.stats || {};
            const newStats = {
                ...currentStats,
                sent,
                failed,
                total
            };

            await supabase
                .from('broadcasts')
                .update({
                    stats: newStats,
                    ...(pending === 0 ? { status: 'sent' } : {})
                })
                .eq('id', broadcastId);

            console.log(`Updated stats for broadcast ${broadcastId}: ${sent} sent, ${failed} failed, ${pending} pending`);
        }

        console.log(`Batch complete: ${sentCount} sent, ${failedCount} failed.`);

    } catch (error) {
        console.error('Processing error:', error);
    }
}

processQueue();
