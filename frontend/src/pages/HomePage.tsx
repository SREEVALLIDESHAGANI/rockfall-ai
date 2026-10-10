import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SlopeVisualizer } from "../components/SlopeVisualizer";

export function HomePage() {
  const navigate = useNavigate();

  // Interactive Sandbox state on the homepage
  const [demoAngle, setDemoAngle] = useState(62);
  const [demoRain, setDemoRain] = useState(1800);
  const [demoWeathering, setDemoWeathering] = useState(4);
  const [activeStep, setActiveStep] = useState(0);

  // Quick heuristic proxy for live interactive feel on the home screen
  const estimatedScore =
    (demoAngle / 89) * 0.45 + (demoRain / 4000) * 0.3 + (demoWeathering / 5) * 0.25;
  const estimatedRisk =
    estimatedScore > 0.62 ? "HIGH" : estimatedScore > 0.42 ? "MEDIUM" : "LOW";

  const pipelineSteps = [
    {
      step: "01",
      title: "Field Geotechnical Survey",
      summary: "Measure face dip angle, vertical slope height, joint spacing & intact UCS strength.",
      details: "Raw parameters collected via geological compass, Schmidt hammer, and scanline mapping.",
      icon: "📐",
    },
    {
      step: "02",
      title: "Environmental & Hydro Load",
      summary: "Integrate precipitation volume, phreatic moisture, and seismic PGA.",
      details: "Hydrological proxies represent destabilizing porewater pressure in joint fissures.",
      icon: "🌧️",
    },
    {
      step: "03",
      title: "Physics-Proxy Engineering",
      summary: "Synthesize kinetic fall energy, hydro-loading, and planar weakness proxies.",
      details: "Non-linear interaction terms amplify joint unfavourability under high water tables.",
      icon: "⚙️",
    },
    {
      step: "04",
      title: "ML Screening Classification",
      summary: "Trained scikit-learn pipeline computes multiclass probabilities & drivers.",
      details: "Outputs calibrated LOW / MEDIUM / HIGH screening tiers with explainable importance weights.",
      icon: "🎯",
    },
  ];

  function launchWithDemoParams() {
    navigate("/assess");
  }

  return (
    <div className="page home-page">
      {/* Hero Section with Interactive Sandbox */}
      <section className="hero-interactive">
        <div className="hero-content">
          <span className="eyebrow-badge">Interactive Geotechnical AI Prototype</span>
          <h1>Transparent, Evidence-Based Rockfall Hazard Screening</h1>
          <p className="hero-lead">
            Explore how slope inclination, fractured rock mass, rainfall infiltration, and seismic
            acceleration combine into standardized hazard screening categories with calibrated machine
            learning.
          </p>

          <div className="hero-quick-actions">
            <Link className="primary big" to="/assess">
              🚀 Launch Full Assessment
            </Link>
            <Link className="secondary-btn big" to="/insights">
              📊 Explore Evaluation Metrics
            </Link>
          </div>

          <div className="hero-stats-row">
            <div className="stat-pill">
              <strong className="stat-num">87.3%</strong>
              <span className="stat-label">Model Accuracy</span>
            </div>
            <div className="stat-pill">
              <strong className="stat-num">0.874</strong>
              <span className="stat-label">Held-out Macro F1</span>
            </div>
            <div className="stat-pill">
              <strong className="stat-num">10</strong>
              <span className="stat-label">Physical Variables</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Sandbox Widget */}
        <div className="hero-sandbox-card">
          <div className="sandbox-header">
            <div>
              <span className="sandbox-tag">Live Sandbox</span>
              <h3>Quick Slope Sim</h3>
            </div>
            <span className={`live-risk-pill ${estimatedRisk.toLowerCase()}`}>
              {estimatedRisk} RISK
            </span>
          </div>

          <div className="sandbox-visualizer-wrap">
            <SlopeVisualizer
              slopeAngle={demoAngle}
              slopeHeight={45}
              discontinuitySpacing={0.3}
              discontinuityOrientation={demoAngle > 55 ? 0.75 : 0.4}
              weatheringGrade={demoWeathering}
              rainfall={demoRain}
              groundwaterIndex={demoRain > 1200 ? 0.7 : 0.25}
              vegetationCover={0.3}
              seismicPGA={0.15}
            />
          </div>

          <div className="sandbox-controls">
            <div className="sandbox-slider-group">
              <div className="slider-label-row">
                <span>Slope Face Dip:</span>
                <strong>{demoAngle}°</strong>
              </div>
              <input
                type="range"
                min={20}
                max={85}
                value={demoAngle}
                onChange={(e) => setDemoAngle(Number(e.target.value))}
                className="slider"
              />
            </div>

            <div className="sandbox-slider-group">
              <div className="slider-label-row">
                <span>Precipitation (mm):</span>
                <strong>{demoRain} mm</strong>
              </div>
              <input
                type="range"
                min={100}
                max={3500}
                step={50}
                value={demoRain}
                onChange={(e) => setDemoRain(Number(e.target.value))}
                className="slider"
              />
            </div>

            <div className="sandbox-slider-group">
              <div className="slider-label-row">
                <span>Weathering Grade:</span>
                <strong>Grade {demoWeathering}</strong>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={demoWeathering}
                onChange={(e) => setDemoWeathering(Number(e.target.value))}
                className="slider"
              />
            </div>
          </div>

          <button type="button" className="sandbox-cta-btn" onClick={launchWithDemoParams}>
            Assess Full Site with These Parameters →
          </button>
        </div>
      </section>

      {/* Interactive Pipeline Stepper */}
      <section className="panel pipeline-interactive-panel">
        <div className="panel-head-center">
          <span className="eyebrow">End-to-End Pipeline</span>
          <h2>How Rockfall-AI Evaluates Slopes</h2>
          <p className="muted">Click any pipeline stage to inspect data transformation and physical proxies.</p>
        </div>

        <div className="stepper-nav">
          {pipelineSteps.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              className={`stepper-tab ${activeStep === idx ? "active" : ""}`}
              onClick={() => setActiveStep(idx)}
            >
              <span className="stepper-tab-icon">{s.icon}</span>
              <div className="stepper-tab-text">
                <span className="stepper-num-tag">STEP {s.step}</span>
                <strong className="stepper-tab-title">{s.title}</strong>
              </div>
            </button>
          ))}
        </div>

        <div className="stepper-detail-card">
          <div className="stepper-detail-header">
            <span className="stepper-detail-icon">{pipelineSteps[activeStep].icon}</span>
            <div>
              <h3>
                Step {pipelineSteps[activeStep].step}: {pipelineSteps[activeStep].title}
              </h3>
              <p className="lead-step">{pipelineSteps[activeStep].summary}</p>
            </div>
          </div>
          <div className="stepper-detail-body">
            <p>{pipelineSteps[activeStep].details}</p>
          </div>
        </div>
      </section>

      {/* Visual Interactive Cards */}
      <section className="feature-cards-grid">
        <div className="interactive-feature-card">
          <div className="feature-icon-badge">📐</div>
          <h3>Kinematic Geometric Feasibility</h3>
          <p>
            High dip angles and daylighting structural joints form natural planar and wedge release
            surfaces. Steeper cuts exponentially raise detachment likelihood.
          </p>
        </div>

        <div className="interactive-feature-card">
          <div className="feature-icon-badge">🌧️</div>
          <h3>Hydrostatic Cleft Pressure</h3>
          <p>
            Rainwater infiltrating joint fissures creates destabilizing hydrostatic cleft thrust while
            slaking weathered clay coatings along joint planes.
          </p>
        </div>

        <div className="interactive-feature-card">
          <div className="feature-icon-badge">⚡</div>
          <h3>Transient Dynamic Triggers</h3>
          <p>
            Peak ground acceleration (PGA) from seismic tremors provides instantaneous inertial thrust,
            triggering detachment of marginally stable rock blocks.
          </p>
        </div>

        <div className="interactive-feature-card">
          <div className="feature-icon-badge">🗺️</div>
          <h3>Interactive GIS Mapping</h3>
          <p>
            Pinpoint slope coordinates on real OpenStreetMap tiles. Review spatial geography alongside
            empirical rock mass classifications without API key restrictions.
          </p>
        </div>
      </section>
    </div>
  );
}
