import { useEffect, useState } from "react";
import type { RiskLevel } from "../types/prediction";

interface Props {
  probability: number; // 0 to 1
  riskLevel: RiskLevel;
}

export function RiskGauge({ probability, riskLevel }: Props) {
  const [animatedProb, setAnimatedProb] = useState(0);

  useEffect(() => {
    // Smooth animation on probability change
    let start = 0;
    const end = Math.min(Math.max(probability, 0), 1);
    const duration = 900;
    const startTime = performance.now();

    function frame(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedProb(start + (end - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [probability]);

  // Angle from -90 deg (left/0%) to +90 deg (right/100%)
  const needleAngle = -90 + animatedProb * 180;
  const pct = (animatedProb * 100).toFixed(1);

  const colors: Record<RiskLevel, { text: string; bg: string }> = {
    LOW: { text: "#15803d", bg: "#dcfce7" },
    MEDIUM: { text: "#b45309", bg: "#fef3c7" },
    HIGH: { text: "#be123c", bg: "#ffe4e6" },
  };

  const currentTheme = colors[riskLevel] || colors.MEDIUM;

  return (
    <div className="risk-gauge-card">
      <div className="gauge-header">
        <span className="gauge-title">Calculated Hazard Intensity</span>
        <span
          className="gauge-pill"
          style={{ color: currentTheme.text, backgroundColor: currentTheme.bg }}
        >
          {riskLevel} HAZARD
        </span>
      </div>

      <div className="gauge-svg-wrap">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <defs>
            {/* Gradient along the arc */}
            <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track arc */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Colored gradient arc */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="url(#gaugeArcGrad)"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Threshold markers */}
          {/* 33% marker */}
          <line x1="62" y1="52" x2="68" y2="57" stroke="#cbd5e1" strokeWidth="2" />
          {/* 66% marker */}
          <line x1="138" y1="52" x2="132" y2="57" stroke="#cbd5e1" strokeWidth="2" />

          {/* Rotating Needle */}
          <g transform={`rotate(${needleAngle}, 100, 105)`}>
            <polygon
              points="97,105 100,28 103,105"
              fill="#0f172a"
              filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
            />
            <circle cx="100" cy="105" r="9" fill="#0f172a" />
            <circle cx="100" cy="105" r="4" fill="#ffffff" />
          </g>

          {/* Center digital display */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="gauge-pct-text"
            fill="#0f172a"
          >
            {pct}%
          </text>
          <text
            x="100"
            y="112"
            textAnchor="middle"
            className="gauge-sub-text"
            fill="#64748b"
          >
            CONFIDENCE
          </text>

          {/* Arc Legend Labels */}
          <text x="24" y="118" textAnchor="start" className="gauge-zone-label" fill="#16a34a">
            LOW
          </text>
          <text x="100" y="24" textAnchor="middle" className="gauge-zone-label" fill="#d97706">
            MED
          </text>
          <text x="176" y="118" textAnchor="end" className="gauge-zone-label" fill="#dc2626">
            HIGH
          </text>
        </svg>
      </div>
    </div>
  );
}
