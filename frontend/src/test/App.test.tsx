import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { PredictionForm } from "../components/PredictionForm";
import { PredictionResult } from "../components/PredictionResult";
import { HomePage } from "../pages/HomePage";
import type { PredictResponse } from "../types/prediction";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({ setView: vi.fn(), getZoom: () => 10 }),
  useMapEvents: () => null,
}));

// Mock HTML5 canvas context in test environment
window.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  clip: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  setLineDash: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

const sample: PredictResponse = {
  prediction: 2,
  risk_level: "HIGH",
  probability: 0.64,
  class_probabilities: { LOW: 0.1, MEDIUM: 0.26, HIGH: 0.64 },
  message: "Elevated modelled rockfall hazard based on the supplied parameters.",
  explanation: "Test explanation",
  contributing_factors: [{ feature: "slope_angle_deg", importance: 0.2, value: 70 }],
  recommendations: ["Restrict access until a qualified professional has assessed the slope."],
  disclaimer: "Prototype disclaimer",
  inputs: { slope_angle_deg: 70, location_label: "Unit test slope" },
  model_name: "random_forest",
  dataset_kind: "synthetic_sample",
};

describe("frontend screens", () => {
  it("renders the home explanation and interactive sandbox", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/Transparent, Evidence-Based Rockfall Hazard Screening/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Launch Full Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Slope Sim/i)).toBeInTheDocument();
  });

  it("renders the prediction form fields, presets, and 2D visualizer", () => {
    render(<PredictionForm onSubmit={vi.fn()} loading={false} />);
    expect(screen.getAllByText(/Slope angle/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Run Rockfall Screening/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Steep Weathered Cliff/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Simulate Rockfall Bounce/i })).toBeInTheDocument();
  });

  it("shows prediction results with animated risk gauge and breakdown", () => {
    render(<PredictionResult result={sample} />);
    expect(screen.getByRole("heading", { name: /HIGH HAZARD/i })).toBeInTheDocument();
    expect(screen.getByText(/Calculated Hazard Intensity/i)).toBeInTheDocument();
    expect(screen.getByText(/Prototype disclaimer/)).toBeInTheDocument();
    expect(screen.getByText(/Unit test slope/)).toBeInTheDocument();
  });
});
