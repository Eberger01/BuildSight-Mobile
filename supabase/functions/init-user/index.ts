// Edge Function: init-user
// Creates or retrieves a user based on device_id and initializes their credit wallet

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

    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
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

    if (existingUser) {
      // User exists, return their info
      const wallet = existingUser.credit_wallets?.[0] || existingUser.credit_wallets;
      return new Response(
        JSON.stringify({
          userId: existingUser.id,
          deviceId: existingUser.device_id,
          email: existingUser.email,
          planType: existingUser.plan_type,
          isActive: existingUser.is_active,
          revenuecatCustomerId: existingUser.revenuecat_customer_id,
          creditsBalance: wallet?.credits_balance || 0,
          creditsReserved: wallet?.credits_reserved || 0,
          lifetimeCredits: wallet?.lifetime_credits || 0,
          isNewUser: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User doesn't exist, create new user and wallet
    const { data: newUser, error: insertUserError } = await supabase
      .from('users')
      .insert({
        device_id: deviceId,
        plan_type: 'free',
        is_active: true,
      })
      .select('id, device_id, plan_type, is_active, created_at')
      .single();

    if (insertUserError) {
      console.error('Error creating user:', insertUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: insertUserError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create credit wallet for new user (starts with 0 credits - no free tier)
    const { error: insertWalletError } = await supabase
      .from('credit_wallets')
      .insert({
        user_id: newUser.id,
        credits_balance: 0,
        credits_reserved: 0,
        lifetime_credits: 0,
      });

    if (insertWalletError) {
      console.error('Error creating wallet:', insertWalletError);
      // Wallet creation failed, but user exists - return user anyway
    }

    return new Response(
      JSON.stringify({
        userId: newUser.id,
        deviceId: newUser.device_id,
        email: null,
        planType: newUser.plan_type,
        isActive: newUser.is_active,
        revenuecatCustomerId: null,
        creditsBalance: 0,
        creditsReserved: 0,
        lifetimeCredits: 0,
        isNewUser: true,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
