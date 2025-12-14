// Edge Function: revenuecat-webhook
// Handles RevenueCat webhook events for purchases, renewals, and cancellations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-revenuecat-signature',
};

// Product configuration - credits per product
const PRODUCT_CREDITS: Record<string, number> = {
  'buildsight_credit_single': 1,
  'buildsight_credit_pack10': 10,
  'buildsight_pro_monthly': 50,
  // Add localized product IDs if needed
  'buildsight_credit_single_eur': 1,
  'buildsight_credit_pack10_eur': 10,
  'buildsight_pro_monthly_eur': 50,
};

// Map product ID to plan type
const PRODUCT_PLAN_TYPE: Record<string, string> = {
  'buildsight_credit_single': 'single',
  'buildsight_credit_pack10': 'pack10',
  'buildsight_pro_monthly': 'pro_monthly',
  'buildsight_credit_single_eur': 'single',
  'buildsight_credit_pack10_eur': 'pack10',
  'buildsight_pro_monthly_eur': 'pro_monthly',
};

// Verify RevenueCat webhook signature
function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    console.warn('Missing signature or secret for webhook verification');
    return true; // Allow in development, should be false in production
  }

  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const bodyText = await req.text();

    // Verify webhook signature
    const signature = req.headers.get('x-revenuecat-signature');
    if (webhookSecret && !verifySignature(bodyText, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook payload
    const event = JSON.parse(bodyText);
    console.log('RevenueCat webhook received:', JSON.stringify(event, null, 2));

    const { event: eventData } = event;
    if (!eventData) {
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const {
      type: eventType,
      app_user_id: appUserId,
      product_id: productId,
      transaction_id: transactionId,
      purchased_at_ms: purchasedAtMs,
      expiration_at_ms: expirationAtMs,
    } = eventData;

    console.log(`Processing event: ${eventType} for user: ${appUserId}, product: ${productId}`);

    // Find user by device_id (appUserId is our device_id)
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, plan_type')
      .eq('device_id', appUserId)
      .single();

    // If not found by device_id, try revenuecat_customer_id
    if (!user) {
      const { data: userByRC } = await supabase
        .from('users')
        .select('id, plan_type')
        .eq('revenuecat_customer_id', appUserId)
        .single();
      user = userByRC;
    }

    if (!user) {
      console.error(`User not found for app_user_id: ${appUserId}`);
      // Return 200 to acknowledge receipt (don't want RevenueCat to retry endlessly)
      return new Response(
        JSON.stringify({ warning: 'User not found', app_user_id: appUserId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update RevenueCat customer ID if not set
    await supabase
      .from('users')
      .update({ revenuecat_customer_id: appUserId })
      .eq('id', user.id)
      .is('revenuecat_customer_id', null);

    // Handle different event types
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE': {
        // Credit pack or first subscription purchase
        const credits = PRODUCT_CREDITS[productId] || 0;
        const planType = PRODUCT_PLAN_TYPE[productId] || 'single';

        if (credits > 0) {
          // Add credits to wallet
          await supabase.rpc('add_credits', {
            p_user_id: user.id,
            p_amount: credits,
            p_transaction_type: 'purchase',
            p_reference_id: transactionId,
            p_description: `Purchase: ${productId} (${credits} credits)`,
          });

          // Update plan type
          await supabase
            .from('users')
            .update({ plan_type: planType, updated_at: new Date().toISOString() })
            .eq('id', user.id);

          console.log(`Added ${credits} credits to user ${user.id} for ${productId}`);
        }
        break;
      }

      case 'RENEWAL': {
        // Subscription renewal - add monthly credits
        const credits = PRODUCT_CREDITS[productId] || 0;

        if (credits > 0) {
          await supabase.rpc('add_credits', {
            p_user_id: user.id,
            p_amount: credits,
            p_transaction_type: 'subscription_renewal',
            p_reference_id: transactionId,
            p_description: `Renewal: ${productId} (${credits} credits)`,
          });

          console.log(`Renewal: Added ${credits} credits to user ${user.id}`);
        }
        break;
      }

      case 'CANCELLATION':
      case 'EXPIRATION': {
        // Subscription cancelled or expired - downgrade to free
        await supabase
          .from('users')
          .update({ plan_type: 'free', updated_at: new Date().toISOString() })
          .eq('id', user.id);

        console.log(`User ${user.id} downgraded to free plan`);
        break;
      }

      case 'PRODUCT_CHANGE': {
        // User changed subscription tier
        const newPlanType = PRODUCT_PLAN_TYPE[productId] || 'free';
        await supabase
          .from('users')
          .update({ plan_type: newPlanType, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        console.log(`User ${user.id} changed plan to ${newPlanType}`);
        break;
      }

      case 'BILLING_ISSUE': {
        // Payment failed - could suspend or warn user
        console.warn(`Billing issue for user ${user.id}`);
        // Optionally: Set a flag, send notification, etc.
        break;
      }

      case 'SUBSCRIBER_ALIAS': {
        // User ID alias created - update our records
        const { new_app_user_id: newAppUserId } = eventData;
        if (newAppUserId) {
          await supabase
            .from('users')
            .update({ revenuecat_customer_id: newAppUserId })
            .eq('id', user.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(
      JSON.stringify({ success: true, eventType, userId: user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 even on error to prevent RevenueCat from retrying
    return new Response(
      JSON.stringify({ error: 'Processing error', details: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
