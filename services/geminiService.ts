import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ProjectData,
  Estimate,
  MaterialRecommendations,
  ImageAnalysis
} from '../types';
import { CountryCode, CurrencyCode, getCountryConfig } from '../constants/countries';
import { ESTIMATE_RESPONSE_SCHEMA, validateEstimateTotals, normalizeEstimate } from './estimateSchema';
import { buildEstimatePrompt, buildEstimatePromptLegacy } from './estimatePrompt';

// Initialize Gemini AI with API key from environment variables
// Note: In Expo, use EXPO_PUBLIC_ prefix for client-side env vars
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Model configuration - Gemini 2.0 Flash (supports JSON mode + schema)
// https://ai.google.dev/gemini-api/docs/json-mode
const MODEL_NAME = 'gemini-2.0-flash';

// Feature flag for structured JSON output (schema-locked)
const USE_STRUCTURED_OUTPUT = true;

/**
 * Parse JSON from AI response (handles markdown code blocks)
 * Used as fallback when structured output is not available
 */
function parseJsonResponse<T>(text: string): T {
  // First try direct JSON parse (for structured output mode)
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fall back to regex extraction for markdown-wrapped JSON
  }

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const jsonText = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonText) as T;
  }

  throw new Error('Unable to parse AI response');
}

/**
 * Regional settings for cost estimation
 */
export interface RegionSettings {
  country: CountryCode;
  currency: CurrencyCode;
}

/**
 * Generate AI-powered cost estimation for contractor projects
 * Uses structured JSON output with schema validation for reliable parsing.
 * Falls back to regex parsing if structured output fails.
 */
export async function generateEstimate(
  projectData: ProjectData,
  regionSettings: RegionSettings
): Promise<Estimate> {
  try {
    const countryConfig = getCountryConfig(regionSettings.country);

    // Build the professional estimation prompt
    const promptCtx = {
      projectData,
      countryConfig,
      currency: regionSettings.currency,
    };

    let estimate: Estimate;

    if (USE_STRUCTURED_OUTPUT) {
      // Use structured JSON output with schema (preferred)
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: ESTIMATE_RESPONSE_SCHEMA as any,
        },
      });

      const prompt = buildEstimatePrompt(promptCtx);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      estimate = parseJsonResponse<Estimate>(text);
    } else {
      // Legacy mode: no schema, regex parsing
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = buildEstimatePromptLegacy(promptCtx);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      estimate = parseJsonResponse<Estimate>(text);
    }

    // Validate and normalize the estimate
    const validation = validateEstimateTotals(estimate);
    if (!validation.valid) {
      console.warn('Estimate validation warnings:', validation.errors);
      // Continue anyway - validation is advisory for MVP
    }

    // Normalize for backward compatibility (adds legacy fields)
    return normalizeEstimate(estimate);

  } catch (error) {
    console.error('Error generating estimate with Gemini:', error);
    throw new Error(`AI estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get material recommendations for a project type
 */
export async function getMaterialRecommendations(projectType: string): Promise<MaterialRecommendations> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
As a construction materials expert, recommend the best materials for a ${projectType} project.

Provide recommendations in the following JSON format:

{
  "recommended": [
    {
      "category": "...",
      "material": "...",
      "brand": "...",
      "priceRange": "...",
      "pros": ["..."],
      "cons": ["..."]
    }
  ],
  "budgetOptions": [...],
  "premiumOptions": [...]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return parseJsonResponse<MaterialRecommendations>(text);

  } catch (error) {
    console.error('Error getting material recommendations:', error);
    throw new Error(`Material recommendations failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze project photos for progress tracking or assessment
 */
export async function analyzeProjectImage(imageBase64: string, context: string = ''): Promise<ImageAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
Analyze this construction/renovation project image and provide insights.

Context: ${context}

Provide analysis in JSON format:
{
  "description": "What you see in the image",
  "projectPhase": "...",
  "qualityAssessment": "...",
  "concerns": ["..."],
  "recommendations": ["..."],
  "estimatedProgress": <percentage>
}
`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg' as const,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return parseJsonResponse<ImageAnalysis>(text);

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Simple test function to verify API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent("Say 'BuildSight AI is ready!' if you can read this.");
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API Test:', text);
    return true;
  } catch (error) {
    console.error('Gemini API connection test failed:', error);
    return false;
  }
}

/**
 * Check if API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return API_KEY.length > 0;
}
