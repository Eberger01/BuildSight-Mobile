// Edge Function: reserve-credit
// Reserves a credit before making an AI call (prevents double-spending)

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

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { projectType, countryCode } = body;

    // Check global AI enabled status
    const { data: aiConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'ai_enabled')
      .single();

    if (!aiConfig?.value?.enabled) {
      return new Response(
        JSON.stringify({ error: 'AI service is temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check maintenance mode
    const { data: maintenanceConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    if (maintenanceConfig?.value?.enabled) {
      return new Response(
        JSON.stringify({
          error: 'Service is under maintenance',
          message: maintenanceConfig.value.message || 'Please try again later',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('device_id', deviceId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found. Please initialize user first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.is_active) {
      return new Response(
        JSON.stringify({ error: 'Account is suspended' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily limit
    const { data: dailyUsage } = await supabase.rpc('get_user_daily_usage', {
      p_user_id: user.id,
    });

    const { data: dailyLimitConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'daily_limit_per_user')
      .single();

    const dailyLimit = dailyLimitConfig?.value?.limit || 50;
    if ((dailyUsage || 0) >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: 'Daily limit reached',
          dailyUsage,
          dailyLimit,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique request ID
    const requestId = crypto.randomUUID();

    // Try to reserve credit
    const { data: reserved, error: reserveError } = await supabase.rpc('reserve_credit', {
      p_user_id: user.id,
      p_request_id: requestId,
      p_project_type: projectType || null,
      p_country_code: countryCode || null,
    });

    if (reserveError) {
      console.error('Reserve error:', reserveError);
      return new Response(
        JSON.stringify({ error: 'Failed to reserve credit', details: reserveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reserved) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get updated balance
    const { data: wallet } = await supabase
      .from('credit_wallets')
      .select('credits_balance, credits_reserved')
      .eq('user_id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        requestId,
        creditsBalance: wallet?.credits_balance || 0,
        creditsReserved: wallet?.credits_reserved || 0,
        message: 'Credit reserved successfully. Use requestId for generate-estimate call.',
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
