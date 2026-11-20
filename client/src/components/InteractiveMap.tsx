import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Facility, Equipment, CommunityReport } from '../types';
import { Layers, MapPin, Wind, Navigation, ShieldCheck, AlertTriangle } from 'lucide-react';

interface InteractiveMapProps {
  facilities?: Facility[];
  equipment?: Equipment[];
  reports?: CommunityReport[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onSelectFacility?: (f: Facility) => void;
  onSelectEquipment?: (e: Equipment) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  facilities = [],
  equipment = [],
  reports = [],
  center = [19.0760, 72.8777], // Mumbai Center
  zoom = 12,
  height = '500px',
  onSelectFacility,
  onSelectEquipment,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayers, setActiveLayers] = useState<{
    facilities: boolean;
    equipment: boolean;
    reports: boolean;
    stations: boolean;
  }>({
    facilities: true,
    equipment: true,
    reports: true,
    stations: true,
  });

  // Mumbai Regional Micro-Climate Spatial Reference Grids (Model-Derived)
  const groundStations = [
    { name: 'Bandra Kalanagar Grid Reference', lat: 19.0607, lon: 72.8480, dominant: 'PM2.5 (Modelled)' },
    { name: 'Kurla CST Industrial Corridor Grid', lat: 19.0726, lon: 72.8845, dominant: 'PM2.5 (Modelled)' },
    { name: 'Worli Coastal Boundary Reference Grid', lat: 19.0166, lon: 72.8166, dominant: 'Ozone (Modelled)' },
    { name: 'Andheri East Urban Transit Grid', lat: 19.1158, lon: 72.8654, dominant: 'PM2.5 (Modelled)' },
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever data or active filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // Helper for custom colored icons
    const createPinIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: 2px solid #ffffff;">
            ${label}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });
    };

    // 1. Clean Air Facilities (Teal)
    if (activeLayers.facilities) {
      facilities.forEach(f => {
        const marker = L.marker([f.latitude, f.longitude], {
          icon: createPinIcon('#0d9488', '🏥'),
        });

        const popupContent = `
          <div style="padding: 4px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #0d9488; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">VERIFIED FACILITY</span>
              <span style="font-size: 11px; color: #94a3b8;">${f.facility_type.replace('_', ' ')}</span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #f8fafc;">${f.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #cbd5e1;">${f.address}</p>
            <div style="font-size: 11px; color: #34d399; margin-bottom: 6px;">💨 ${f.filtration_equipment_details}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 6px; font-size: 11px;">
              <span style="color: #94a3b8;">Cap: ${f.capacity} people</span>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}" target="_blank" rel="noopener noreferrer" style="color: #14b8a6; text-decoration: none; font-weight: bold;">Directions ↗</a>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 2. Equipment (Green)
    if (activeLayers.equipment) {
      equipment.forEach(e => {
        if (!e.latitude || !e.longitude) return;
        const marker = L.marker([e.latitude, e.longitude], {
          icon: createPinIcon('#10b981', '📦'),
        });

        const popupContent = `
          <div style="padding: 4px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${e.type.toUpperCase()}</span>
              <span style="font-size: 11px; color: #94a3b8;">${e.category.replace('_', ' ')}</span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #f8fafc;">${e.name}</h4>
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #cbd5e1;">${e.location_neighbourhood}</p>
            ${e.cadr_rating ? `<div style="font-size: 11px; color: #34d399; margin-bottom: 4px;">CADR: ${e.cadr_rating} m³/h</div>` : ''}
            <div style="color: #94a3b8; font-size: 10px;">Status: <strong style="color: #34d399;">${e.status}</strong></div>
          </div>
        `;
        marker.bindPopup(popupContent);
        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 3. Community Reports (Amber/Red)
    if (activeLayers.reports) {
      reports.forEach(r => {
        const marker = L.marker([r.latitude, r.longitude], {
          icon: createPinIcon(r.status === 'verified' ? '#f59e0b' : '#ef4444', '⚠️'),
        });

        const popupContent = `
          <div style="padding: 4px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #f59e0b; color: black; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">INCIDENT REPORT</span>
              <span style="font-size: 11px; color: #94a3b8;">${r.category.replace('_', ' ')}</span>
            </div>
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #f8fafc;">${r.description}</p>
            <div style="font-size: 11px; color: #94a3b8;">📍 ${r.neighbourhood}</div>
            ${r.resolutionNotes ? `<div style="font-size: 11px; color: #38bdf8; margin-top: 4px;">Action: ${r.resolutionNotes}</div>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 4. Ground Monitoring Stations (Purple)
    if (activeLayers.stations) {
      groundStations.forEach(s => {
        const marker = L.marker([s.lat, s.lon], {
          icon: createPinIcon('#8b5cf6', '📡'),
        });

        const popupContent = `
          <div style="padding: 4px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #6366f1; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">SPATIAL MODEL GRID</span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #f8fafc;">${s.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 10px; color: #94a3b8;">High-resolution micro-climate spatial dispersion estimate. Not raw direct sensor telemetry.</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">Micro-Climate Anchor</span>
              <span style="font-size: 11px; color: #cbd5e1;">Dominant: ${s.dominant}</span>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        layerGroupRef.current?.addLayer(marker);
      });
    }
  }, [facilities, equipment, reports, activeLayers]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl" style={{ height }}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Layer Control Bar */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#11181c]/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-xs space-y-1.5 max-w-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          Map Layers
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={activeLayers.facilities}
            onChange={e => setActiveLayers(prev => ({ ...prev, facilities: e.target.checked }))}
            className="rounded border-slate-700 text-teal-500 focus:ring-0"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
          Clean Air Sanctuaries ({facilities.length})
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={activeLayers.equipment}
            onChange={e => setActiveLayers(prev => ({ ...prev, equipment: e.target.checked }))}
            className="rounded border-slate-700 text-emerald-500 focus:ring-0"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Shared Equipment ({equipment.length})
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={activeLayers.reports}
            onChange={e => setActiveLayers(prev => ({ ...prev, reports: e.target.checked }))}
            className="rounded border-slate-700 text-amber-500 focus:ring-0"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Pollution Incidents ({reports.length})
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={activeLayers.stations}
            onChange={e => setActiveLayers(prev => ({ ...prev, stations: e.target.checked }))}
            className="rounded border-slate-700 text-purple-500 focus:ring-0"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          Micro-Climate Spatial Grids (4)
        </label>
      </div>

      {/* Recenter Button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(center, zoom, { duration: 1.2 });
          }
        }}
        className="absolute bottom-4 left-4 z-[1000] bg-[#162024]/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all"
        title="Reset map view to Mumbai"
      >
        <Navigation className="w-3.5 h-3.5 text-teal-400" />
        Reset to Mumbai
      </button>
    </div>
  );
};
