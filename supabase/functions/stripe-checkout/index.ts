import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { planId, origin } = await req.json()

        // Initialize Stripe
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
        })

        // Define pricing plans with new structure
        // NOTE: Replace these Price IDs with actual ones from your Stripe Dashboard
        const plans = {
            'free': null, // Free tier - no checkout needed
            'starter': {
                price: 'price_1XX_REPLACE_WITH_REAL_STARTER_PRICE_ID', // $19/month
                name: 'Starter Plan',
            },
            'pro': {
                price: 'price_1YY_REPLACE_WITH_REAL_PRO_PRICE_ID', // $49/month
                name: 'Pro Plan',
            },
        }

        // Check if plan exists and is not free
        if (planId === 'free') {
            return new Response(
                JSON.stringify({ error: 'Free plan does not require checkout' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                },
            )
        }

        const selectedPlan = plans[planId as keyof typeof plans]
        if (!selectedPlan) {
            throw new Error('Invalid plan ID')
        }

        // Get user from auth header
        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/auth/v1/user`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    apikey: Deno.env.get('SUPABASE_ANON_KEY') || '',
                },
            }
        ).then(res => res.json())

        if (userError || !user) {
            throw new Error('Authentication required')
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            line_items: [
                {
                    price: selectedPlan.price,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/auth`,
            metadata: {
                user_id: user.id,
                plan_id: planId,
            },
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
