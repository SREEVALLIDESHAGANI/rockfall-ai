import { useState } from "react";
import type { PredictResponse } from "../types/prediction";
import { RiskGauge } from "./RiskGauge";

export function PredictionResult({ result }: { result: PredictResponse }) {
  const [copied, setCopied] = useState(false);
  const tone = result.risk_level.toLowerCase();

  function copySummary() {
    const report = [
      `=== ROCKFALL-AI HAZARD SCREENING REPORT ===`,
      `Site: ${result.inputs.location_label || "Unspecified"}`,
      `Coordinates: ${result.inputs.latitude ?? "N/A"}, ${result.inputs.longitude ?? "N/A"}`,
      `Model: ${result.model_name} (${result.dataset_kind})`,
      `Risk Category: ${result.risk_level}`,
      `Assigned Probability: ${(result.probability * 100).toFixed(1)}%`,
      ``,
      `Class Probabilities:`,
      ...Object.entries(result.class_probabilities).map(
        ([cat, prob]) => `  - ${cat}: ${(prob * 100).toFixed(1)}%`,
      ),
      ``,
      `Model Explanation:`,
      result.explanation,
      ``,
      `Top Drivers:`,
      ...result.contributing_factors.map(
        (f) => `  - ${f.feature}: importance ${f.importance} (input: ${f.value})`,
      ),
      ``,
      `Recommendations:`,
      ...result.recommendations.map((r) => `  * ${r}`),
      ``,
      `Disclaimer: ${result.disclaimer}`,
    ].join("\n");

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <section className="panel result printable-area">
      <div className={`risk-banner ${tone}`}>
        <div className="banner-top">
          <span className="banner-tag">Modelled Risk Category</span>
          <span className="banner-model">Model: {result.model_name}</span>
        </div>
        <h2 className="banner-level">{result.risk_level} HAZARD</h2>
        <p className="banner-prob">
          Classification Confidence: <strong>{(result.probability * 100).toFixed(1)}%</strong>
        </p>
      </div>

      <div className="result-actions">
        <button type="button" className="btn-secondary small" onClick={copySummary}>
          {copied ? "✓ Copied to clipboard!" : "📋 Copy report text"}
        </button>
        <button type="button" className="btn-secondary small" onClick={handlePrint}>
          🖨️ Print / Save PDF
        </button>
      </div>

      <p className="lead">{result.message}</p>
      <p className="explanation-text">{result.explanation}</p>

      <RiskGauge probability={result.probability} riskLevel={result.risk_level} />

      <div className="section-block">
        <h3>Class probability distribution</h3>
        <div className="probs">
          {Object.entries(result.class_probabilities).map(([label, value]) => {
            const isWinner = label === result.risk_level;
            return (
              <div key={label} className={`prob-row ${isWinner ? "winner" : ""}`}>
                <span className="prob-label">{label}</span>
                <div className="bar">
                  <i
                    className={`bar-fill ${label.toLowerCase()}`}
                    style={{ width: `${Math.max(5, value * 100)}%` }}
                  />
                </div>
                <em className="prob-val">{(value * 100).toFixed(1)}%</em>
              </div>
            );
          })}
        </div>
      </div>

      {result.contributing_factors.length > 0 ? (
        <div className="section-block">
          <h3>Global model feature importance</h3>
          <p className="muted small-note">
            Trained feature importances across the dataset (identifies parameters the model relied upon).
          </p>
          <ul className="factors">
            {result.contributing_factors.map((item) => (
              <li key={item.feature}>
                <span className="factor-name">{item.feature}</span>
                <div className="factor-meta">
                  <span className="factor-badge">weight {item.importance}</span>
                  <span className="factor-val">input: {item.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="section-block">
        <h3>Input parameters recorded</h3>
        <dl className="summary">
          {Object.entries(result.inputs)
            .filter(([, value]) => value !== null && value !== undefined && value !== "")
            .map(([key, value]) => (
              <div key={key} className="summary-item">
                <dt>{key.replace(/_/g, " ")}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <div className="section-block">
        <h3>Recommended engineering actions</h3>
        <ul className="recommendations-list">
          {result.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="disclaimer-box">
        <strong>Academic Prototype Disclaimer:</strong>
        <p>{result.disclaimer}</p>
        <span className="muted-small">Training artifact: {result.dataset_kind.replace(/_/g, " ")}</span>
      </div>
    </section>
  );
}
