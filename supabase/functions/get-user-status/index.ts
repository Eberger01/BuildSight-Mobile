// Edge Function: get-user-status
// Returns user info, credit balance, and usage statistics

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get device_id from header
    const deviceId = req.headers.get('x-device-id');
    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: 'Missing x-device-id header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user with wallet
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        device_id,
        email,
        plan_type,
        is_active,
        revenuecat_customer_id,
        created_at,
        credit_wallets (
          credits_balance,
          credits_reserved,
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

    // Get daily usage count
    const { data: dailyUsage } = await supabase.rpc('get_user_daily_usage', {
      p_user_id: user.id,
    });

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('id, amount, transaction_type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get system config for daily limit
    const { data: dailyLimitConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'daily_limit_per_user')
      .single();

    const dailyLimit = dailyLimitConfig?.value?.limit || 50;
    const wallet = user.credit_wallets?.[0] || user.credit_wallets;

    return new Response(
      JSON.stringify({
        userId: user.id,
        deviceId: user.device_id,
        email: user.email,
        planType: user.plan_type,
        isActive: user.is_active,
        revenuecatCustomerId: user.revenuecat_customer_id,
        creditsBalance: wallet?.credits_balance || 0,
        creditsReserved: wallet?.credits_reserved || 0,
        lifetimeCredits: wallet?.lifetime_credits || 0,
        dailyUsage: dailyUsage || 0,
        dailyLimit: dailyLimit,
        canUseAi: user.is_active && (wallet?.credits_balance || 0) > 0 && (dailyUsage || 0) < dailyLimit,
        recentTransactions: recentTransactions || [],
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
