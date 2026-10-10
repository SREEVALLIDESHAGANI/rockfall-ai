import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { fetchHealth } from "../services/api";
import type { HealthResponse } from "../types/prediction";

export function Layout({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    function check() {
      fetchHealth()
        .then((res) => {
          if (mounted) {
            setHealth(res);
            setChecking(false);
          }
        })
        .catch(() => {
          if (mounted) {
            setHealth(null);
            setChecking(false);
          }
        });
    }

    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <div className="brand-title-row">
              <strong>Rockfall-AI</strong>
              {checking ? (
                <span className="api-badge checking">Checking API…</span>
              ) : health?.status === "ok" ? (
                <span className="api-badge online" title={`Model: ${health.model_name || "loaded"}`}>
                  ● API Online ({health.model_name || "Model Ready"})
                </span>
              ) : health?.status === "degraded" ? (
                <span className="api-badge degraded" title="API running but model not loaded">
                  ▲ API Degraded
                </span>
              ) : (
                <span className="api-badge offline" title="Backend not reachable at localhost:8000">
                  ○ API Offline
                </span>
              )}
            </div>
            <p>AI-Based Rockfall Prediction & Alert System for Open-Pit Mines</p>
          </div>
        </div>
        <nav>
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/assess">Assess Slope</NavLink>
          <NavLink to="/alerts">🚨 Alert Center</NavLink>
          <NavLink to="/insights">Model Evidence</NavLink>
          <NavLink to="/about">Methodology</NavLink>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        Decision-support prototype only. Not a replacement for professional geotechnical analysis.
        Training data are synthetic/sample development data.
      </footer>
    </div>
  );
}
