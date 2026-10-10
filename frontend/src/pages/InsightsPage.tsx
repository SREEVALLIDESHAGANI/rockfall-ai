import { useEffect, useState } from "react";
import { fetchModelInfo } from "../services/api";
import type { ModelInfo } from "../types/prediction";

export function InsightsPage() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "features" | "plots">("overview");
  const [selectedCell, setSelectedCell] = useState<{ trueLbl: string; predLbl: string; count: number } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("logistic_regression");

  useEffect(() => {
    fetchModelInfo()
      .then((data) => {
        setInfo(data);
        if (data.model_name) setSelectedCandidate(data.model_name);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const metrics = info?.test_metrics as
    | {
        accuracy?: number;
        precision_macro?: number;
        recall_macro?: number;
        f1_macro?: number;
        roc_auc_ovr_macro?: number;
        confusion_matrix?: number[][];
        confusion_matrix_labels?: string[];
        classification_report?: Record<string, { precision: number; recall: number; "f1-score": number; support: number }>;
      }
    | null
    | undefined;

  const candidateMetrics = info?.candidate_metrics || [];
  const featureEntries = info?.feature_importance
    ? Object.entries(info.feature_importance).sort((a, b) => b[1] - a[1])
    : [];
  const maxImportance = featureEntries.length > 0 ? featureEntries[0][1] : 1;

  function getFeatureColor(name: string) {
    if (name.includes("angle") || name.includes("height") || name.includes("energy")) return "#3b82f6"; // blue
    if (name.includes("ucs") || name.includes("discontinuity") || name.includes("weathering") || name.includes("weakness"))
      return "#f59e0b"; // amber
    return "#10b981"; // emerald/green
  }

  return (
    <div className="page insights-page">
      <section className="panel header-panel">
        <div className="eyebrow">Rigorous Machine Learning Validation</div>
        <h1>Model Evaluation & Evidence</h1>
        <p>
          Quantitative performance metrics, candidate model comparison, confusion matrix, and feature
          importances derived from the held-out stratified test dataset.
        </p>

        {error ? (
          <div className="errors" role="alert">
            <strong>Could not fetch live model info:</strong> {error}. Ensure backend is running.
          </div>
        ) : null}

        {info ? (
          <div className="model-summary-grid">
            <div className="summary-card">
              <span className="card-lbl">Selected Production Model</span>
              <strong className="card-val highlight">{info.model_name}</strong>
              <small className="card-sub">{info.selection_reason || "Best macro-F1 on held-out test split"}</small>
            </div>
            <div className="summary-card">
              <span className="card-lbl">Dataset Basis</span>
              <strong className="card-val">{info.dataset_kind.replace(/_/g, " ")}</strong>
              <small className="card-sub">Stratified 80/20 train/test split</small>
            </div>
            <div className="summary-card">
              <span className="card-lbl">Class Scheme</span>
              <strong className="card-val">{info.class_labels.join(" · ")}</strong>
              <small className="card-sub">3-tier geotechnical hazard index</small>
            </div>
          </div>
        ) : null}
      </section>

      {/* Interactive Tabs */}
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Performance Metrics
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "metrics" ? "active" : ""}`}
          onClick={() => setActiveTab("metrics")}
        >
          🔲 Confusion Matrix & Models
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "features" ? "active" : ""}`}
          onClick={() => setActiveTab("features")}
        >
          ⚖️ Feature Importance
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "plots" ? "active" : ""}`}
          onClick={() => setActiveTab("plots")}
        >
          🖼️ Training Plots
        </button>
      </div>

      {activeTab === "overview" && (
        <section className="panel tab-content">
          <h2>Held-out Test Performance</h2>
          <p>
            Evaluation results evaluated strictly on held-out test records not observed during model
            fitting.
          </p>

          {metrics ? (
            <div className="metric-cards-grid">
              <div className="metric-box">
                <span className="metric-name">Accuracy</span>
                <span className="metric-number">
                  {metrics.accuracy ? `${(metrics.accuracy * 100).toFixed(1)}%` : "N/A"}
                </span>
                <div className="metric-mini-bar">
                  <div className="bar-fill" style={{ width: `${(metrics.accuracy || 0) * 100}%` }} />
                </div>
                <span className="metric-desc">Overall correct hazard classifications</span>
              </div>

              <div className="metric-box highlight-box">
                <span className="metric-name">Macro F1-Score</span>
                <span className="metric-number text-accent">
                  {metrics.f1_macro ? metrics.f1_macro.toFixed(3) : "N/A"}
                </span>
                <div className="metric-mini-bar">
                  <div className="bar-fill accent" style={{ width: `${(metrics.f1_macro || 0) * 100}%` }} />
                </div>
                <span className="metric-desc">Primary selection metric across all classes</span>
              </div>

              <div className="metric-box">
                <span className="metric-name">Macro Precision</span>
                <span className="metric-number">
                  {metrics.precision_macro ? `${(metrics.precision_macro * 100).toFixed(1)}%` : "N/A"}
                </span>
                <div className="metric-mini-bar">
                  <div className="bar-fill" style={{ width: `${(metrics.precision_macro || 0) * 100}%` }} />
                </div>
                <span className="metric-desc">Average reliability of positive predictions</span>
              </div>

              <div className="metric-box">
                <span className="metric-name">Macro Recall</span>
                <span className="metric-number">
                  {metrics.recall_macro ? `${(metrics.recall_macro * 100).toFixed(1)}%` : "N/A"}
                </span>
                <div className="metric-mini-bar">
                  <div className="bar-fill" style={{ width: `${(metrics.recall_macro || 0) * 100}%` }} />
                </div>
                <span className="metric-desc">Sensitivity to detecting hazardous slopes</span>
              </div>
            </div>
          ) : (
            <p className="muted">Metrics data loading or unavailable from the active backend.</p>
          )}

          {metrics?.classification_report ? (
            <div className="class-report-wrap">
              <h3>Per-Class Performance Breakdown</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hazard Class</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1-Score</th>
                    <th>Support (Samples)</th>
                  </tr>
                </thead>
                <tbody>
                  {(["LOW", "MEDIUM", "HIGH"] as const).map((cls) => {
                    const row = metrics.classification_report?.[cls];
                    if (!row) return null;
                    return (
                      <tr key={cls}>
                        <td>
                          <span className={`status-pill ${cls.toLowerCase()}`}>{cls}</span>
                        </td>
                        <td>
                          <div className="table-pct-cell">
                            <span>{(row.precision * 100).toFixed(1)}%</span>
                            <div className="inline-bar"><i style={{ width: `${row.precision * 100}%` }} /></div>
                          </div>
                        </td>
                        <td>
                          <div className="table-pct-cell">
                            <span>{(row.recall * 100).toFixed(1)}%</span>
                            <div className="inline-bar"><i style={{ width: `${row.recall * 100}%` }} /></div>
                          </div>
                        </td>
                        <td><strong>{row["f1-score"].toFixed(3)}</strong></td>
                        <td>{row.support} slopes</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      )}

      {activeTab === "metrics" && (
        <section className="panel tab-content">
          <h2>Candidate Model Benchmark & Confusion Matrix</h2>

          {candidateMetrics.length > 0 ? (
            <div className="candidate-section">
              <h3>Interactive Model Selection Leaderboard</h3>
              <p className="muted small-note">Click any candidate model to review its metrics profile.</p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate Algorithm</th>
                    <th>Accuracy</th>
                    <th>Macro Precision</th>
                    <th>Macro Recall</th>
                    <th>Macro F1</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateMetrics.map((cand) => {
                    const isSelected = cand.model === info?.model_name;
                    const isActive = cand.model === selectedCandidate;
                    return (
                      <tr
                        key={cand.model}
                        className={`clickable-row ${isSelected ? "selected-row" : ""} ${isActive ? "active-row" : ""}`}
                        onClick={() => setSelectedCandidate(cand.model)}
                      >
                        <td>
                          <strong>{cand.model}</strong>
                          {isSelected ? <span className="winner-tag">🏆 Production</span> : null}
                        </td>
                        <td>{(cand.accuracy * 100).toFixed(1)}%</td>
                        <td>{(cand.precision_macro * 100).toFixed(1)}%</td>
                        <td>{(cand.recall_macro * 100).toFixed(1)}%</td>
                        <td>
                          <strong className="f1-highlight">{cand.f1_macro.toFixed(3)}</strong>
                        </td>
                        <td>{isSelected ? "✅ Active" : "Alternative"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {metrics?.confusion_matrix && metrics.confusion_matrix_labels ? (
            <div className="confusion-matrix-section">
              <h3>Interactive Confusion Matrix (Held-out Test Set)</h3>
              <p className="muted small-note">
                Click any cell in the matrix below to inspect the engineering significance of that classification outcome.
              </p>
              <div className="matrix-table-wrap">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th className="diagonal-head">Actual ↓ \ Predicted →</th>
                      {metrics.confusion_matrix_labels.map((lbl) => (
                        <th key={lbl}>{lbl}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.confusion_matrix.map((row, rowIdx) => {
                      const trueLabel = metrics.confusion_matrix_labels![rowIdx];
                      return (
                        <tr key={trueLabel}>
                          <th>{trueLabel}</th>
                          {row.map((val, colIdx) => {
                            const predLabel = metrics.confusion_matrix_labels![colIdx];
                            const isCorrect = rowIdx === colIdx;
                            const isClicked =
                              selectedCell?.trueLbl === trueLabel && selectedCell?.predLbl === predLabel;
                            return (
                              <td
                                key={colIdx}
                                className={`matrix-cell clickable-cell ${isCorrect ? "correct" : val > 0 ? "error" : "zero"} ${isClicked ? "cell-selected" : ""}`}
                                onClick={() =>
                                  setSelectedCell({ trueLbl: trueLabel, predLbl: predLabel, count: val })
                                }
                                title={`Actual ${trueLabel}, Predicted ${predLabel}: ${val} slopes`}
                              >
                                <strong>{val}</strong>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedCell ? (
                <div className="cell-insight-card">
                  <span className="insight-badge">Cell Inspector</span>
                  <h4>
                    Actual: <strong>{selectedCell.trueLbl}</strong> → Predicted: <strong>{selectedCell.predLbl}</strong> ({selectedCell.count} slopes)
                  </h4>
                  <p>
                    {selectedCell.trueLbl === selectedCell.predLbl ? (
                      `✅ Correct Classification: The model accurately detected the ${selectedCell.trueLbl} hazard level for these ${selectedCell.count} test slopes.`
                    ) : selectedCell.trueLbl === "MEDIUM" && selectedCell.predLbl === "HIGH" ? (
                      `⚠️ Conservative Screening Over-call: The model categorized ${selectedCell.count} medium slopes as high risk. In civil infrastructure protection, conservative over-screening is preferred to false negatives.`
                    ) : selectedCell.trueLbl === "HIGH" && selectedCell.predLbl === "MEDIUM" ? (
                      `🔍 Under-classification: Only ${selectedCell.count} high slopes were classified as medium. This represents the primary optimization priority for subsequent model iterations.`
                    ) : (
                      `ℹ️ ${selectedCell.count} slopes occurred in this outcome cell.`
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      )}

      {activeTab === "features" && (
        <section className="panel tab-content">
          <h2>Feature Importance Ranking</h2>
          <p>
            Relative influence coefficients and importance weights fitted by the model across geotechnical
            features.
          </p>

          <div className="feature-legend-row">
            <span><i className="color-dot" style={{ background: "#3b82f6" }} /> Geometry & Fall Energy</span>
            <span><i className="color-dot" style={{ background: "#f59e0b" }} /> Geomechanical Rock Mass</span>
            <span><i className="color-dot" style={{ background: "#10b981" }} /> Hydrology & Dynamics</span>
          </div>

          <div className="feature-bars-list">
            {featureEntries.map(([name, weight]) => {
              const pct = (weight / maxImportance) * 100;
              const barColor = getFeatureColor(name);
              return (
                <div key={name} className="feature-bar-row">
                  <div className="feature-bar-info">
                    <span className="feature-bar-title">{name.replace(/_/g, " ")}</span>
                    <span className="feature-bar-val">{weight.toFixed(3)}</span>
                  </div>
                  <div className="bar">
                    <i
                      className="bar-fill"
                      style={{ width: `${Math.max(4, pct)}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "plots" && (
        <section className="panel tab-content">
          <h2>Evaluation & Visual Diagnostics Gallery</h2>
          <p>Detailed charts generated during the automated ML pipeline training run.</p>
          <div className="gallery">
            <figure>
              <img src="/evaluation/confusion_matrix.png" alt="Confusion Matrix Plot" loading="lazy" />
              <figcaption>Confusion Matrix Heatmap</figcaption>
            </figure>
            <figure>
              <img src="/evaluation/feature_importance.png" alt="Feature Importance Plot" loading="lazy" />
              <figcaption>Feature Importance Ranking</figcaption>
            </figure>
            <figure>
              <img src="/evaluation/model_comparison.png" alt="Model Comparison Plot" loading="lazy" />
              <figcaption>Candidate Model Comparison</figcaption>
            </figure>
            <figure>
              <img src="/evaluation/risk_distribution.png" alt="Risk Distribution Plot" loading="lazy" />
              <figcaption>Hazard Class Distribution</figcaption>
            </figure>
            <figure>
              <img src="/evaluation/feature_distributions.png" alt="Feature Distributions Plot" loading="lazy" />
              <figcaption>Geotechnical Feature Distributions</figcaption>
            </figure>
          </div>
        </section>
      )}

      <div className="disclaimer-panel">
        <strong>⚠️ Scientific Prototype Disclaimer:</strong>
        <p>{info?.dataset_disclaimer || "Prototype development dataset only."}</p>
      </div>
    </div>
  );
}
