export interface MetaculusConfig {
  apiToken?: string;
  baseUrl?: string;
  enabled?: boolean;
}

export interface MetaculusQuestion {
  id: number;
  title: string;
  resolution: string;
  description: string;
  question_type: 'binary' | 'multiple_choice' | 'numeric' | 'date';
  category: string;
  tags: string[];
  created_at: string;
  close_time?: string;
  resolve_time?: string;
  status: 'open' | 'closed' | 'resolved';
  possibilities: {
    type: string;
    scale_min?: number;
    scale_max?: number;
  };
}

export interface MetaculusPrediction {
  question_id: number;
  user_id?: number;
  prediction: number; // 0-1 for binary
  timestamp: string;
  is_superforecaster: boolean;
}

export interface MetaculusCommunityPrediction {
  question_id: number;
  community_prediction: number;
  num_predictions: number;
  distribution?: {
    mean: number;
    median: number;
    std: number;
    percentiles: Record<string, number>;
  };
  superforecaster_prediction?: number;
}

export interface MetaculusForecast {
  question: MetaculusQuestion;
  community: MetaculusCommunityPrediction;
  myPrediction?: number;
  resolved: boolean;
  resolution?: 'yes' | 'no' | number;
  score?: number;
}
