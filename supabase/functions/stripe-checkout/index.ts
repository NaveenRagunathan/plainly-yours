import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { planId, origin } = await req.json()

        // Initialize Stripe
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
        })

        // Validate plan ID
        if (!planId || planId === 'free') {
            return new Response(
                JSON.stringify({ error: 'Invalid plan - free tier does not require checkout' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Get Stripe Price ID based on plan
        let priceId: string
        let mode: 'subscription' | 'payment' = 'subscription'

        if (planId === 'starter') {
            priceId = 'price_1SoKCGCNhEYzrUbp0bfc6taR'
            mode = 'subscription'
        } else if (planId === 'lifetime') {
            priceId = 'price_1SoLGKCNhEYzrUbp4N2HPM3x' // Lifetime one-time payment
            mode = 'payment' // One-time payment for lifetime
        } else {
            return new Response(
                JSON.stringify({ error: `Unknown plan: ${planId}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Get authenticated user from JWT
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Not authenticated' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Extract JWT payload (Supabase already validated it)
        const token = authHeader.replace('Bearer ', '')
        const payload = JSON.parse(atob(token.split('.')[1]))

        if (!payload.sub || !payload.email) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            customer_email: payload.email,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: mode,
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/dashboard/settings`,
            metadata: {
                user_id: payload.sub,
                plan_id: planId,
            },
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('Stripe checkout error:', error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
