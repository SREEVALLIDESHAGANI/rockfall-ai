import type { PredictInput } from "../types/prediction";

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  riskExpected: "HIGH" | "MEDIUM" | "LOW";
  data: PredictInput;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "open-pit-blast",
    name: "Open-Pit Highwall (Blast Sector)",
    description: "72° steep highwall, induced blasting vibration 0.35g, heavy weathering, high crack opening",
    riskExpected: "HIGH",
    data: {
      slope_angle_deg: 72,
      slope_height_m: 95,
      ucs_mpa: 28,
      discontinuity_spacing_m: 0.15,
      discontinuity_orientation_index: 0.88,
      weathering_grade: 4,
      rainfall_mm: 1800,
      groundwater_index: 0.75,
      vegetation_cover: 0.05,
      seismic_pga_g: 0.35,
      latitude: 21.7584,
      longitude: 85.3421,
      location_label: "Open-Pit Iron Ore Mine - Bench 4",
    },
  },
  {
    id: "high-monsoon",
    name: "Steep Weathered Cliff (Monsoon)",
    description: "68° face, weathered rock, adverse jointing, high rainfall & groundwater",
    riskExpected: "HIGH",
    data: {
      slope_angle_deg: 68,
      slope_height_m: 85,
      ucs_mpa: 22,
      discontinuity_spacing_m: 0.12,
      discontinuity_orientation_index: 0.85,
      weathering_grade: 4,
      rainfall_mm: 2400,
      groundwater_index: 0.85,
      vegetation_cover: 0.15,
      seismic_pga_g: 0.28,
      latitude: 31.4827,
      longitude: 78.2619,
      location_label: "Batseri Village Escarpment (Kinnaur, HP)",
    },
  },
  {
    id: "medium-haulroad",
    name: "Open-Pit Haul Road Cut",
    description: "52° road cut with moderate jointing, intermediate weathering and operational vibration",
    riskExpected: "MEDIUM",
    data: {
      slope_angle_deg: 52,
      slope_height_m: 35,
      ucs_mpa: 45,
      discontinuity_spacing_m: 0.35,
      discontinuity_orientation_index: 0.55,
      weathering_grade: 3,
      rainfall_mm: 1100,
      groundwater_index: 0.4,
      vegetation_cover: 0.15,
      seismic_pga_g: 0.14,
      latitude: 23.8214,
      longitude: 86.4258,
      location_label: "Open-Pit Coal Mine - Haulage Ramp Sector 2",
    },
  },
  {
    id: "low-bench",
    name: "Lower Pit Stable Berm",
    description: "32° gentle bench, fresh intact rock, wide joint spacing, dry conditions",
    riskExpected: "LOW",
    data: {
      slope_angle_deg: 32,
      slope_height_m: 15,
      ucs_mpa: 120,
      discontinuity_spacing_m: 1.5,
      discontinuity_orientation_index: 0.15,
      weathering_grade: 1,
      rainfall_mm: 350,
      groundwater_index: 0.1,
      vegetation_cover: 0.3,
      seismic_pga_g: 0.05,
      latitude: 21.7584,
      longitude: 85.3421,
      location_label: "Lower Pit Drainage Berm Sector 1",
    },
  },
];
