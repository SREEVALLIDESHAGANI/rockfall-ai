"""
Generate high-resolution publication diagrams for Rockfall AI research paper.
Produces:
1. fig1_system_architecture.png
2. fig2_dataflow_pipeline.png
3. fig3_openpit_cross_section.png
"""
import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.makedirs('paper/figures', exist_ok=True)
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9

# --- FIGURE 1: System Architecture ---
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 60)
ax.axis('off')

# Background container
main_rect = patches.FancyBboxPatch((1, 1), 98, 58, boxstyle="round,pad=1", fc="#f8fafc", ec="#cbd5e1", lw=1.5)
ax.add_patch(main_rect)
ax.text(50, 56, "Rockfall AI: Multi-Tier Production System Architecture", ha='center', va='center', fontsize=12, fontweight='bold', color="#0f172a")

# Presentation Layer
p_box = patches.FancyBboxPatch((4, 6), 28, 44, boxstyle="round,pad=0.8", fc="#eff6ff", ec="#3b82f6", lw=1.5)
ax.add_patch(p_box)
ax.text(18, 46.5, "Presentation Layer (Client)", ha='center', va='center', fontweight='bold', color="#1e40af", fontsize=10)
p_items = [
    ("Interactive Open-Pit 2D Visualizer", "HTML5 Canvas Physics, Bench Profiles"),
    ("Dynamic Risk Gauge & GIS Map", "SVG Tachometer, Leaflet Coordinate Pin"),
    ("Control Room & Emergency Dispatch", "Web Audio Wailing Siren Engine"),
    ("Responsive SPA Engine", "React 18, TypeScript, Tailwind CSS, Vite")
]
y_cursor = 39
for title, desc in p_items:
    item_box = patches.FancyBboxPatch((6, y_cursor - 4), 24, 7, boxstyle="round,pad=0.4", fc="#ffffff", ec="#93c5fd", lw=1)
    ax.add_patch(item_box)
    ax.text(18, y_cursor + 0.5, title, ha='center', va='center', fontweight='bold', color="#1e3a8a", fontsize=8)
    ax.text(18, y_cursor - 2, desc, ha='center', va='center', color="#475569", fontsize=7)
    y_cursor -= 9.5

# Middle Layer: REST API & Application Server
s_box = patches.FancyBboxPatch((36, 6), 28, 44, boxstyle="round,pad=0.8", fc="#f0fdf4", ec="#22c55e", lw=1.5)
ax.add_patch(s_box)
ax.text(50, 46.5, "Unified Application Server", ha='center', va='center', fontweight='bold', color="#166534", fontsize=10)
s_items = [
    ("FastAPI REST Service", "Uvicorn ASGI, Asynchronous Endpoints"),
    ("Static Asset & SPA Route Handler", "Fallback Single-Port Unified Hosting"),
    ("Pydantic Validation & Security", "Strict Geotechnical Range Sanitization"),
    ("Alert & SOP Dispatcher Service", "Evacuation Protocols & Logging")
]
y_cursor = 39
for title, desc in s_items:
    item_box = patches.FancyBboxPatch((38, y_cursor - 4), 24, 7, boxstyle="round,pad=0.4", fc="#ffffff", ec="#86efac", lw=1)
    ax.add_patch(item_box)
    ax.text(50, y_cursor + 0.5, title, ha='center', va='center', fontweight='bold', color="#14532d", fontsize=8)
    ax.text(50, y_cursor - 2, desc, ha='center', va='center', color="#475569", fontsize=7)
    y_cursor -= 9.5

# Backend & ML Inference Engine
m_box = patches.FancyBboxPatch((68, 6), 28, 44, boxstyle="round,pad=0.8", fc="#fefce8", ec="#eab308", lw=1.5)
ax.add_patch(m_box)
ax.text(82, 46.5, "ML & Geomechanics Engine", ha='center', va='center', fontweight='bold', color="#854d0e", fontsize=10)
m_items = [
    ("Feature Engineering Pipeline", "Energy, Hydro, & Kinematic Proxies"),
    ("StandardScaler & Pipeline Transformer", "Serialized scikit-learn Artifact"),
    ("Calibrated Classifier", "Multiclass Hazard Probabilities"),
    ("SOP Decision Engine", "DGMS Standards & Safety Mitigations")
]
y_cursor = 39
for title, desc in m_items:
    item_box = patches.FancyBboxPatch((70, y_cursor - 4), 24, 7, boxstyle="round,pad=0.4", fc="#ffffff", ec="#fde047", lw=1)
    ax.add_patch(item_box)
    ax.text(82, y_cursor + 0.5, title, ha='center', va='center', fontweight='bold', color="#713f12", fontsize=8)
    ax.text(82, y_cursor - 2, desc, ha='center', va='center', color="#475569", fontsize=7)
    y_cursor -= 9.5

# Connection Arrows
ax.annotate("", xy=(36, 32), xytext=(32, 32), arrowprops=dict(arrowstyle="<->", color="#334155", lw=2))
ax.text(34, 34, "HTTP/JSON\nPort 8000", ha='center', va='center', fontsize=6.5, color="#334155", fontweight='bold')

ax.annotate("", xy=(68, 32), xytext=(64, 32), arrowprops=dict(arrowstyle="<->", color="#334155", lw=2))
ax.text(66, 34, "In-Memory\nJoblib Pipeline", ha='center', va='center', fontsize=6.5, color="#334155", fontweight='bold')

plt.tight_layout()
plt.savefig('paper/figures/fig1_system_architecture.png', dpi=300, bbox_inches='tight')
plt.close()

