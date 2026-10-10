import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { CATEGORY_LABELS, FIELD_SPECS } from "../utils/fields";
import { PRESET_SCENARIOS, type PresetScenario } from "../utils/presets";
import { SlopeVisualizer } from "./SlopeVisualizer";
import type { PredictInput } from "../types/prediction";

interface Props {
  onSubmit: (payload: PredictInput) => void;
  loading: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

export function PredictionForm({ onSubmit, loading, selectedLocation, onLocationChange }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELD_SPECS.map((field) => [field.name, String(field.defaultValue)])),
  );
  const [latitude, setLatitude] = useState("32.24");
  const [longitude, setLongitude] = useState("77.19");
  const [locationLabel, setLocationLabel] = useState("Himalayan road corridor sample");
  const [errors, setErrors] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Sync with map click if location was selected on map
  useEffect(() => {
    if (selectedLocation) {
      setLatitude(String(selectedLocation.lat));
      setLongitude(String(selectedLocation.lng));
    }
  }, [selectedLocation]);

  function update(name: string, value: string) {
    setActivePreset(null);
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleLatChange(val: string) {
    setLatitude(val);
    const num = Number(val);
    const lonNum = Number(longitude);
    if (Number.isFinite(num) && Number.isFinite(lonNum) && onLocationChange) {
      onLocationChange(num, lonNum);
    }
  }

  function handleLngChange(val: string) {
    setLongitude(val);
    const num = Number(val);
    const latNum = Number(latitude);
    if (Number.isFinite(num) && Number.isFinite(latNum) && onLocationChange) {
      onLocationChange(latNum, num);
    }
  }

  function applyPreset(preset: PresetScenario) {
    setActivePreset(preset.id);
    const nextVals: Record<string, string> = {};
    for (const field of FIELD_SPECS) {
      nextVals[field.name] = String(preset.data[field.name]);
    }
    setValues(nextVals);
    if (preset.data.latitude != null) {
      setLatitude(String(preset.data.latitude));
    }
    if (preset.data.longitude != null) {
      setLongitude(String(preset.data.longitude));
    }
    if (preset.data.location_label) {
      setLocationLabel(preset.data.location_label);
    }
    if (preset.data.latitude != null && preset.data.longitude != null && onLocationChange) {
      onLocationChange(preset.data.latitude, preset.data.longitude);
    }
  }

  function resetDefaults() {
    setActivePreset(null);
    setValues(Object.fromEntries(FIELD_SPECS.map((field) => [field.name, String(field.defaultValue)])));
    setLatitude("32.24");
    setLongitude("77.19");
    setLocationLabel("Himalayan road corridor sample");
    setErrors([]);
    if (onLocationChange) onLocationChange(32.24, 77.19);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: string[] = [];
    const payload = {} as PredictInput;

    for (const field of FIELD_SPECS) {
      const numeric = Number(values[field.name]);
      if (!Number.isFinite(numeric)) {
        nextErrors.push(`${field.label} must be a number.`);
        continue;
      }
      if (numeric < field.min || numeric > field.max) {
        nextErrors.push(`${field.label} must be between ${field.min} and ${field.max}.`);
        continue;
      }
      (payload as unknown as Record<string, number>)[field.name] = numeric;
    }

    if (latitude.trim()) {
      const lat = Number(latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        nextErrors.push("Latitude must be between -90 and 90.");
      } else {
        payload.latitude = lat;
      }
    }

    if (longitude.trim()) {
      const lon = Number(longitude);
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        nextErrors.push("Longitude must be between -180 and 180.");
      } else {
        payload.longitude = lon;
      }
    }

    payload.location_label = locationLabel.trim() || null;
    setErrors(nextErrors);
    if (nextErrors.length === 0) {
      onSubmit(payload);
    }
  }

  const currentSlopeAngle = Number(values["slope_angle_deg"]) || 52;
  const currentSlopeHeight = Number(values["slope_height_m"]) || 35;
  const currentSpacing = Number(values["discontinuity_spacing_m"]) || 0.35;
  const currentOrientation = Number(values["discontinuity_orientation_index"]) || 0.55;
  const currentWeathering = Number(values["weathering_grade"]) || 3;
  const currentRainfall = Number(values["rainfall_mm"]) || 1100;
  const currentGroundwater = Number(values["groundwater_index"]) || 0.4;
  const currentVegetation = Number(values["vegetation_cover"]) || 0.45;
  const currentSeismic = Number(values["seismic_pga_g"]) || 0.12;

  const categories = ["geometry", "rockmass", "environment"] as const;

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <div className="panel-head">
        <h2>Slope Screening Parameters</h2>
        <p>Configure geotechnical parameters or load a standard engineering case.</p>
      </div>

      <div className="preset-container">
        <span className="preset-label">Load geological case:</span>
        <div className="preset-buttons">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-btn ${activePreset === preset.id ? "active" : ""} ${preset.riskExpected.toLowerCase()}`}
              onClick={() => applyPreset(preset)}
              title={preset.description}
            >
              <span className={`dot ${preset.riskExpected.toLowerCase()}`} />
              {preset.name}
            </button>
          ))}
          <button type="button" className="preset-btn secondary" onClick={resetDefaults}>
            Reset defaults
          </button>
        </div>
      </div>

      {/* Interactive 2D Cross Section Visualizer */}
      <SlopeVisualizer
        slopeAngle={currentSlopeAngle}
        slopeHeight={currentSlopeHeight}
        discontinuitySpacing={currentSpacing}
        discontinuityOrientation={currentOrientation}
        weatheringGrade={currentWeathering}
        rainfall={currentRainfall}
        groundwaterIndex={currentGroundwater}
        vegetationCover={currentVegetation}
        seismicPGA={currentSeismic}
      />

      {categories.map((catKey) => {
        const catInfo = CATEGORY_LABELS[catKey];
        const fields = FIELD_SPECS.filter((f) => f.category === catKey);
        return (
          <fieldset key={catKey} className="category-section">
            <legend className="category-title">{catInfo?.title || catKey}</legend>
            <p className="category-subtitle">{catInfo?.subtitle}</p>
            <div className="grid">
              {fields.map((field) => {
                const val = values[field.name];
                return (
                  <label key={field.name} className="field">
                    <span className="field-label-row">
                      <strong>{field.label}</strong>
                      {field.unit ? <em className="unit"> ({field.unit})</em> : null}
                    </span>
                    <div className="slider-input-combo">
                      <input
                        className="slider"
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={val || field.defaultValue}
                        onChange={(e) => update(field.name, e.target.value)}
                      />
                      <input
                        className="number-input"
                        name={field.name}
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={val}
                        onChange={(event) => update(field.name, event.target.value)}
                        required
                      />
                    </div>
                    <small>{field.help}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <fieldset className="category-section">
        <legend className="category-title">4. Geographic & Site Metadata</legend>
        <p className="category-subtitle">Contextual location displayed on the screening map.</p>
        <div className="grid location-grid">
          <label className="field">
            <span>Site name / label</span>
            <input
              type="text"
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
              placeholder="e.g. NH-3 km 142 Rock Cut"
            />
            <small>Included in exported screening reports.</small>
          </label>
          <label className="field">
            <span>Latitude (°N)</span>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(event) => handleLatChange(event.target.value)}
            />
            <small>Between -90 and 90 (or click map to pin).</small>
          </label>
          <label className="field">
            <span>Longitude (°E)</span>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(event) => handleLngChange(event.target.value)}
            />
            <small>Between -180 and 180 (or click map to pin).</small>
          </label>
        </div>
      </fieldset>

      {errors.length > 0 ? (
        <ul className="errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <div className="form-actions">
        <button type="submit" className="primary-submit" disabled={loading}>
          {loading ? "Running ML inference…" : "Run Rockfall Screening"}
        </button>
      </div>
    </form>
  );
}
