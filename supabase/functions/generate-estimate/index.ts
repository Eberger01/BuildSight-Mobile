// Edge Function: generate-estimate
// Proxies AI estimation to Gemini API with secure server-side API key
// Uses structured JSON output with professional estimator prompt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI, SchemaType } from 'npm:@google/generative-ai@0.24.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

// Country configuration (same as mobile app constants/countries.ts)
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

function parseVatRateToDecimal(vatRateStr: string): number {
  const match = vatRateStr.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]) / 100;
  }
  return 0.19;
}

// JSON Schema for structured output (same as mobile app services/estimateSchema.ts)
const ESTIMATE_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    totalEstimate: {
      type: SchemaType.OBJECT,
      properties: {
        net: {
          type: SchemaType.OBJECT,
          properties: {
            min: { type: SchemaType.NUMBER },
            max: { type: SchemaType.NUMBER },
            average: { type: SchemaType.NUMBER },
          },
          required: ['min', 'max', 'average'],
        },
        gross: {
          type: SchemaType.OBJECT,
          properties: {
            min: { type: SchemaType.NUMBER },
            max: { type: SchemaType.NUMBER },
            average: { type: SchemaType.NUMBER },
          },
          required: ['min', 'max', 'average'],
        },
        taxRate: { type: SchemaType.NUMBER },
        taxAmount: { type: SchemaType.NUMBER },
        currency: { type: SchemaType.STRING },
      },
      required: ['net', 'gross', 'taxRate', 'taxAmount', 'currency'],
    },
    breakdown: {
      type: SchemaType.OBJECT,
      properties: {
        materials: {
          type: SchemaType.OBJECT,
          properties: {
            cost: { type: SchemaType.NUMBER },
            items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  item: { type: SchemaType.STRING },
                  quantity: { type: SchemaType.STRING },
                  unitCost: { type: SchemaType.NUMBER },
                  total: { type: SchemaType.NUMBER },
                },
                required: ['item', 'quantity', 'unitCost', 'total'],
              },
            },
          },
          required: ['cost', 'items'],
        },
        labor: {
          type: SchemaType.OBJECT,
          properties: {
            cost: { type: SchemaType.NUMBER },
            hours: { type: SchemaType.NUMBER },
            hourlyRate: { type: SchemaType.NUMBER },
            trades: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  trade: { type: SchemaType.STRING },
                  hours: { type: SchemaType.NUMBER },
                  rate: { type: SchemaType.NUMBER },
                  cost: { type: SchemaType.NUMBER },
                },
                required: ['trade', 'hours', 'rate', 'cost'],
              },
            },
          },
          required: ['cost', 'hours', 'hourlyRate'],
        },
        permits: { type: SchemaType.NUMBER },
        contingency: { type: SchemaType.NUMBER },
        contingencyRate: { type: SchemaType.NUMBER },
        overhead: { type: SchemaType.NUMBER },
        overheadRate: { type: SchemaType.NUMBER },
      },
      required: ['materials', 'labor', 'permits', 'contingency', 'overhead'],
    },
    timeline: {
      type: SchemaType.OBJECT,
      properties: {
        estimatedDays: { type: SchemaType.NUMBER },
        phases: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              phase: { type: SchemaType.STRING },
              duration: { type: SchemaType.STRING },
            },
            required: ['phase', 'duration'],
          },
        },
      },
      required: ['estimatedDays', 'phases'],
    },
    risks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          risk: { type: SchemaType.STRING },
          mitigation: { type: SchemaType.STRING },
          impact: { type: SchemaType.STRING },
        },
        required: ['risk', 'mitigation', 'impact'],
      },
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    assumptions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    exclusions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    notes: { type: SchemaType.STRING },
  },
  required: ['totalEstimate', 'breakdown', 'timeline', 'risks', 'recommendations', 'assumptions', 'exclusions', 'notes'],
};

// Parse JSON from AI response (fallback for non-structured output)
function parseJsonResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fall back to regex extraction
  }

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const jsonText = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonText) as T;
  }

  throw new Error('Unable to parse AI response');
}

