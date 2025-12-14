// Edge Function: generate-estimate
// Proxies AI estimation to Gemini API with secure server-side API key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.24.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

// Country configuration (same as mobile app)
type CountryCode = 'DE' | 'FR' | 'ES' | 'IT' | 'NL' | 'BE' | 'AT' | 'UK' | 'US' | 'BR';
type CurrencyCode = 'EUR' | 'GBP' | 'USD' | 'BRL';
type UnitSystem = 'metric' | 'imperial';

interface CountryConfig {
  name: string;
  currency: CurrencyCode;
  units: UnitSystem;
  laborRateRange: string;
  vatRate: string;
  permitInfo: string;
}

const COUNTRIES: Record<CountryCode, CountryConfig> = {
  DE: {
    name: 'Germany',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '45-85 EUR/hr',
    vatRate: '19%',
    permitInfo: 'Building permits required for structural work (Baugenehmigung)',
  },
  FR: {
    name: 'France',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '40-75 EUR/hr',
    vatRate: '20% (10% for renovation)',
    permitInfo: 'Permis de construire required for major works',
  },
  ES: {
    name: 'Spain',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '25-50 EUR/hr',
    vatRate: '21% (10% for renovation)',
    permitInfo: 'Licencia de obras required',
  },
  IT: {
    name: 'Italy',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '30-60 EUR/hr',
    vatRate: '22% (10% for renovation)',
    permitInfo: 'Permesso di costruire or SCIA depending on work type',
  },
  NL: {
    name: 'Netherlands',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '50-90 EUR/hr',
    vatRate: '21%',
    permitInfo: 'Omgevingsvergunning required for major construction',
  },
  BE: {
    name: 'Belgium',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '45-80 EUR/hr',
    vatRate: '21% (6% for renovation >10yr)',
    permitInfo: 'Stedenbouwkundige vergunning required',
  },
  AT: {
    name: 'Austria',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '50-90 EUR/hr',
    vatRate: '20%',
    permitInfo: 'Baubewilligung required for structural changes',
  },
  UK: {
    name: 'United Kingdom',
    currency: 'GBP',
    units: 'metric',
    laborRateRange: '40-80 GBP/hr',
    vatRate: '20%',
    permitInfo: 'Planning permission and Building Regulations approval may apply',
  },
  US: {
    name: 'United States',
    currency: 'USD',
    units: 'imperial',
    laborRateRange: '$50-120/hr',
    vatRate: 'Sales tax varies by state (0-10%)',
    permitInfo: 'Building permits required, varies by municipality',
  },
  BR: {
    name: 'Brazil',
    currency: 'BRL',
    units: 'metric',
    laborRateRange: 'R$30-80/hr',
    vatRate: 'ICMS/ISS varies (5-18%)',
    permitInfo: 'Alvará de construção required',
  },
};

function getCountryConfig(code: CountryCode): CountryConfig {
  return COUNTRIES[code] || COUNTRIES.DE;
}

function getAreaUnit(units: UnitSystem): string {
  return units === 'metric' ? 'm²' : 'sq ft';
}

// Parse JSON from AI response (handles markdown code blocks)
function parseJsonResponse<T>(text: string): T {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const jsonText = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonText) as T;
  }

  throw new Error('Unable to parse AI response');
}

interface ProjectData {
  clientName: string;
  email?: string;
  phone?: string;
  projectType: string;
  description: string;
  squareFootage?: string;
  timeline?: string;
}

interface RegionSettings {
  country: CountryCode;
  currency: CurrencyCode;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    const body = await req.json();
    const { request_id, project_data, region_settings } = body as {
      request_id: string;
      project_data: ProjectData;
      region_settings: RegionSettings;
    };

    if (!request_id || !project_data || !region_settings) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: request_id, project_data, region_settings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check global AI enabled status
    const { data: aiConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'ai_enabled')
      .single();

