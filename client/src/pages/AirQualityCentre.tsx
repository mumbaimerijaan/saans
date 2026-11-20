import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AQIReport } from '../types';
import { AqiBadge } from '../components/AqiBadge';
import { InteractiveMap } from '../components/InteractiveMap';
import {
  Activity,
  MapPin,
  Clock,
  Info,
  Calendar,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Compass,
  Sliders,
  ExternalLink
} from 'lucide-react';

const MUMBAI_NEIGHBOURHOODS = [
  { name: 'Bandra West', lat: 19.0596, lon: 72.8295 },
  { name: 'Kurla West', lat: 19.0657, lon: 72.8794 },
  { name: 'Dadar', lat: 19.0178, lon: 72.8478 },
  { name: 'Andheri East', lat: 19.1136, lon: 72.8697 },
  { name: 'Chembur', lat: 19.0622, lon: 72.8992 },
  { name: 'Worli', lat: 19.0166, lon: 72.8166 },
  { name: 'Colaba', lat: 18.9067, lon: 72.8147 },
  { name: 'Thane West', lat: 19.2183, lon: 72.9781 },
];

export const AirQualityCentre: React.FC = () => {
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState(MUMBAI_NEIGHBOURHOODS[0]);
  const [report, setReport] = useState<AQIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);

  const fetchAqi = async (neighbourhood = selectedNeighbourhood) => {
    setRefreshing(true);
    try {
      const data = await api.getCurrentAirQuality(
        neighbourhood.lat,
        neighbourhood.lon,
        'Mumbai',
        neighbourhood.name
      );
      setReport(data);
    } catch (err) {
      console.error('Error fetching air quality:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAqi(selectedNeighbourhood);
  }, [selectedNeighbourhood]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const customNeighbourhood = {
          name: 'My Current Location',
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lon: parseFloat(pos.coords.longitude.toFixed(4)),
        };
        setSelectedNeighbourhood(customNeighbourhood);
        setGeoLocating(false);
      },
      err => {
        console.warn('Geolocation denied or failed:', err);
        setGeoLocating(false);
        alert('Could not retrieve your location. Falling back to Bandra West.');
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Location Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">
              <Activity className="w-3.5 h-3.5" />
              Air Quality Intelligence Centre
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              Real-Time Atmospheric Monitoring & Forecasts
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Strictly computed with official CPCB National Air Quality Index 24h breakpoints.
            </p>
          </div>

          {/* Location & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedNeighbourhood.name}
              aria-label="Select neighbourhood for air quality monitoring"
              onChange={e => {
                const found = MUMBAI_NEIGHBOURHOODS.find(n => n.name === e.target.value);
                if (found) setSelectedNeighbourhood(found);
              }}
              className="bg-[#11181c] border border-slate-700 text-slate-200 text-xs font-medium rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            >
              {MUMBAI_NEIGHBOURHOODS.map(n => (
                <option key={n.name} value={n.name}>{n.name}, Mumbai</option>
              ))}
            </select>

            <button
              onClick={handleUseMyLocation}
              disabled={geoLocating}
              aria-label="Detect my current coordinates with browser geolocation"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Detect my current coordinates"
            >
              <Compass className={`w-3.5 h-3.5 text-teal-400 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Locating...' : 'Use Geolocation'}</span>
            </button>

            <button
              onClick={() => fetchAqi(selectedNeighbourhood)}
              disabled={refreshing}
              aria-label="Refresh live air quality data"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* PRIMARY OVERVIEW BANNER */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-400 mb-3" />
            <p className="text-sm">Fetching live atmospheric sensor telemetry...</p>
          </div>
        ) : report ? (
          <>
            <div className="rounded-2xl bg-gradient-to-r from-[#11181c] via-[#142024] to-[#11181c] border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* AQI Score & Dominant Pollutant */}
                <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <span className="font-semibold text-slate-200">{report.neighbourhood || report.city}</span>
                    <span>&bull;</span>
                    <span>{new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex items-baseline gap-3 my-2">
                    <span className="text-5xl sm:text-6xl font-black text-white font-display">
                      {report.indianAqi.index ?? 'N/A'}
                    </span>
                    <div>
                      <div className="text-xs uppercase font-extrabold text-teal-400 tracking-wider">
                        CPCB Indian AQI
                      </div>
                      <div className="text-xs text-slate-400">
                        Category: <strong className="text-white">{report.indianAqi.category}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400">Dominant Pollutant:</span>{' '}
                    <strong className="text-amber-300 font-bold">{report.indianAqi.dominantPollutant || 'PM2.5'}</strong>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Fine respirable particles easily penetrate deep into lung alveolar tissue. N95 respirators recommended outdoors.
                    </p>
                  </div>
                </div>

                {/* Individual Pollutants Breakdown */}
                <div className="lg:col-span-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Standard Pollutant Concentrations & Breakpoint Sub-Indices
                    </h3>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">Unit: µg/m³ (CO: mg/m³)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.values(report.pollutants).map(p => (
                      <div key={p.code} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="font-bold text-slate-200">{p.name.split('(')[0]}</span>
                          <span className="text-[10px] text-teal-400 font-mono">{p.code.toUpperCase()}</span>
                        </div>
                        <div className="text-xl font-black text-white font-display">
                          {p.concentration} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">CPCB Sub-Index:</span>
                          <strong className="text-slate-200 font-mono">{p.subIndex ?? 'N/A'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Category: <span className="text-slate-300 font-medium">{p.category || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Attribution and Methodology Note */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>
                    Provider: <strong>{report.sourceAttribution.primaryProvider}</strong> ({report.sourceAttribution.modelOrStationName})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {report.foreignIndices.note}
                </div>
              </div>
            </div>

            {/* 24-HOUR HOURLY FORECAST CHART / LIST */}
            <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Next 24-Hour Atmospheric Forecast</h3>
                  <p className="text-xs text-slate-400">Predicted CPCB AQI trajectories based on ECMWF CAMS regional chemistry models.</p>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Hourly Updates
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex items-center gap-3 min-w-[700px]">
                  {report.hourlyForecast.slice(0, 12).map((item, idx) => {
                    const timeLabel = new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const aqiVal = item.predictedIndianAqi || 150;
                    return (
                      <div
                        key={idx}
                        className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-between min-w-[90px]"
                      >
                        <div className="text-xs font-semibold text-slate-400 mb-1">{timeLabel}</div>
                        <div className="my-1">
                          <AqiBadge aqi={aqiVal} size="sm" showCategory={false} />
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1 font-mono font-bold">
                          {aqiVal}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          PM2.5: {Math.round(item.pm25)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GROUND SENSOR STATIONS & MAP */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">CPCB CAAQMS Geographic Reference Grid</h3>
                  <p className="text-xs text-slate-400">Micro-climate spatial interpolations anchored to official CPCB/MPCB station coordinates.</p>
                </div>
                <span className="text-[10px] font-bold uppercase bg-slate-800 text-teal-400 px-2.5 py-1 rounded-full border border-slate-700">
                  Spatial Model Grid (CPCB Anchored)
                </span>
              </div>

              {/* Data Provenance Transparency Note */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-slate-200">Scientific Provenance Notice:</strong> Overall AQI is calculated strictly following official CPCB Indian National AQI 24h breakpoint equations using live Open-Meteo atmospheric telemetry. Station values represent calibrated spatial micro-climate estimates for each ward, not raw direct hardware sensors. For statutory regulatory enforcement, consult official CAAQMS telemetry at <a href="https://cpcb.nic.in" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline">cpcb.nic.in</a>.
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stations List */}
                <div className="space-y-3">
                  {report.nearbyStations.map(station => (
                    <div
                      key={station.id}
                      className="p-4 rounded-xl bg-[#11181c] border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{station.name}</span>
                        <span className="text-[11px] text-teal-400 font-medium">{station.distanceKm} km</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mb-2">
                        {station.provenance || 'Spatial micro-climate estimate calibrated to CPCB coordinates'}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-center text-[11px]">
                        <div className="p-1 rounded bg-slate-900">
                          <div className="text-slate-400">PM2.5</div>
                          <div className="font-bold text-white">{station.measurements.pm2_5 || '—'}</div>
                        </div>
                        <div className="p-1 rounded bg-slate-900">
                          <div className="text-slate-400">PM10</div>
                          <div className="font-bold text-white">{station.measurements.pm10 || '—'}</div>
                        </div>
                        <div className="p-1 rounded bg-slate-900">
                          <div className="text-slate-400">NO2</div>
                          <div className="font-bold text-white">{station.measurements.no2 || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stations Map */}
                <div className="lg:col-span-2">
                  <InteractiveMap
                    center={[selectedNeighbourhood.lat, selectedNeighbourhood.lon]}
                    zoom={12}
                    height="320px"
                  />
                </div>

              </div>
            </div>

          </>
        ) : null}

      </div>
    </div>
  );
};
