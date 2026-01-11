import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
})

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')!
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return new Response(
            JSON.stringify({ error: 'Webhook signature verification failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    console.log('Received webhook event:', event.type)

    try {
        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.user_id
                const planId = session.metadata?.plan_id

                if (!userId || !planId) {
                    console.error('Missing metadata in checkout session:', session.id)
                    break
                }

                console.log(`Checkout completed for user ${userId}, plan ${planId}`)

                const { error } = await supabase.from('profiles').update({
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                    plan: planId,
                    subscription_status: 'active',
                }).eq('id', userId)

                if (error) {
                    console.error('Error updating profile after checkout:', error)
                } else {
                    console.log(`Successfully updated profile for user ${userId}`)
                }
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription

                console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`)

                const { error } = await supabase.from('profiles').update({
                    subscription_status: subscription.status,
                    subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                }).eq('stripe_subscription_id', subscription.id)

                if (error) {
                    console.error('Error updating subscription status:', error)
                } else {
                    console.log(`Successfully updated subscription ${subscription.id}`)
                }
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription

                console.log(`Subscription deleted: ${subscription.id}`)

                const { error } = await supabase.from('profiles').update({
                    subscription_status: 'canceled',
                    plan: 'free', // Downgrade to free tier
                }).eq('stripe_subscription_id', subscription.id)

                if (error) {
                    console.error('Error downgrading user to free:', error)
                } else {
                    console.log(`Successfully downgraded user to free plan`)
                }
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice

                if (!invoice.subscription) break

                console.log(`Payment failed for subscription: ${invoice.subscription}`)

                const { error } = await supabase.from('profiles').update({
                    subscription_status: 'past_due',
                }).eq('stripe_subscription_id', invoice.subscription as string)

                if (error) {
                    console.error('Error marking subscription as past_due:', error)
                } else {
                    console.log(`Marked subscription ${invoice.subscription} as past_due`)
                }

                // TODO: Send email notification to user about failed payment
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice

                if (!invoice.subscription) break

                console.log(`Payment succeeded for subscription: ${invoice.subscription}`)

                const { error } = await supabase.from('profiles').update({
                    subscription_status: 'active',
                }).eq('stripe_subscription_id', invoice.subscription as string)

                if (error) {
                    console.error('Error marking subscription as active:', error)
                } else {
                    console.log(`Marked subscription ${invoice.subscription} as active`)
                }
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return new Response(
            JSON.stringify({ received: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