    if (!aiConfig?.value?.enabled) {
      // Rollback the reservation
      await supabase.rpc('rollback_credit_reservation', {
        p_request_id: request_id,
        p_error_message: 'AI service temporarily unavailable',
      });

      return new Response(
        JSON.stringify({ error: 'AI service is temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reservation exists and belongs to this device
    const { data: usage, error: usageError } = await supabase
      .from('usage_logs')
      .select(`
        id,
        user_id,
        status,
        users!inner (
          device_id
        )
      `)
      .eq('request_id', request_id)
      .eq('status', 'pending')
      .single();

    if (usageError || !usage) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reservation. Please reserve credit first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify device_id matches
    const usageDeviceId = (usage.users as any)?.device_id;
    if (usageDeviceId !== deviceId) {
      return new Response(
        JSON.stringify({ error: 'Reservation does not belong to this device' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt (same as client-side geminiService.ts)
    const countryConfig = getCountryConfig(region_settings.country);
    const areaUnit = getAreaUnit(countryConfig.units);
    const isMetric = countryConfig.units === 'metric';

    const prompt = `
You are an expert contractor cost estimator with 20+ years of experience in residential construction and remodeling.

**REGIONAL CONTEXT (CRITICAL - You MUST use local market rates for this country):**
- Country: ${countryConfig.name}
- Currency: ${region_settings.currency}
- Unit System: ${isMetric ? 'Metric (m², kg, cm, meters)' : 'Imperial (sq ft, lbs, inches, feet)'}
- Typical Labor Rates in ${countryConfig.name}: ${countryConfig.laborRateRange}
- VAT/Tax Rate: ${countryConfig.vatRate}
- Permit Requirements: ${countryConfig.permitInfo}

IMPORTANT: All costs MUST be in ${region_settings.currency}. Use ${countryConfig.name} market prices for materials and labor. All area measurements should be in ${areaUnit}.

Based on the following project details, provide a detailed and accurate cost estimate:

**Project Information:**
- Client: ${project_data.clientName}
- Project Type: ${project_data.projectType}
- Description: ${project_data.description}
- Area: ${project_data.squareFootage || 'Not specified'} ${areaUnit}
- Preferred Timeline: ${project_data.timeline || 'Flexible'}

**Please provide a comprehensive estimate in the following JSON format:**

{
  "totalEstimate": {
    "min": <number>,
    "max": <number>,
    "average": <number>,
    "currency": "${region_settings.currency}"
  },
  "breakdown": {
    "materials": {
      "cost": <number>,
      "items": [
        {"item": "...", "quantity": "... ${areaUnit}", "unitCost": <number>, "total": <number>}
      ]
    },
    "labor": {
      "cost": <number>,
      "hours": <number>,
      "hourlyRate": <number based on ${countryConfig.laborRateRange}>
    },
    "permits": <number based on ${countryConfig.name} requirements>,
    "contingency": <number>,
    "overhead": <number>
  },
  "timeline": {
    "estimatedDays": <number>,
    "phases": [
      {"phase": "...", "duration": "..."}
    ]
  },
  "risks": [
    {"risk": "...", "mitigation": "...", "impact": "low|medium|high"}
  ],
  "recommendations": [
    "..."
  ],
  "notes": "Additional information including ${countryConfig.name}-specific considerations"
}

Ensure all costs are realistic for the ${countryConfig.name} market in 2025. Include any country-specific requirements or regulations. Be thorough and detailed.
`;

    // Call Gemini API
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const estimate = parseJsonResponse(text);
      const latencyMs = Date.now() - startTime;

      // Finalize the usage (deduct credit permanently)
      await supabase.rpc('finalize_credit_usage', {
        p_request_id: request_id,
        p_latency_ms: latencyMs,
        p_response_tokens: text.length,
        p_estimated_cost_usd: 0.10, // Estimated cost per request
      });

      return new Response(
        JSON.stringify({
          estimate,
          requestId: request_id,
          latencyMs,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      console.error('Gemini API error:', aiError);

      // Rollback the credit reservation on AI failure
      await supabase.rpc('rollback_credit_reservation', {
        p_request_id: request_id,
        p_error_message: aiError instanceof Error ? aiError.message : 'AI generation failed',
      });

      return new Response(
        JSON.stringify({
          error: 'AI estimation failed',
          details: aiError instanceof Error ? aiError.message : 'Unknown error',
          creditRefunded: true,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
