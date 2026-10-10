import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="page about-page">
      <section className="panel">
        <div className="project-badge-row">
          <span className="eyebrow">Mini Project Review-2 · Team No: 19</span>
          <span className="univ-tag">Anurag University · AIML</span>
        </div>
        <h1>AI-Based Rockfall Prediction and Alert System for Open-Pit Mines</h1>
        <p className="lead">
          Designed to predict potential rockfall hazards in open-pit mines using multi-sensor data
          fusion and machine learning, triggering rapid automated alerts to protect workers and equipment.
        </p>

        {/* Project Team Card */}
        <div className="team-card panel">
          <h3>Project Team Members (Team No: 19)</h3>
          <div className="team-members-grid">
            <div className="member-item">
              <span className="member-role">Student</span>
              <strong>Sreevalli Deshagani</strong>
              <small>HT.No: 23EG107F63</small>
            </div>
            <div className="member-item">
              <span className="member-role">Student</span>
              <strong>Thanvi Rao</strong>
              <small>HT.No: 23EG107F57</small>
            </div>
            <div className="member-item">
              <span className="member-role">Student</span>
              <strong>Pranith Reddy</strong>
              <small>HT.No: 23EG107F11</small>
            </div>
          </div>
          <div className="dept-footer">
            <span>Department of Artificial Intelligence and Machine Learning (AIML-FH)</span>
          </div>
        </div>

        {/* 7-Step Methodology Pipeline (Slide 10) */}
        <div className="about-section">
          <h2>System Architecture & Methodology</h2>
          <div className="methodology-steps-container">
            <div className="m-step">
              <span className="m-num">1</span>
              <h4>Data Acquisition</h4>
              <p>Continuous telemetry from vibration sensors, crack extensometers, weather stations, and optical slope cameras.</p>
            </div>
            <div className="m-step">
              <span className="m-num">2</span>
              <h4>Data Processing</h4>
              <p>Noise filtering, sensor data cleaning, normalization, and geomechanical feature extraction.</p>
            </div>
            <div className="m-step">
              <span className="m-num">3</span>
              <h4>AI Prediction Engine</h4>
              <p>Supervised machine learning pipeline evaluating non-linear rockfall probability distributions.</p>
            </div>
            <div className="m-step">
              <span className="m-num">4</span>
              <h4>Decision Controller</h4>
              <p>Real-time classifier categorizing slope conditions into LOW, MEDIUM, or HIGH risk thresholds.</p>
            </div>
            <div className="m-step">
              <span className="m-num">5</span>
              <h4>Alert Center</h4>
              <p>Automated trigger dispatching site sirens, control-room emergency alerts, and mobile notifications.</p>
            </div>
            <div className="m-step">
              <span className="m-num">6</span>
              <h4>Safety Response</h4>
              <p>Actionable SOP: Evacuate workers, restrict haulage routes, deploy UAV slope inspections, and halt blasting.</p>
            </div>
          </div>
        </div>

        {/* Research Context & Literature References (Slide 11) */}
        <div className="about-section">
          <h2>Literature Survey & Scientific Foundations</h2>
          <ul className="literature-list">
            <li>
              <strong>Gladious et al., 2025:</strong> <em>"Machine learning based prediction of geotechnical parameters affecting slope stability in open-pit iron ore mines in high precipitation zone,"</em> Scientific Reports, vol. 15, 21868.
            </li>
            <li>
              <strong>Sensors Journal, 2025:</strong> <em>"Intelligent Prediction and Numerical Simulation of Landslide Prediction in Open-Pit Mines Based on Multi-Source Data Fusion and Machine Learning."</em>
            </li>
            <li>
              <strong>Int. J. Rock Mechanics & Mining Sciences, 2025:</strong> <em>"Predicting rockfall hazard with deep learning: Latent feature extraction from geological layers."</em>
            </li>
            <li>
              <strong>Scientific Reports, 2025:</strong> <em>"Cloud-based slope risk monitoring and early warning system for open-pit coal mines."</em>
            </li>
          </ul>
        </div>

        <div className="about-actions">
          <Link to="/assess" className="primary">
            Run Slope Assessment →
          </Link>
          <Link to="/alerts" className="secondary-btn">
            Open Alert Center Dashboard
          </Link>
          <Link to="/insights" className="secondary-btn">
            View ML Evidence
          </Link>
        </div>
      </section>
    </div>
  );
}
