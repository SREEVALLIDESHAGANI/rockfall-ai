import { useEffect, useState } from "react";
import type { RiskLevel } from "../types/prediction";
import { sirenEngine } from "../utils/sirenAudio";

interface AlertLog {
  id: string;
  time: string;
  bench: string;
  level: RiskLevel;
  trigger: string;
  status: "ACTIVE" | "RESOLVED" | "STANDBY";
  actionsTaken: string[];
}

export function AlertCenterPage() {
  const [sirenActive, setSirenActive] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [activeBench, setActiveBench] = useState("Bench 4 - Haul Road Sector B");
  const [alertLevel, setAlertLevel] = useState<RiskLevel>("HIGH");

  const [alerts, setAlerts] = useState<AlertLog[]>([
    {
      id: "ALT-1092",
      time: "10:14 AM",
      bench: "Bench 4 - Haul Road Sector B",
      level: "HIGH",
      trigger: "Crack extensometer rate > 3.2mm/hr + Post-blasting vibration 0.28g",
      status: "ACTIVE",
      actionsTaken: ["Haul trucks redirected", "Siren sounded", "Safety crew dispatched"],
    },
    {
      id: "ALT-1088",
      time: "08:45 AM",
      bench: "North Highwall Overburden Bench",
      level: "MEDIUM",
      trigger: "Rainfall accumulation 85mm in 3h",
      status: "RESOLVED",
      actionsTaken: ["Visual inspection confirmed stable talus"],
    },
    {
      id: "ALT-1081",
      time: "Yesterday",
      bench: "Bench 2 - Primary Crusher Ramp",
      level: "LOW",
      trigger: "Routine geotechnical baseline monitoring",
      status: "STANDBY",
      actionsTaken: ["Baseline sensor telemetry normal"],
    },
  ]);

  const [checklist, setChecklist] = useState({
    evacuate: true,
    restrict: true,
    inspect: false,
    prevent: false,
  });

  useEffect(() => {
    return () => {
      sirenEngine.stop();
    };
  }, []);

  function toggleCheck(key: keyof typeof checklist) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleTriggerSiren() {
    if (sirenActive) {
      sirenEngine.stop();
      setSirenActive(false);
    } else {
      sirenEngine.start();
      setSirenActive(true);
    }
  }

  function handleSendBroadcast() {
    sirenEngine.playBroadcastChime();
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3500);

    const newLog: AlertLog = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      bench: activeBench,
      level: alertLevel,
      trigger: "Manual Control Room Emergency Broadcast Initiated",
      status: "ACTIVE",
      actionsTaken: [
        checklist.evacuate ? "Worker evacuation signal dispatched" : "Monitoring",
        checklist.restrict ? "Haulage perimeter restricted" : "Access open",
      ],
    };
    setAlerts((prev) => [newLog, ...prev]);
  }

  return (
    <div className="page alert-center-page">
      {/* Header Banner */}
      <section className="panel alert-hero-panel">
        <div className="alert-hero-top">
          <span className="control-room-tag">Open-Pit Mine Safety Command</span>
          <div className="live-pulse-indicator">
            <span className="pulse-dot" />
            LIVE TELEMETRY FEED
          </div>
        </div>
        <h1>Control Room Alert Center & Safety Protocol</h1>
        <p className="lead">
          Automated decision controller and dispatch system for open-pit mining operations. Integrates
          multi-sensor trigger thresholds with immediate evacuation protocols.
        </p>

        <div className="sensor-telemetry-row">
          <div className="telemetry-chip">
            <span className="t-icon">📶</span>
            <div>
              <span className="t-label">Vibration Sensor (PPV)</span>
              <strong>0.18 g (Nominal)</strong>
            </div>
          </div>
          <div className="telemetry-chip">
            <span className="t-icon">📏</span>
            <div>
              <span className="t-label">Crack Extensometer</span>
              <strong className="text-warning">+1.4 mm/hr</strong>
            </div>
          </div>
          <div className="telemetry-chip">
            <span className="t-icon">🌧️</span>
            <div>
              <span className="t-label">Weather Station</span>
              <strong>42 mm/24h Rain</strong>
            </div>
          </div>
          <div className="telemetry-chip">
            <span className="t-icon">📷</span>
            <div>
              <span className="t-label">Slope Vision Camera</span>
              <strong>Active (Optical Feed 04)</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Alert Control Grid */}
      <div className="alert-grid-layout">
        {/* Left: Emergency Action Controller */}
        <section className="panel emergency-controller-panel">
          <div className="panel-head">
            <h2>🚨 Emergency Alert Dispatcher</h2>
            <p className="muted">Transmit immediate automated warning signals across mine communication channels.</p>
          </div>

          <div className="controller-inputs">
            <label className="field">
              <span>Target Mine Sector / Bench</span>
              <select
                value={activeBench}
                onChange={(e) => setActiveBench(e.target.value)}
                className="select-input"
              >
                <option value="Bench 4 - Haul Road Sector B">Bench 4 - Haul Road Sector B (Highwall)</option>
                <option value="Bench 2 - Primary Crusher Ramp">Bench 2 - Primary Crusher Ramp</option>
                <option value="North Pit Overburden Waste Dump">North Pit Overburden Waste Dump</option>
                <option value="South Pit Blast Zone C">South Pit Blast Zone C</option>
              </select>
            </label>

            <label className="field">
              <span>Emergency Hazard Level</span>
              <div className="level-select-row">
                {(["LOW", "MEDIUM", "HIGH"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`level-btn ${lvl.toLowerCase()} ${alertLevel === lvl ? "active" : ""}`}
                    onClick={() => setAlertLevel(lvl)}
                  >
                    {lvl} RISK
                  </button>
                ))}
              </div>
            </label>
          </div>

          {/* Action Protocol Checklist (Slide 10 Methodology) */}
          <div className="safety-checklist-box">
            <h3>Standard Safety Protocol Actions (SOP):</h3>
            <div className="checklist-items">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={checklist.evacuate}
                  onChange={() => toggleCheck("evacuate")}
                />
                <div>
                  <strong>Evacuate Workers</strong>
                  <p>Trigger wireless sirens and send instant SMS alert to personnel at target bench.</p>
                </div>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={checklist.restrict}
                  onChange={() => toggleCheck("restrict")}
                />
                <div>
                  <strong>Restrict Haulage Area</strong>
                  <p>Halt dumper and shovel traffic entering the hazardous bench sector.</p>
                </div>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={checklist.inspect}
                  onChange={() => toggleCheck("inspect")}
                />
                <div>
                  <strong>Slope Geotechnical Inspection</strong>
                  <p>Deploy UAV drone with photogrammetry to survey tension cracks.</p>
                </div>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={checklist.prevent}
                  onChange={() => toggleCheck("prevent")}
                />
                <div>
                  <strong>Prevent Secondary Incidents</strong>
                  <p>Suspend nearby blasting and heavy excavation until slope stabilization.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="emergency-actions-row">
            <button
              type="button"
              className={`siren-button ${sirenActive ? "active" : ""}`}
              onClick={handleTriggerSiren}
            >
              {sirenActive ? "🔊 Siren Sounding (Mute)" : "📢 Sound Site Siren"}
            </button>

            <button
              type="button"
              className="broadcast-button"
              onClick={handleSendBroadcast}
            >
              {broadcastSent ? "✓ Emergency Alert Broadcasted!" : "📡 Broadcast Emergency Alert"}
            </button>
          </div>

          {broadcastSent && (
            <div className="broadcast-banner" role="alert">
              <strong>🚨 EMERGENCY NOTIFICATION DISPATCHED:</strong>
              <p>
                High-priority alerts sent via SMS, Control-Room Dashboards, and Mobile Push Notifications
                to all registered miners at {activeBench}.
              </p>
            </div>
          )}
        </section>

        {/* Right: Live Safety Audit Log & Flow */}
        <section className="panel alert-log-panel">
          <div className="panel-head">
            <h2>📋 Mine Alert Registry</h2>
            <p className="muted">Live log of automated sensor triggers and operator actions.</p>
          </div>

          <div className="alert-logs-list">
            {alerts.map((item) => (
              <div key={item.id} className={`alert-card ${item.level.toLowerCase()}`}>
                <div className="alert-card-top">
                  <span className={`status-pill ${item.level.toLowerCase()}`}>{item.level} RISK</span>
                  <span className="alert-id">{item.id} · {item.time}</span>
                  <span className={`badge-state ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
                <strong className="alert-bench">{item.bench}</strong>
                <p className="alert-trigger">{item.trigger}</p>
                <div className="actions-taken-wrap">
                  <span className="actions-lbl">Actions Taken:</span>
                  <ul>
                    {item.actionsTaken.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Methodology Flowchart Diagram Preview */}
          <div className="flowchart-mini-preview">
            <h4>System Architecture Decision Pipeline</h4>
            <div className="pipeline-flow-mini">
              <span>1. Sensors (Vibration/Crack/Rain)</span> →
              <span>2. AI Model (CNN+LSTM)</span> →
              <span>3. Decision Controller</span> →
              <span>4. Alert Center (Siren/App/SMS)</span> →
              <span>5. Safety Response</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