# --- FIGURE 2: Geotechnical Dataflow & Inference Pipeline ---
fig, ax = plt.subplots(figsize=(10, 4.2), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 45)
ax.axis('off')

ax.text(50, 41, "Geomechanical Feature Engineering & Inference Dataflow Pipeline", ha='center', va='center', fontsize=11, fontweight='bold', color="#0f172a")

steps = [
    ("Raw Geotechnical Inputs\n(10 Parameters)", "Slope Angle, Height, UCS, RQD/Spacing,\nWeathering, Rain, Water, Joint Dip, PGA", 11, "#e0f2fe", "#0284c7"),
    ("Domain Feature\nEngineering", "Energy Proxy: H·sin(θ)\nHydro Proxy: Rain·GW\nKinematic Proxy: Dip Index", 37, "#fef3c7", "#d97706"),
    ("Feature Standardisation\n& Transform", "StandardScaler z = (x - μ) / σ\nAligned feature vector d=13", 63, "#f3e8ff", "#9333ea"),
    ("Inference & Emergency\nCategorisation", "P(Class | x) via Softmax\nLow / Moderate / High Risk\nSOP Recommendation Output", 89, "#dcfce7", "#16a34a")
]

for title, desc, cx, bg, border in steps:
    b = patches.FancyBboxPatch((cx - 10, 8), 20, 26, boxstyle="round,pad=0.5", fc=bg, ec=border, lw=1.5)
    ax.add_patch(b)
    ax.text(cx, 28, title, ha='center', va='center', fontweight='bold', fontsize=8.5, color="#1e293b")
    ax.text(cx, 16, desc, ha='center', va='center', fontsize=7.2, color="#334155", linespacing=1.3)

# Connectors
for x in [21, 47, 73]:
    ax.annotate("", xy=(x + 6, 21), xytext=(x, 21), arrowprops=dict(arrowstyle="->", color="#475569", lw=2))

plt.tight_layout()
plt.savefig('paper/figures/fig2_dataflow_pipeline.png', dpi=300, bbox_inches='tight')
plt.close()

# --- FIGURE 3: Open-Pit Bench Geometry & Physics Visualizer Cross-Section ---
fig, ax = plt.subplots(figsize=(9, 4.5), dpi=300)
ax.set_facecolor('#0f172a')
fig.patch.set_facecolor('#0f172a')

# Bench coordinates
x_coords = [0,  15, 25, 45, 55, 75, 85, 100]
y_coords = [50, 50, 32, 32, 16, 16, 0,  0]
ax.plot(x_coords, y_coords, color='#94a3b8', lw=3)
ax.fill_between(x_coords, y_coords, -5, color='#1e293b', alpha=0.9)

# Water Table / Phreatic Line
x_water = [10, 25, 45, 55, 75, 85, 100]
y_water = [38, 26, 23, 11, 10, -2, -2]
ax.plot(x_water, y_water, color='#38bdf8', linestyle='--', lw=2, label='Phreatic Line (Groundwater Seepage)')

# Annotations
ax.text(7.5, 53, "Crest (Bench 1)", color='#f8fafc', fontsize=8.5, fontweight='bold', ha='center')
ax.text(20, 43, "Highwall Face\n(θ = 65°)", color='#fbbf24', fontsize=8, ha='center')
ax.text(35, 34, "Catch Berm (B_w = 6m)", color='#34d399', fontsize=8, fontweight='bold', ha='center')
ax.text(50, 26, "Bench 2 Face", color='#fbbf24', fontsize=8, ha='center')
ax.text(65, 18, "Haulage Road", color='#38bdf8', fontsize=8, fontweight='bold', ha='center')
ax.text(92, 3, "Pit Floor / Sump", color='#e2e8f0', fontsize=8, ha='center')

# Extensometer Crack Indicator
ax.plot([14, 14], [50, 55], color='#ef4444', lw=2)
ax.scatter([14], [55], color='#ef4444', s=60, zorder=5)
ax.text(14, 57, "Extensometer CRK-01\n(Active Dilatancy)", color='#f87171', fontsize=7.5, ha='center', fontweight='bold')

# Boulders and Trajectory
t_x = np.linspace(24, 34, 30)
t_y = 32 + 8 * np.sin(np.pi * (t_x - 24) / 10) - 0.2*(t_x - 24)**1.2
ax.plot(t_x, t_y, color='#f97316', linestyle=':', lw=2, label='Rockfall Parabolic Trajectory')
ax.scatter([34], [32.5], color='#f97316', s=80, zorder=6, label='Bouncing Boulder (m = 450 kg)')

# Mining Haul Truck Symbol
truck = patches.Rectangle((62, 16.5), 8, 4, fc='#eab308', ec='#facc15', lw=1.5)
ax.add_patch(truck)
ax.scatter([64, 68], [16.5, 16.5], color='#000000', s=45, zorder=5)
ax.text(66, 21.5, "CAT 777 Haul Truck", color='#fef08a', fontsize=7.5, ha='center')

ax.set_xlim(-2, 102)
ax.set_ylim(-4, 62)
ax.set_title("Open-Pit Multi-Bench Geometrical Profile, Catch Berms, and Trajectory Mechanics", color='#f8fafc', fontsize=10, pad=12)
ax.legend(loc='upper right', facecolor='#1e293b', edgecolor='#475569', labelcolor='#e2e8f0', fontsize=7.5)
ax.axis('off')

plt.tight_layout()
plt.savefig('paper/figures/fig3_openpit_cross_section.png', dpi=300, bbox_inches='tight')
plt.close()
print("Generated all 3 technical figures successfully in paper/figures/")
