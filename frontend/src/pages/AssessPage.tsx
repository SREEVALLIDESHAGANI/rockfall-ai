import { useState } from "react";
import { usePrediction } from "../hooks/usePrediction";
import { PredictionForm } from "../components/PredictionForm";
import { PredictionResult } from "../components/PredictionResult";
import { SiteMap } from "../components/SiteMap";
import type { PredictInput, PredictResponse } from "../types/prediction";

export function AssessPage() {
  const { loading, error, result, run, setResult } = usePrediction();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({ lat: 32.24, lng: 77.19 });
  const [history, setHistory] = useState<Array<{ id: number; timestamp: string; res: PredictResponse }>>([]);

  async function handleFormSubmit(payload: PredictInput) {
    const res = await run(payload);
    if (res) {
      if (payload.latitude != null && payload.longitude != null) {
        setCoords({ lat: payload.latitude, lng: payload.longitude });
      }
      setHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          res,
        },
        ...prev.slice(0, 9), // keep latest 10 runs
      ]);
    }
  }

  function handleMapClick(lat: number, lng: number) {
    setCoords({ lat, lng });
  }

  function handleFormCoordsChange(lat: number, lng: number) {
    setCoords({ lat, lng });
  }

  const activeLat = (result?.inputs.latitude as number | undefined) ?? coords?.lat;
  const activeLng = (result?.inputs.longitude as number | undefined) ?? coords?.lng;
  const activeLabel = (result?.inputs.location_label as string | undefined) ?? "Pinpoint location";

  return (
    <div className="page split">
      <div className="form-column">
        <PredictionForm
          onSubmit={handleFormSubmit}
          loading={loading}
          selectedLocation={coords}
          onLocationChange={handleFormCoordsChange}
        />
      </div>

      <div className="stack results-column">
        {error ? <p className="errors" role="alert">{error}</p> : null}

        {result ? <PredictionResult result={result} /> : <EmptyState />}

        <SiteMap
          latitude={activeLat}
          longitude={activeLng}
          label={activeLabel}
          risk={result?.risk_level}
          onLocationSelect={handleMapClick}
        />

        {history.length > 0 ? (
          <section className="panel history-panel">
            <h3>Recent Assessments ({history.length})</h3>
            <p className="muted small-note">Click any past assessment in this session to re-inspect results.</p>
            <ul className="history-list">
              {history.map((item) => (
                <li
                  key={item.id}
                  className={`history-item ${item.res === result ? "selected" : ""}`}
                  onClick={() => setResult(item.res)}
                >
                  <div className="history-meta">
                    <span className={`status-pill ${item.res.risk_level.toLowerCase()}`}>
                      {item.res.risk_level}
                    </span>
                    <strong className="history-name">
                      {String(item.res.inputs.location_label || "Unnamed Slope")}
                    </strong>
                  </div>
                  <span className="history-time">{item.timestamp}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="panel empty-state-panel">
      <div className="empty-state-icon">⛰️</div>
      <h2>Ready for Screening Assessment</h2>
      <p>
        Fill in the slope geometry, geomechanical parameters, and environmental triggers, or pick one of
        the presets above to run a live ML evaluation against the trained pipeline.
      </p>
      <div className="hint-card">
        <strong>💡 Quick Tip:</strong> Click directly on the map below or pick a geological case like
        <em> "Steep Weathered Cliff"</em> to see immediate predictions.
      </div>
    </section>
  );
}
