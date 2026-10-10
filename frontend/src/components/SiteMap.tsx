import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  label?: string | null;
  risk?: string | null;
  onLocationSelect?: (lat: number, lng: number) => void;
}

const REGIONAL_HOTSPOTS = [
  { name: "🏔️ Manali NH-3 (HP)", lat: 32.2396, lng: 77.1887 },
  { name: "⛰️ Rishikesh NH-58 (UK)", lat: 30.1384, lng: 78.3216 },
  { name: "🧗 Western Ghats (MH)", lat: 19.3412, lng: 73.7845 },
  { name: "🚗 Ramban NH-44 (J&K)", lat: 33.2458, lng: 75.2413 },
];

function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
      }
    },
  });
  return null;
}

export function SiteMap({ latitude, longitude, label, risk, onLocationSelect }: Props) {
  const [tileError, setTileError] = useState(false);
  const hasPoint = latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const center: LatLngExpression = hasPoint ? [latitude, longitude] : [31.1, 77.2];
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const notice = useMemo(() => {
    if (tileError) return "Map tiles could not be loaded. Location values are still recorded with the assessment.";
    if (!hasPoint) return "Click anywhere on the map or enter coordinates in the form to set slope location.";
    return null;
  }, [hasPoint, tileError]);

  return (
    <section className="panel map-panel">
      <div className="panel-head">
        <div>
          <h3>Geographical Slope GIS Context</h3>
          <p className="map-hint">
            {hasPoint
              ? `Selected site: ${latitude?.toFixed(4)}°N, ${longitude?.toFixed(4)}°E (Click map to pin)`
              : "Click on the map or choose a mountain hotspot below"}
          </p>
        </div>
      </div>

      <div className="map-hotspots-row">
        <span className="hotspot-label">Quick Jump:</span>
        {REGIONAL_HOTSPOTS.map((spot) => (
          <button
            key={spot.name}
            type="button"
            className="hotspot-chip"
            onClick={() => onLocationSelect?.(spot.lat, spot.lng)}
          >
            {spot.name}
          </button>
        ))}
      </div>

      {notice ? <p className="muted">{notice}</p> : null}
      <div className="map-wrap">
        <MapContainer center={center} zoom={hasPoint ? 10 : 5} scrollWheelZoom={false} className="map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={tileUrl}
            eventHandlers={{ tileerror: () => setTileError(true) }}
          />
          <RecenterMap center={center} />
          {onLocationSelect ? <MapClickHandler onLocationSelect={onLocationSelect} /> : null}
          {hasPoint ? (
            <Marker position={center} icon={defaultIcon}>
              <Popup>
                <strong>{label || "Assessed Slope"}</strong>
                <br />
                Coordinates: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                {risk ? (
                  <div>
                    Risk Category: <strong>{risk}</strong>
                  </div>
                ) : null}
              </Popup>
            </Marker>
          ) : null}
        </MapContainer>
      </div>
    </section>
  );
}
