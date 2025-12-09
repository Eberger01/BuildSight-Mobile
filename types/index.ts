/**
 * BuildSight TypeScript Type Definitions
 */

// ============================================
// Project & Estimate Types
// ============================================

export interface ProjectData {
  clientName: string;
  email: string;
  phone: string;
  projectType: string;
  description: string;
  squareFootage?: string;
  timeline?: string;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  uri: string;
  base64?: string;
}

export interface MaterialItem {
  item: string;
  quantity: string;
  unitCost: number;
  total: number;
}

export interface Phase {
  phase: string;
  duration: string;
}

export interface Risk {
  risk: string;
  mitigation: string;
  impact: 'low' | 'medium' | 'high';
}

export interface Estimate {
  totalEstimate: {
    min: number;
    max: number;
    average: number;
    currency: string;
  };
  breakdown: {
    materials: {
      cost: number;
      items: MaterialItem[];
    };
    labor: {
      cost: number;
      hours: number;
      hourlyRate: number;
    };
    permits: number;
    contingency: number;
    overhead: number;
  };
  timeline: {
    estimatedDays: number;
    phases: Phase[];
  };
  risks: Risk[];
  recommendations: string[];
  notes: string;
}

// ============================================
// Job Types
// ============================================

export type JobStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed';

export interface Job {
  id: number;
  client: string;
  type: string;
  status: JobStatus;
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  estimatedCompletion: string;
  tasks: number;
  completedTasks: number;
  lastUpdate: string;
}

// ============================================
// Material Recommendations Types
// ============================================

export interface MaterialRecommendation {
  category: string;
  material: string;
  brand: string;
  priceRange: string;
  pros: string[];
  cons: string[];
}

export interface MaterialRecommendations {
  recommended: MaterialRecommendation[];
  budgetOptions: MaterialRecommendation[];
  premiumOptions: MaterialRecommendation[];
}

// ============================================
// Image Analysis Types
// ============================================

export interface ImageAnalysis {
  description: string;
  projectPhase: string;
  qualityAssessment: string;
  concerns: string[];
  recommendations: string[];
  estimatedProgress: number;
}

// ============================================
// Gallery Types
// ============================================

export type GalleryCategory = 'All Projects' | 'Kitchen' | 'Bathroom' | 'Fences' | 'Decks' | 'Roofing';

export interface GalleryProject {
  id: number;
  title: string;
  category: string;
  photoCount: number;
  thumbnail?: string;
}

// ============================================
// Settings Types
// ============================================

export interface Settings {
  aiAutoEstimation: boolean;
  cameraAutoUpload: boolean;
  photoQuality: 'high' | 'medium' | 'low';
  emailNotifications: boolean;
  pushNotifications: boolean;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
}

// ============================================
// Form Constants
// ============================================

export const PROJECT_TYPES = [
  'Kitchen Remodel',
  'Bathroom Upgrade',
  'Fence Installation',
  'Deck Construction',
  'Home Improvement',
  'Basement Finishing',
  'Roof Replacement',
  'Flooring',
  'Painting',
  'Other',
] as const;

export type ProjectType = typeof PROJECT_TYPES[number];

export const TIMELINE_OPTIONS = [
  { label: 'ASAP', value: 'asap' },
  { label: '1-2 weeks', value: '1-2weeks' },
  { label: '1 month', value: '1month' },
  { label: '2-3 months', value: '2-3months' },
  { label: 'Flexible', value: 'flexible' },
] as const;

export type TimelineOption = typeof TIMELINE_OPTIONS[number]['value'];