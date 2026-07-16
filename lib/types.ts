export type Side = 'left' | 'right' | 'both';
export type Severity = 'low' | 'medium' | 'high';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Purpose = 'strength' | 'mobility' | 'activation' | 'stretch';

export interface ChecklistItem {
  id: string;
  question: string;
  options: string[];
  category: 'pelvis' | 'knee' | 'ankle' | 'core' | 'upper' | 'back';
}

export interface BodyPattern {
  id: string;
  name: string;
  description: string;
  cascade?: string;
  severity: Severity;
  priority: number;
  side?: Side;
  exerciseIds: string[];
}

export interface Exercise {
  id: string;
  nameKr: string;
  nameEn: string;
  targetMuscles: string[];
  difficulty: Difficulty;
  equipment: string[];
  purpose: Purpose;
  phase: 1 | 2 | 3;
  patternIds: string[];
  howTo: string;
}

export interface VideoExercise {
  name: string;
  exerciseId?: string;
  targetMuscles: string[];
  difficulty: string;
  equipment: string[];
  purpose: string;
  patternIds: string[];
}

export interface VideoAnalysis {
  videoId: string;
  url: string;
  title?: string;
  exercises: VideoExercise[];
  analyzedAt: string;
}

export interface PoseIssue {
  patternId: string;
  severity: Severity;
  description: string;
  side?: Side;
  measurement?: number;
}

export interface PhotoAnalysisResult {
  shoulderTiltDeg: number;
  hipTiltDeg: number;
  leftKneeDeviation: number;
  rightKneeDeviation: number;
  leftFootAngleDeg: number;
  rightFootAngleDeg: number;
  issues: PoseIssue[];
}

export interface AppState {
  checklistAnswers: Record<string, string>;
  painLocations: string[];
  detectedPatterns: BodyPattern[];
  photoAnalysis: PhotoAnalysisResult | null;
  videoAnalyses: VideoAnalysis[];
}
