// Edge Function: restore-purchases
// Restores purchases from RevenueCat and reconciles credit balance

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const revenuecatApiKey = Deno.env.get('REVENUECAT_API_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get device_id from header
    const deviceId = req.headers.get('x-device-id');
    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: 'Missing x-device-id header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        revenuecat_customer_id,
        credit_wallets (
          credits_balance,
          lifetime_credits
        )
      `)
      .eq('device_id', deviceId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we have RevenueCat API key, fetch subscriber info
    let revenuecatData = null;
    if (revenuecatApiKey && user.revenuecat_customer_id) {
      try {
        const rcResponse = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${user.revenuecat_customer_id}`,
          {
            headers: {
              'Authorization': `Bearer ${revenuecatApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (rcResponse.ok) {
          revenuecatData = await rcResponse.json();
        }
      } catch (rcError) {
        console.error('RevenueCat API error:', rcError);
      }
    }

    // Get all credit transactions for this user
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('id, amount, transaction_type, reference_id, created_at')
      .eq('user_id', user.id)
      .in('transaction_type', ['purchase', 'subscription_renewal'])
      .order('created_at', { ascending: false });

    // Get usage count
    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const wallet = user.credit_wallets?.[0] || user.credit_wallets;

    return new Response(
      JSON.stringify({
        message: 'Purchases restored successfully',
        userId: user.id,
        creditsBalance: wallet?.credits_balance || 0,
        lifetimeCredits: wallet?.lifetime_credits || 0,
        totalPurchases: transactions?.length || 0,
        totalUsage: usageLogs?.length || 0,
        transactions: transactions?.slice(0, 20) || [],
        revenuecatSubscriber: revenuecatData?.subscriber || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
