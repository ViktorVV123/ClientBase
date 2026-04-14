// supabase/functions/stripe-webhook/index.ts
// Обрабатывает Stripe webhook events:
//   - checkout.session.completed → активирует Pro подписку
//   - customer.subscription.updated → обновляет статус
//   - customer.subscription.deleted → отменяет подписку
//
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
    const signature = req.headers.get('stripe-signature')!;
    const body = await req.text();

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                if (!userId) break;

                // Получаем subscription из Stripe
                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription as string
                );

                await supabase
                    .from('subscriptions')
                    .update({
                        plan: 'pro',
                        status: 'active',
                        stripe_subscription_id: subscription.id,
                        stripe_price_id: subscription.items.data[0]?.price.id,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId);

                console.log(`✅ User ${userId} upgraded to Pro`);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Находим юзера по stripe_customer_id
                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (!sub) break;

                const status = subscription.status === 'active' ? 'active'
                    : subscription.status === 'past_due' ? 'past_due'
                        : subscription.status === 'trialing' ? 'trialing'
                            : 'canceled';

                await supabase
                    .from('subscriptions')
                    .update({
                        status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', sub.user_id);

                console.log(`🔄 Subscription updated for user ${sub.user_id}: ${status}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (!sub) break;

                // Откатываем на free
                await supabase
                    .from('subscriptions')
                    .update({
                        plan: 'free',
                        status: 'canceled',
                        stripe_subscription_id: null,
                        stripe_price_id: null,
                        current_period_start: null,
                        current_period_end: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', sub.user_id);

                console.log(`❌ Subscription canceled for user ${sub.user_id}`);
                break;
            }
        }
    } catch (err) {
        console.error('Webhook handler error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    });
});
