import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ProjectData,
  Estimate,
  MaterialRecommendations,
  ImageAnalysis
} from '../types';

// Initialize Gemini AI with API key from environment variables
// Note: In Expo, use EXPO_PUBLIC_ prefix for client-side env vars
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Model configuration - Gemini 3 Pro Preview
// https://ai.google.dev/gemini-api/docs/gemini-3
const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
function parseJsonResponse<T>(text: string): T {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const jsonText = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonText) as T;
  }

  throw new Error('Unable to parse AI response');
}

/**
 * Generate AI-powered cost estimation for contractor projects
 */
export async function generateEstimate(projectData: ProjectData): Promise<Estimate> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
You are an expert contractor cost estimator with 20+ years of experience in residential construction and remodeling.

Based on the following project details, provide a detailed and accurate cost estimate:

**Project Information:**
- Client: ${projectData.clientName}
- Project Type: ${projectData.projectType}
- Description: ${projectData.description}
- Square Footage: ${projectData.squareFootage || 'Not specified'} sq ft
- Preferred Timeline: ${projectData.timeline || 'Flexible'}

**Please provide a comprehensive estimate in the following JSON format:**

{
  "totalEstimate": {
    "min": <number>,
    "max": <number>,
    "average": <number>,
    "currency": "EUR"
  },
  "breakdown": {
    "materials": {
      "cost": <number>,
      "items": [
        {"item": "...", "quantity": "...", "unitCost": <number>, "total": <number>}
      ]
    },
    "labor": {
      "cost": <number>,
      "hours": <number>,
      "hourlyRate": <number>
    },
    "permits": <number>,
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
  "notes": "Additional information or considerations"
}

Ensure all costs are realistic for the current market (2025) and consider regional variations. Be thorough and detailed.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return parseJsonResponse<Estimate>(text);

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