export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PredictInput {
  slope_angle_deg: number;
  slope_height_m: number;
  ucs_mpa: number;
  discontinuity_spacing_m: number;
  discontinuity_orientation_index: number;
  weathering_grade: number;
  rainfall_mm: number;
  groundwater_index: number;
  vegetation_cover: number;
  seismic_pga_g: number;
  latitude?: number | null;
  longitude?: number | null;
  location_label?: string | null;
}

export interface PredictResponse {
  prediction: number;
  risk_level: RiskLevel;
  probability: number;
  class_probabilities: Record<string, number>;
  message: string;
  explanation: string;
  contributing_factors: { feature: string; importance: number; value: number }[];
  recommendations: string[];
  disclaimer: string;
  inputs: Record<string, unknown>;
  model_name: string;
  dataset_kind: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_name?: string | null;
  dataset_kind?: string | null;
}

export interface CandidateMetric {
  model: string;
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  roc_auc_ovr_macro?: number | null;
}

export interface ModelInfo {
  model_name: string;
  dataset_kind: string;
  dataset_disclaimer: string;
  class_labels: string[];
  feature_names: string[];
  feature_importance: Record<string, number> | null;
  test_metrics: Record<string, unknown> | null;
  candidate_metrics?: CandidateMetric[] | null;
  selection_reason: string | null;
}

export interface FieldSpec {
  name: keyof PredictInput;
  label: string;
  category?: "geometry" | "rockmass" | "environment";
  unit?: string;
  help: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}