// Normalize estimate for backward compatibility
function normalizeEstimate(estimate: any): any {
  if (!estimate || !estimate.totalEstimate) return estimate;

  const { net, gross } = estimate.totalEstimate;

  // Add legacy fields for backward compatibility
  if (gross) {
    estimate.totalEstimate.min = gross.min;
    estimate.totalEstimate.max = gross.max;
    estimate.totalEstimate.average = gross.average;
  } else if (net) {
    estimate.totalEstimate.min = net.min;
    estimate.totalEstimate.max = net.max;
    estimate.totalEstimate.average = net.average;
  }

  // Ensure assumptions and exclusions exist
  if (!estimate.assumptions) estimate.assumptions = [];
  if (!estimate.exclusions) estimate.exclusions = [];

  return estimate;
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

// Build professional estimation prompt (same as mobile app services/estimatePrompt.ts)
function buildEstimatePrompt(
  projectData: ProjectData,
  countryConfig: CountryConfig,
  currency: string
): string {
  const areaUnit = getAreaUnit(countryConfig.units);
  const isMetric = countryConfig.units === 'metric';
  const vatDecimal = parseVatRateToDecimal(countryConfig.vatRate);

  return `You are a licensed professional cost estimator (Quantity Surveyor) with 20+ years of experience in residential construction and remodeling. You produce detailed, accurate estimates that contractors use for client proposals.

═══════════════════════════════════════════════════════════════════════════════
REGIONAL MARKET CONTEXT (MANDATORY - ALL PRICING MUST REFLECT THIS REGION)
═══════════════════════════════════════════════════════════════════════════════
• Country: ${countryConfig.name}
• Currency: ${currency} (ALL amounts in this currency)
• Unit System: ${isMetric ? 'METRIC (m², m, kg, cm)' : 'IMPERIAL (sq ft, ft, lbs, inches)'}
• Typical Labor Rates: ${countryConfig.laborRateRange}
• VAT/Tax Rate: ${countryConfig.vatRate} (use ${vatDecimal} as decimal)
• Permit Requirements: ${countryConfig.permitInfo}

You MUST use ${countryConfig.name} 2025 market prices for materials and labor.
All area measurements MUST be in ${areaUnit}.

═══════════════════════════════════════════════════════════════════════════════
PROJECT SCOPE
═══════════════════════════════════════════════════════════════════════════════
• Client: ${projectData.clientName}
• Project Type: ${projectData.projectType}
• Description: ${projectData.description}
• Area: ${projectData.squareFootage || 'Not specified'} ${areaUnit}
• Timeline Preference: ${projectData.timeline || 'Flexible'}

═══════════════════════════════════════════════════════════════════════════════
CALCULATION RULES (YOU MUST FOLLOW THESE EXACTLY)
═══════════════════════════════════════════════════════════════════════════════
1. COST BREAKDOWN MUST ADD UP:
   net.average = materials.cost + labor.cost + permits + contingency + overhead
   (tolerance: ±1 ${currency})

2. LABOR COST CALCULATION:
   labor.cost = labor.hours × labor.hourlyRate
   (hourly rate must be within ${countryConfig.laborRateRange})

3. MATERIALS COST:
   materials.cost = SUM of all materials.items[].total
   Each item: total = quantity_numeric × unitCost

4. TAX CALCULATION:
   taxRate = ${vatDecimal}
   taxAmount = ROUND(net.average × taxRate)
   gross.average = net.average + taxAmount
   gross.min = net.min + ROUND(net.min × taxRate)
   gross.max = net.max + ROUND(net.max × taxRate)

5. RANGE CONSISTENCY:
   min ≤ average ≤ max (for both net and gross)

6. CONTINGENCY: Typically 10% of subtotal (materials + labor)
   contingencyRate = 0.10
   contingency = ROUND((materials.cost + labor.cost) × contingencyRate)

7. OVERHEAD: Typically 10-15% of subtotal
   overheadRate = 0.10 to 0.15
   overhead = ROUND((materials.cost + labor.cost) × overheadRate)

═══════════════════════════════════════════════════════════════════════════════
PROFESSIONAL REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
• List 8-12 specific material items with realistic quantities and ${countryConfig.name} prices
• Include at least 2-3 labor trades if applicable (e.g., carpenter, electrician, plumber)
• Specify 2-4 assumptions (what you assumed to make the estimate)
• Specify 2-4 exclusions (what is NOT included, e.g., furniture, decorations, architect fees)
• Include 2-3 realistic project risks with mitigations
• Provide 3-5 professional recommendations
• Timeline should include 3-5 phases

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (RETURN ONLY VALID JSON - NO MARKDOWN, NO PROSE)
═══════════════════════════════════════════════════════════════════════════════
{
  "totalEstimate": {
    "net": { "min": <number>, "max": <number>, "average": <number> },
    "gross": { "min": <number>, "max": <number>, "average": <number> },
    "taxRate": ${vatDecimal},
    "taxAmount": <number>,
    "currency": "${currency}"
  },
  "breakdown": {
    "materials": {
      "cost": <number>,
      "items": [
        { "item": "<material name>", "quantity": "<X ${areaUnit}>", "unitCost": <number>, "total": <number> }
      ]
    },
    "labor": {
      "cost": <number>,
      "hours": <number>,
      "hourlyRate": <number>,
      "trades": [
        { "trade": "<trade name>", "hours": <number>, "rate": <number>, "cost": <number> }
      ]
    },
    "permits": <number>,
    "contingency": <number>,
    "contingencyRate": <decimal>,
    "overhead": <number>,
    "overheadRate": <decimal>
  },
  "timeline": {
    "estimatedDays": <number>,
    "phases": [
      { "phase": "<phase name>", "duration": "<X days>" }
    ]
  },
  "risks": [
    { "risk": "<description>", "mitigation": "<strategy>", "impact": "low|medium|high" }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "assumptions": ["<assumption 1>", "<assumption 2>", ...],
  "exclusions": ["<exclusion 1>", "<exclusion 2>", ...],
  "notes": "<${countryConfig.name}-specific considerations and additional information>"
}

CRITICAL: Return ONLY the JSON object above. No markdown code blocks. No explanatory text.
Verify all calculations match the rules before responding.`;
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

    // Build professional estimation prompt
    const countryConfig = getCountryConfig(region_settings.country);
    const prompt = buildEstimatePrompt(project_data, countryConfig, region_settings.currency);

    // Call Gemini API with structured JSON output
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: ESTIMATE_RESPONSE_SCHEMA as any,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let estimate = parseJsonResponse(text);
      estimate = normalizeEstimate(estimate);

      const latencyMs = Date.now() - startTime;

      // Finalize the usage (deduct credit permanently)
      await supabase.rpc('finalize_credit_usage', {
        p_request_id: request_id,
        p_latency_ms: latencyMs,
        p_response_tokens: text.length,
        p_estimated_cost_usd: 0.10,
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
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
