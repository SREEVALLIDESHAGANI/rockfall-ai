import { useEffect, useRef, useState } from "react";

interface Props {
  slopeAngle: number; // degrees 10 - 89
  slopeHeight: number; // meters 2 - 400
  discontinuitySpacing: number; // meters 0.02 - 8
  discontinuityOrientation: number; // 0 - 1
  weatheringGrade: number; // 1 - 5
  rainfall: number; // mm
  groundwaterIndex: number; // 0 - 1
  vegetationCover: number; // 0 - 1
  seismicPGA: number; // g
}

interface Boulder {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  stopped: boolean;
  trail: Array<{ x: number; y: number }>;
}

export function SlopeVisualizer({
  slopeAngle,
  slopeHeight,
  discontinuitySpacing,
  discontinuityOrientation,
  weatheringGrade,
  rainfall,
  groundwaterIndex,
  vegetationCover,
  seismicPGA,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [viewMode, setViewMode] = useState<"openPit" | "crossSection" | "stereonet">("openPit");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const animFrameRef = useRef<number | null>(null);

  // Rain particles
  const rainDropsRef = useRef<Array<{ x: number; y: number; speed: number; length: number }>>([]);

  // Synthesize acoustic thud via Web Audio API on rock impact
  function playImpactSound(volume = 0.15) {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(110 + Math.random() * 45, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, audioCtx.currentTime + 0.07);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext restricted or muted
    }
  }

  // Initialize rain drops
  useEffect(() => {
    const drops: Array<{ x: number; y: number; speed: number; length: number }> = [];
    const count = Math.min(Math.floor((rainfall / 5000) * 80), 80);
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * 480,
        y: Math.random() * 260,
        speed: 4 + Math.random() * 4,
        length: 8 + Math.random() * 8,
      });
    }
    rainDropsRef.current = drops;
  }, [rainfall]);

  function triggerRockfall() {
    setIsSimulating(true);
    playImpactSound(0.2);
    const newBoulders: Boulder[] = [];
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const spawnX = viewMode === "openPit" ? 65 + Math.random() * 20 : 100 + Math.random() * 25;
      const spawnY = viewMode === "openPit" ? 30 + Math.random() * 10 : 40 + Math.random() * 10;
      newBoulders.push({
        x: spawnX,
        y: spawnY,
        vx: 1.5 + Math.random() * 2.5,
        vy: 0.5 + Math.random() * 1.5,
        radius: 5 + Math.random() * 5,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.25,
        stopped: false,
        trail: [],
      });
    }
    setBoulders(newBoulders);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const localBoulders = [...boulders];

    function render() {
      if (!ctx || !canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (viewMode === "stereonet") {
        renderStereonet(ctx, width, height);
        return;
      }

      if (viewMode === "openPit") {
        renderOpenPitMining(ctx, width, height, localBoulders);
        return;
      }

      // Default 2D Cross Section view
      renderSingleSlope(ctx, width, height, localBoulders);
    }

    function renderOpenPitMining(
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      bList: Boulder[],
    ) {
      // Sky
      const skyGrad = c.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, rainfall > 1500 ? "#94a3b8" : "#bae6fd");
      skyGrad.addColorStop(1, rainfall > 1500 ? "#64748b" : "#f1f5f9");
      c.fillStyle = skyGrad;
      c.fillRect(0, 0, w, h);

      // Open-Pit Step Geometry Coordinates:
      // Crest 1: (0, 45) -> (75, 45)
      // Bench 1 Face (Highwall): (75, 45) -> (125, 115) [inclination controlled by slopeAngle]
      // Catch Berm: (125, 115) -> (165, 115)
      // Bench 2 Face: (165, 115) -> (225, 185)
      // Haul Road: (225, 185) -> (360, 185)
      // Pit Floor: (360, 185) -> (410, 235) -> (480, 235)
      const rad = (Math.max(25, Math.min(85, slopeAngle)) * Math.PI) / 180;
      const b1H = 70;
      const b1Dx = b1H / Math.tan(rad);
      const b1ToeX = 75 + b1Dx;

      const bermWidth = 40;
      const b2CrestX = b1ToeX + bermWidth;
      const b2H = 70;
      const b2Dx = b2H / Math.tan(rad);
      const b2ToeX = b2CrestX + b2Dx;
      const haulRoadEndX = Math.min(b2ToeX + 130, w - 40);

      // Draw Pit Rock Mass Polygon
      c.beginPath();
      c.moveTo(0, 45);
      c.lineTo(75, 45);
      c.lineTo(b1ToeX, 115);
      c.lineTo(b2CrestX, 115);
      c.lineTo(b2ToeX, 185);
      c.lineTo(haulRoadEndX, 185);
      c.lineTo(w, 235);
      c.lineTo(w, h);
      c.lineTo(0, h);
      c.closePath();

      const rockColors: Record<number, string> = {
        1: "#475569",
        2: "#57534e",
        3: "#78716c",
        4: "#854d0e",
        5: "#92400e",
      };
      c.fillStyle = rockColors[Math.round(weatheringGrade)] || "#78716c";
      c.fill();
      c.lineWidth = 2.5;
      c.strokeStyle = "#0f172a";
      c.stroke();

      // Discontinuity Joint Planes
      c.save();
      c.clip();
      const jointAngle = (0.2 + discontinuityOrientation * 0.7) * (Math.PI / 3);
      const jointStep = Math.max(14, Math.min(45, discontinuitySpacing * 28));
      c.strokeStyle = "rgba(15, 23, 42, 0.35)";
      c.lineWidth = 1.2;
      for (let offset = -h; offset < w + h; offset += jointStep) {
        c.beginPath();
        c.moveTo(offset, 0);
        c.lineTo(offset + Math.cos(jointAngle) * 450, Math.sin(jointAngle) * 450);
        c.stroke();
      }

      // Groundwater seepage weeping lines along bench faces
      if (groundwaterIndex > 0.25) {
        c.strokeStyle = "rgba(2, 132, 199, 0.6)";
        c.lineWidth = 2;
        c.setLineDash([3, 4]);
        c.beginPath();
        c.moveTo(b1ToeX - 10, 110);
        c.lineTo(b1ToeX, 115);
        c.moveTo(b2ToeX - 15, 175);
        c.lineTo(b2ToeX, 185);
        c.stroke();
        c.setLineDash([]);
      }
      c.restore();

      // Safety Windrow / Catch Berm Ridge (Slide 4 Catchment)
      c.fillStyle = "#52525b";
      c.beginPath();
      c.ellipse(b2CrestX - 6, 113, 8, 5, 0, 0, Math.PI * 2);
      c.fill();

      // Haul Road Surface & Safety Berm
      c.fillStyle = "#3f3f46";
      c.fillRect(b2ToeX, 185, haulRoadEndX - b2ToeX, 4);
      c.fillStyle = "#71717a";
      c.fillRect(haulRoadEndX - 6, 178, 6, 8); // Haul road edge barrier

      // Draw Heavy Open-Pit Mining Haul Truck (CAT 797 Dumper)
      const truckX = b2ToeX + 45;
      const truckY = 185;

      // Truck Wheels
      c.fillStyle = "#18181b";
      c.beginPath();
      c.arc(truckX + 8, truckY - 7, 7, 0, Math.PI * 2);
      c.arc(truckX + 38, truckY - 7, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#eab308";
      c.beginPath();
      c.arc(truckX + 8, truckY - 7, 3, 0, Math.PI * 2);
      c.arc(truckX + 38, truckY - 7, 3, 0, Math.PI * 2);
      c.fill();

      // Truck Dump Bed (Yellow)
      c.fillStyle = "#eab308";
      c.beginPath();
      c.moveTo(truckX, truckY - 14);
      c.lineTo(truckX + 28, truckY - 14);
      c.lineTo(truckX + 26, truckY - 26);
      c.lineTo(truckX - 4, truckY - 22);
      c.closePath();
      c.fill();
      c.strokeStyle = "#ca8a04";
      c.lineWidth = 1;
      c.stroke();

      // Truck Cabin
      c.fillStyle = "#fef08a";
      c.fillRect(truckX + 28, truckY - 24, 14, 16);
      c.fillStyle = "#0284c7"; // Window glass
      c.fillRect(truckX + 33, truckY - 22, 7, 7);

      // Flashing Amber Beacon on Truck
      c.fillStyle = Math.floor(Date.now() / 400) % 2 === 0 ? "#f59e0b" : "#b45309";
      c.beginPath();
      c.arc(truckX + 35, truckY - 26, 2.5, 0, Math.PI * 2);
      c.fill();

      // Bench 1 Crack Extensometer Sensor Mast (with blinking status LED)
      c.fillStyle = "#334155";
      c.fillRect(68, 25, 4, 20); // pole
      c.fillStyle = "#0f172a";
      c.fillRect(64, 21, 12, 7); // solar box
      // Blinking Sensor LED
      const sensorAlert = weatheringGrade >= 4 || slopeAngle > 65;
      const ledColor = sensorAlert
        ? Math.floor(Date.now() / 300) % 2 === 0 ? "#ef4444" : "#7f1d1d"
        : "#22c55e";
      c.fillStyle = ledColor;
      c.beginPath();
      c.arc(70, 18, 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#0f172a";
      c.font = "bold 9px sans-serif";
      c.fillText("CRK-01", 54, 14);

      // Blasting induced vibrations waves if high PGA
      if (seismicPGA > 0.15) {
        c.strokeStyle = "rgba(239, 68, 68, 0.7)";
        c.lineWidth = 1.5;
        const waveR = (Date.now() / 25) % 45;
        c.beginPath();
        c.arc(70, 45, waveR, 0, Math.PI);
        c.stroke();
        c.fillStyle = "#dc2626";
        c.font = "bold 10px sans-serif";
        c.fillText(`⚡ BLASTING PPV: ${seismicPGA}g`, 15, 22);
      }

      // Bench Labels (Open-Pit Terminology)
      c.fillStyle = "#475569";
      c.font = "bold 10px sans-serif";
      c.fillText("Bench 1 (Crest)", 10, 40);
      c.fillText("Catch Berm", b1ToeX + 2, 110);
      c.fillText("Haulage Road", b2ToeX + 50, 178);

      // Rainfall Particles
      if (rainfall > 300) {
        c.strokeStyle = "rgba(56, 189, 248, 0.65)";
        c.lineWidth = 1.2;
        for (const drop of rainDropsRef.current) {
          c.beginPath();
          c.moveTo(drop.x, drop.y);
          c.lineTo(drop.x - 2, drop.y + drop.length);
          c.stroke();

          drop.y += drop.speed;
          drop.x -= 0.8;
          if (drop.y > h) {
            drop.y = -10;
            drop.x = Math.random() * w;
          }
        }
      }

      // Boulder Physics & Bouncing on Multi-Benches
      let anyMoving = false;
      for (const b of bList) {
        if (!b.stopped) {
          anyMoving = true;
          b.vy += 0.35;
          b.x += b.vx;
          b.y += b.vy;
          b.rotation += b.vRot;

          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 20) b.trail.shift();

          // Bench 1 face collision
          if (b.x >= 75 && b.x <= b1ToeX) {
            const faceY = 45 + ((b.x - 75) / (b1ToeX - 75)) * 70;
            if (b.y + b.radius >= faceY) {
              b.y = faceY - b.radius;
              b.vy = -Math.abs(b.vy) * 0.45;
              b.vx += 0.4;
              b.vRot = b.vx * 0.1;
              playImpactSound(0.08);
            }
          }
          // Catch berm collision
          else if (b.x > b1ToeX && b.x <= b2CrestX) {
            if (b.y + b.radius >= 115) {
              b.y = 115 - b.radius;
              b.vy = -b.vy * 0.28;
              b.vx *= 0.82; // catch berm friction
              if (b.radius < 7 && Math.abs(b.vx) < 0.6) {
                // Berm caught the smaller rock!
                b.stopped = true;
                b.vx = 0;
                b.vy = 0;
              } else {
                playImpactSound(0.06);
              }
            }
          }
          // Bench 2 face collision
          else if (b.x > b2CrestX && b.x <= b2ToeX) {
            const faceY = 115 + ((b.x - b2CrestX) / (b2ToeX - b2CrestX)) * 70;
            if (b.y + b.radius >= faceY) {
              b.y = faceY - b.radius;
              b.vy = -Math.abs(b.vy) * 0.45;
              b.vx += 0.4;
              playImpactSound(0.09);
            }
          }
          // Haul road collision
          else if (b.x > b2ToeX) {
            if (b.y + b.radius >= 185) {
              b.y = 185 - b.radius;
              b.vy = -b.vy * 0.25;
              b.vx *= 0.85;
              if (Math.abs(b.vx) < 0.2 && Math.abs(b.vy) < 0.3) {
                b.stopped = true;
                b.vx = 0;
                b.vy = 0;
              } else {
                playImpactSound(0.05);
              }
            }
          }
        }

        // Draw Trail
        if (b.trail.length > 1) {
          c.beginPath();
          c.moveTo(b.trail[0].x, b.trail[0].y);
          for (let p = 1; p < b.trail.length; p++) {
            c.lineTo(b.trail[p].x, b.trail[p].y);
          }
          c.strokeStyle = "rgba(220, 38, 38, 0.45)";
          c.lineWidth = 2;
          c.stroke();
        }

        // Draw Boulder
        c.save();
        c.translate(b.x, b.y);
        c.rotate(b.rotation);
        c.beginPath();
        c.arc(0, 0, b.radius, 0, Math.PI * 2);
        c.fillStyle = "#3f3f46";
        c.fill();
        c.strokeStyle = "#18181b";
        c.lineWidth = 1.4;
        c.stroke();
        c.restore();
      }

      if (anyMoving) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        setIsSimulating(false);
      }
    }

    function renderSingleSlope(
      ctx2: CanvasRenderingContext2D,
      width: number,
      height: number,
      bList: Boulder[],
    ) {
      const skyGrad = ctx2.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, rainfall > 1500 ? "#cbd5e1" : "#e0f2fe");
      skyGrad.addColorStop(1, rainfall > 1500 ? "#94a3b8" : "#f8fafc");
      ctx2.fillStyle = skyGrad;
      ctx2.fillRect(0, 0, width, height);

      const rad = (Math.max(15, Math.min(85, slopeAngle)) * Math.PI) / 180;
      const crestX = 130;
      const crestY = 55;
      const toeY = 215;
      const slopeVisualH = toeY - crestY;
      const dx = slopeVisualH / Math.tan(rad);
      const toeX = Math.min(crestX + dx, width - 40);

      ctx2.beginPath();
      ctx2.moveTo(0, crestY);
      ctx2.lineTo(crestX, crestY);
      ctx2.lineTo(toeX, toeY);
      ctx2.lineTo(width, toeY);
      ctx2.lineTo(width, height);
      ctx2.lineTo(0, height);
      ctx2.closePath();

      const rockColors: Record<number, string> = {
        1: "#475569",
        2: "#57534e",
        3: "#78716c",
        4: "#854d0e",
        5: "#92400e",
      };
      ctx2.fillStyle = rockColors[Math.round(weatheringGrade)] || "#78716c";
      ctx2.fill();
      ctx2.lineWidth = 3;
      ctx2.strokeStyle = "#1e293b";
      ctx2.stroke();

      ctx2.save();
      ctx2.clip();

      const jointAngle = (0.2 + discontinuityOrientation * 0.7) * (Math.PI / 3);
      const jointStep = Math.max(12, Math.min(50, discontinuitySpacing * 30));
      ctx2.strokeStyle = "rgba(15, 23, 42, 0.4)";
      ctx2.lineWidth = 1.5;
      for (let offset = -height; offset < width + height; offset += jointStep) {
        ctx2.beginPath();
        ctx2.moveTo(offset, 0);
        ctx2.lineTo(offset + Math.cos(jointAngle) * 400, Math.sin(jointAngle) * 400);
        ctx2.stroke();
      }

      if (groundwaterIndex > 0.05) {
        const waterHeight = toeY - (toeY - crestY) * groundwaterIndex * 0.85;
        ctx2.beginPath();
        ctx2.moveTo(0, waterHeight);
        ctx2.lineTo(crestX, waterHeight);
        ctx2.lineTo(toeX, toeY - 10);
        ctx2.lineTo(width, toeY - 10);
        ctx2.lineTo(width, height);
        ctx2.lineTo(0, height);
        ctx2.closePath();
        ctx2.fillStyle = "rgba(14, 165, 233, 0.28)";
        ctx2.fill();
      }
      ctx2.restore();

      ctx2.fillStyle = "#334155";
      ctx2.fillRect(toeX, toeY, width - toeX, 6);

      let anyMoving = false;
      for (const b of bList) {
        if (!b.stopped) {
          anyMoving = true;
          b.vy += 0.35;
          b.x += b.vx;
          b.y += b.vy;
          b.rotation += b.vRot;

          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 20) b.trail.shift();

          if (b.x >= crestX && b.x <= toeX) {
            const slopeFaceY = crestY + ((b.x - crestX) / (toeX - crestX)) * (toeY - crestY);
            if (b.y + b.radius >= slopeFaceY) {
              b.y = slopeFaceY - b.radius;
              b.vy = -Math.abs(b.vy) * 0.45;
              b.vx += 0.4;
              playImpactSound(0.08);
            }
          } else if (b.x > toeX) {
            if (b.y + b.radius >= toeY) {
              b.y = toeY - b.radius;
              b.vy = -b.vy * 0.3;
              b.vx *= 0.88;
              if (Math.abs(b.vx) < 0.2 && Math.abs(b.vy) < 0.3) {
                b.stopped = true;
              } else {
                playImpactSound(0.04);
              }
            }
          }
        }

        ctx2.beginPath();
        ctx2.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx2.fillStyle = "#44403c";
        ctx2.fill();
      }

      if (anyMoving) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        setIsSimulating(false);
      }
    }

    function renderStereonet(c: CanvasRenderingContext2D, w: number, h: number) {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const radius = 95;

      c.beginPath();
      c.arc(centerX, centerY, radius, 0, Math.PI * 2);
      c.fillStyle = "#f8fafc";
      c.fill();
      c.strokeStyle = "#0f172a";
      c.lineWidth = 2;
      c.stroke();

      c.beginPath();
      c.moveTo(centerX, centerY - radius);
      c.lineTo(centerX, centerY + radius);
      c.moveTo(centerX - radius, centerY);
      c.lineTo(centerX + radius, centerY);
      c.strokeStyle = "#cbd5e1";
      c.lineWidth = 1;
      c.stroke();

      c.fillStyle = "#0f172a";
      c.font = "bold 11px sans-serif";
      c.fillText("N", centerX - 4, centerY - radius - 5);
      c.fillText("S", centerX - 4, centerY + radius + 14);
      c.fillText("E", centerX + radius + 5, centerY + 4);
      c.fillText("W", centerX - radius - 15, centerY + 4);

      const frictionR = radius * (30 / 90);
      c.beginPath();
      c.arc(centerX, centerY, frictionR, 0, Math.PI * 2);
      c.fillStyle = "rgba(22, 163, 74, 0.12)";
      c.fill();
      c.strokeStyle = "#16a34a";
      c.lineWidth = 1.5;
      c.setLineDash([4, 4]);
      c.stroke();
      c.setLineDash([]);

      const dipRatio = slopeAngle / 90;
      const arcWidth = radius * dipRatio;
      c.beginPath();
      c.ellipse(centerX, centerY, radius, arcWidth, 0, 0, Math.PI * 2);
      c.strokeStyle = "#b43403";
      c.lineWidth = 2;
      c.stroke();

      const jointDip = 20 + discontinuityOrientation * 55;
      const poleDist = radius * ((90 - jointDip) / 90);
      const poleX = centerX;
      const poleY = centerY + poleDist;

      const isDaylighting = discontinuityOrientation > 0.6 && slopeAngle > jointDip;

      c.beginPath();
      c.arc(poleX, poleY, 6, 0, Math.PI * 2);
      c.fillStyle = isDaylighting ? "#ef4444" : "#3b82f6";
      c.fill();
      c.strokeStyle = "#0f172a";
      c.lineWidth = 1.5;
      c.stroke();

      c.fillStyle = "#0f172a";
      c.font = "bold 11px sans-serif";
      c.fillText(`Slope Face: ${slopeAngle}° Dip`, 15, 25);
      c.fillText(`Joint Set Pole: ${jointDip.toFixed(0)}° Dip`, 15, 42);

      if (isDaylighting) {
        c.fillStyle = "#dc2626";
        c.font = "bold 12px sans-serif";
        c.fillText("⚠️ Daylighting Kinematic Risk: Planar sliding feasible", 15, h - 18);
      } else {
        c.fillStyle = "#16a34a";
        c.font = "bold 12px sans-serif";
        c.fillText("✅ Kinematically Favourable: Joint does not daylight into face", 15, h - 18);
      }
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    slopeAngle,
    slopeHeight,
    discontinuitySpacing,
    discontinuityOrientation,
    weatheringGrade,
    rainfall,
    groundwaterIndex,
    vegetationCover,
    seismicPGA,
    boulders,
    viewMode,
    soundEnabled,
  ]);

  return (
    <div className="slope-visualizer-container">
      <div className="visualizer-header">
        <div className="visualizer-title-wrap">
          <span className="visualizer-tag">
            {viewMode === "openPit"
              ? "Open-Pit Mine Multi-Bench Telemetry"
              : viewMode === "crossSection"
              ? "Single Slope Cross-Section"
              : "Equatorial Kinematic Projection"}
          </span>
          <h4>
            {viewMode === "openPit"
              ? "Open-Pit Highwall, Catch Berm & Haulage Road"
              : viewMode === "crossSection"
              ? "Single Face Profile & Kinematics"
              : "Stereographic Daylight Net (Schmidt Projection)"}
          </h4>
        </div>

        <div className="visualizer-actions-row">
          <div className="view-toggle-pills">
            <button
              type="button"
              className={`view-pill ${viewMode === "openPit" ? "active" : ""}`}
              onClick={() => setViewMode("openPit")}
            >
              ⛏️ Open-Pit Mine
            </button>
            <button
              type="button"
              className={`view-pill ${viewMode === "crossSection" ? "active" : ""}`}
              onClick={() => setViewMode("crossSection")}
            >
              📐 Single Slope
            </button>
            <button
              type="button"
              className={`view-pill ${viewMode === "stereonet" ? "active" : ""}`}
              onClick={() => setViewMode("stereonet")}
            >
              🌐 Stereonet
            </button>
          </div>

          <button
            type="button"
            className="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute collision audio" : "Enable collision audio"}
          >
            {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>

          {viewMode !== "stereonet" ? (
            <button
              type="button"
              className="sim-rockfall-btn"
              onClick={triggerRockfall}
              disabled={isSimulating}
              title="Simulate gravitational boulder roll down this slope profile"
            >
              {isSimulating ? "⏳ Tumbling..." : "🪨 Simulate Rockfall Bounce"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="canvas-frame">
        <canvas ref={canvasRef} width={480} height={260} className="slope-canvas" />
        {viewMode === "openPit" ? (
          <div className="visualizer-legend">
            <span>⛏️ Highwall Dip: <strong>{slopeAngle}°</strong></span>
            <span>🚚 Haul Road Dumper</span>
            <span>🚨 Sensor LED: <strong>{weatheringGrade >= 4 ? "ALERT" : "NORMAL"}</strong></span>
            <span>🛡️ Catch Berm Retaining</span>
          </div>
        ) : viewMode === "crossSection" ? (
          <div className="visualizer-legend">
            <span>📐 Angle: <strong>{slopeAngle}°</strong></span>
            <span>⛰️ Height: <strong>{slopeHeight}m</strong></span>
            <span>💧 Moisture: <strong>{(groundwaterIndex * 100).toFixed(0)}%</strong></span>
            <span>🌿 Vegetation: <strong>{(vegetationCover * 100).toFixed(0)}%</strong></span>
          </div>
        ) : (
          <div className="visualizer-legend">
            <span>🔴 Red Arc = Slope Face</span>
            <span>🔵/🔴 Dot = Joint Pole</span>
            <span>🟢 Dashed = 30° Friction Cone</span>
          </div>
        )}
      </div>

      <p className="visualizer-subtext">
        {viewMode === "openPit"
          ? "Open-pit highwall geometry: Watch boulders tumble down Bench 1, test the safety catch berm, and simulate impacts along the haulage ramp and mining excavator sector."
          : viewMode === "crossSection"
          ? "Sliding slope angle and height morphs the physical cross section in real-time."
          : "Schmidt equatorial net evaluates structural kinematic feasibility."}
      </p>
    </div>
  );
}
