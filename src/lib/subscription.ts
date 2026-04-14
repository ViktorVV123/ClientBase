import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro';

export interface Subscription {
    id: string;
    user_id: string;
    plan: Plan;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_end: string | null;
}

// ─── Fetch ───────────────────────────────────────────────────────────────

export const fetchSubscription = async (): Promise<Subscription | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error || !data) return null;
    return data as Subscription;
};

// ─── Can create client? ──────────────────────────────────────────────────

export const canCreateClient = async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('can_create_client');
    if (error) {
        console.error('can_create_client error:', error);
        return false;
    }
    return !!data;
};

// ─── Stripe Checkout ─────────────────────────────────────────────────────

const SUPABASE_URL = 'https://cemtccfulgwewdptkukt.supabase.co';

export const createCheckoutSession = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                returnUrl: window.location.origin,
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('Checkout error:', errText);
            return null;
        }

        const { url } = await res.json();
        return url;
    } catch (err) {
        console.error('Failed to create checkout session:', err);
        return null;
    }
};

// ─── Customer Portal (manage subscription) ───────────────────────────────

export const createPortalSession = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-portal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                returnUrl: window.location.origin,
            }),
        });

        if (!res.ok) return null;

        const { url } = await res.json();
        return url;
    } catch (err) {
        console.error('Failed to create portal session:', err);
        return null;
    }
};
