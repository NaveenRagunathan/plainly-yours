import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Resend API client (lightweight, no SDK needed for simple sending)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const VERIFIED_DOMAIN = Deno.env.get('VERIFIED_DOMAIN') || 'resend.dev'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const BATCH_SIZE = 50
const DELAY_BETWEEN_EMAILS_MS = 100

/**
 * Send email via Resend API
 */
async function sendEmail(to: string, subject: string, html: string, fromName: string, replyTo: string) {
    const fromAddress = `notifications@${VERIFIED_DOMAIN}`

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `${fromName} <${fromAddress}>`,
            to: [to],
            reply_to: replyTo,
            subject,
            html,
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send email')
    }

    return await response.json()
}

/**
 * Process email queue
 */
async function processQueue() {
    console.log('Starting email queue processing...')

    try {
        // 1. Queue due broadcasts
        const { error: queueError } = await supabase.rpc('queue_due_broadcasts')
        if (queueError) {
            console.error('Error queueing broadcasts:', queueError)
        }

        // 2. Fetch pending jobs with Sender Profile info
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
                profiles:user_id (name, email),
                subscribers (email, first_name, status),
                broadcasts (subject, body),
                sequence_steps (subject, body)
            `)
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString())
            .lt('attempts', 3)
            .limit(BATCH_SIZE)

        if (jobsError) throw jobsError

        if (!jobs || jobs.length === 0) {
            console.log('No pending jobs found.')
            return { processed: 0, sent: 0, failed: 0 }
        }

        console.log(`Found ${jobs.length} pending jobs.`)

        let sentCount = 0
        let failedCount = 0
        const processedBroadcastIds = new Set()

        for (const job of jobs) {
            processedBroadcastIds.add(job.broadcast_id)

            // Mark as processing
            await supabase
                .from('email_jobs')
                .update({ status: 'processing', attempts: job.attempts + 1 })
                .eq('id', job.id)

            const sender = job.profiles as any
            const subscriber = job.subscribers as any
            const broadcast = job.broadcasts as any
            const sequenceStep = job.sequence_steps as any

            if (!sender) {
                console.error(`Job ${job.id}: Sender profile missing`)
                await supabase
                    .from('email_jobs')
                    .update({
                        status: 'failed',
                        error_message: 'Sender profile missing',
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', job.id)
                failedCount++
                continue
            }

            if (!subscriber || subscriber.status !== 'active') {
                console.log(`Skipping job ${job.id}: Subscriber not active`)
                await supabase
                    .from('email_jobs')
                    .update({
                        status: 'failed',
                        error_message: 'Subscriber not active',
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', job.id)
                failedCount++
                continue
            }

            const subject = broadcast?.subject || sequenceStep?.subject
            const body = broadcast?.body || sequenceStep?.body

            if (!subject || !body) {
                console.error(`Job ${job.id} content missing`)
                await supabase
                    .from('email_jobs')
                    .update({
                        status: 'failed',
                        error_message: 'Content missing',
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', job.id)
                failedCount++
                continue
            }

            const personalizedBody = body.replace(/\{\{first_name\}\}/g, subscriber.first_name || 'there')

            try {
                await sendEmail(
                    subscriber.email,
                    subject,
                    personalizedBody.replace(/\n/g, '<br>'),
                    sender.name || 'Plainly Team',
                    sender.email
                )

                await supabase
                    .from('email_jobs')
                    .update({ status: 'sent', processed_at: new Date().toISOString() })
                    .eq('id', job.id)

                // Log event
                await supabase.from('email_events').insert({
                    user_id: job.user_id,
                    subscriber_id: job.subscriber_id,
                    broadcast_id: job.broadcast_id,
                    sequence_id: job.sequence_id,
                    step_id: job.step_id,
                    event_type: 'sent'
                })

                console.log(`Sent email to ${subscriber.email}`)
                sentCount++

            } catch (err: any) {
                console.error(`Failed to send to ${subscriber.email}:`, err.message)

                if (err.message && err.message.includes("only send testing emails to your own email address")) {
                    console.log("\x1b[33m%s\x1b[0m", "\n[TIP] You are in Resend Sandbox mode.")
                    console.log("\x1b[33m%s\x1b[0m", "To send to any email, verify your domain in Resend Dashboard.")
                }

                await supabase
                    .from('email_jobs')
                    .update({
                        status: job.attempts >= 2 ? 'failed' : 'pending',
                        error_message: err.message,
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', job.id)
                failedCount++
            }

            // Rate limit
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS))
        }

        // Update broadcast stats
        for (const broadcastId of processedBroadcastIds) {
            if (!broadcastId) continue

            const { data: jobStats } = await supabase
                .from('email_jobs')
                .select('status')
                .eq('broadcast_id', broadcastId)

            if (!jobStats) continue

            const total = jobStats.length
            const sent = jobStats.filter((j: any) => j.status === 'sent').length
            const failed = jobStats.filter((j: any) => j.status === 'failed').length
            const pending = jobStats.filter((j: any) => j.status === 'pending' || j.status === 'processing').length

            const { data: broadcastData } = await supabase
                .from('broadcasts')
                .select('stats')
                .eq('id', broadcastId)
                .single()

            const currentStats = broadcastData?.stats || {}
            const newStats = {
                ...currentStats,
                sent,
                failed,
                total
            }

            await supabase
                .from('broadcasts')
                .update({
                    stats: newStats,
                    ...(pending === 0 ? { status: 'sent' } : {})
                })
                .eq('id', broadcastId)

            console.log(`Updated stats for broadcast ${broadcastId}: ${sent} sent, ${failed} failed, ${pending} pending`)
        }

        console.log(`Batch complete: ${sentCount} sent, ${failedCount} failed.`)
        return { processed: jobs.length, sent: sentCount, failed: failedCount }

    } catch (error: any) {
        console.error('Processing error:', error)
        throw error
    }
}

serve(async (req: Request) => {
    // This edge function can be called via cron or manually
    try {
        const result = await processQueue()
        return new Response(
            JSON.stringify({ success: true, ...result }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
})
