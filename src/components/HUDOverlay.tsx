import React from 'react';
import { CameraConfig, FlightState, TerrainConfig, Waypoint } from '../types';
import { THEMES } from '../utils/terrainGenerator';
import { AlertTriangle, Compass, Navigation, Radio, Target } from 'lucide-react';

interface HUDOverlayProps {
  flightState: FlightState;
  cameraConfig: CameraConfig;
  terrainConfig: TerrainConfig;
  waypoints: Waypoint[];
  activeWaypoint: Waypoint | null;
  onSelectWaypoint: (wp: Waypoint) => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  flightState,
  cameraConfig,
  terrainConfig,
  waypoints,
  activeWaypoint,
  onSelectWaypoint,
}) => {
  const theme = THEMES[terrainConfig.colorTheme];
  const { yaw, pitch, roll, speed, altitudeMSL, altitudeAGL, climbRate, gForce, lat, lon, autopilot } = flightState;

  // Formatting coordinates
  const latFormatted = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonFormatted = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;

  // Compass Heading points
  const headingInt = Math.round(yaw) % 360;
  const compassTicks: { deg: number; label: string }[] = [];
  for (let i = 0; i < 360; i += 15) {
    let label = `${i.toString().padStart(3, '0')}`;
    if (i === 0) label = 'N';
    else if (i === 45) label = 'NE';
    else if (i === 90) label = 'E';
    else if (i === 135) label = 'SE';
    else if (i === 180) label = 'S';
    else if (i === 225) label = 'SW';
    else if (i === 270) label = 'W';
    else if (i === 315) label = 'NW';
    compassTicks.push({ deg: i, label });
  }

  // Active waypoint angle relative to aircraft
  let targetBearing = 0;
  let targetDistance = 0;
  if (activeWaypoint) {
    const dx = activeWaypoint.x - flightState.x;
    const dz = activeWaypoint.z - flightState.z;
    const rad = Math.atan2(dx, -dz);
    targetBearing = ((THREE_Math_radToDeg(rad) + 360) % 360);
    targetDistance = Math.sqrt(dx * dx + dz * dz) * 0.005; // in nautical miles
  }

  function THREE_Math_radToDeg(rad: number) {
    return (rad * 180) / Math.PI;
  }

  const isLowAltitude = altitudeAGL < 400 && flightState.speed > 50;

  return (
    <div id="hud-overlay-root" className="pointer-events-none absolute inset-0 select-none overflow-hidden text-xs font-tech">
      
      {/* 1. TOP COMPASS & HEADING TAPE */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center w-[360px] md:w-[480px]">
        {/* Current Heading Box */}
        <div className="flex items-center gap-1.5 px-3 py-0.5 bg-[#0011fe]/80 border border-[#2ca801] rounded-xs shadow-md">
          <Compass className="w-3.5 h-3.5 text-[#2ca801] animate-pulse" />
          <span className="text-[#ffe600] font-bold text-sm tracking-widest font-mono">
            HDG {headingInt.toString().padStart(3, '0')}°
          </span>
        </div>

        {/* Sliding Ribbon */}
        <div className="relative w-full h-8 mt-1 border-b border-[#2ca801]/60 overflow-hidden bg-gradient-to-b from-transparent to-[#0011fe]/40">
          {/* Center needle */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#ffe600] z-10 shadow-[0_0_8px_#ffe600]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-6 border-t-[#ffe600] z-10" />

          {/* Compass labels strip */}
          <div
            className="absolute top-1 flex items-end h-6 transition-transform duration-75 ease-linear"
            style={{
              transform: `translateX(calc(50% - ${(yaw / 360) * 1440}px))`,
              width: '2880px', // 2 loops for continuous wrap
            }}
          >
            {[...compassTicks, ...compassTicks].map((tick, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-end"
                style={{ width: '60px' }}
              >
                <span className={`text-[10px] font-bold ${tick.deg % 90 === 0 ? 'text-[#ffe600]' : 'text-[#eefbf4]/90'}`}>
                  {tick.label}
                </span>
                <div className={`w-0.5 ${tick.deg % 45 === 0 ? 'h-3 bg-[#2ca801]' : 'h-1.5 bg-[#2ca801]/50'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CENTER FLIGHT HUD / PITCH LADDER (In Cockpit / Chase Mode) */}
      {cameraConfig.mode !== 'topdown' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Rotating Horizon / Pitch Ladder */}
          <div
            className="relative w-64 h-64 flex items-center justify-center transition-transform duration-75 ease-linear"
            style={{
              transform: `rotate(${-roll}deg) translateY(${pitch * 2.2}px)`,
            }}
          >
            {/* Pitch Rungs */}
            {[-30, -20, -10, 0, 10, 20, 30].map((deg) => (
              <div
                key={deg}
                className="absolute flex items-center justify-between w-48 text-[9px] text-[#2ca801]/80 font-mono"
                style={{
                  top: `calc(50% - ${deg * 3.2}px)`,
                  transform: 'translateY(-50%)',
                }}
              >
                <div className="flex items-center gap-1">
                  <span>{deg !== 0 ? Math.abs(deg) : ''}</span>
                  <div className={`h-0.5 ${deg === 0 ? 'w-14 bg-[#2ca801]' : deg > 0 ? 'w-8 bg-[#2ca801]/70' : 'w-8 border-t border-dashed border-[#2ca801]/70'}`} />
                </div>
                {deg === 0 && (
                  <div className="w-8 h-8 rounded-full border border-[#2ca801]/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2ca801]" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <div className={`h-0.5 ${deg === 0 ? 'w-14 bg-[#2ca801]' : deg > 0 ? 'w-8 bg-[#2ca801]/70' : 'w-8 border-t border-dashed border-[#2ca801]/70'}`} />
                  <span>{deg !== 0 ? Math.abs(deg) : ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Fixed Boresight Crosshair */}
          <div className="absolute flex items-center justify-center pointer-events-none">
            {/* Crosshair lines */}
            <div className="w-12 h-12 border border-[#ffe600]/40 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-[#ffe600] rounded-full shadow-[0_0_6px_#ffe600]" />
            </div>
            <div className="absolute w-20 h-0.5 bg-[#ffe600]/30 -z-10" />
            <div className="absolute h-20 w-0.5 bg-[#ffe600]/30 -z-10" />
          </div>

          {/* Target Waypoint Lock Reticle */}
          {activeWaypoint && (
            <div className="absolute -translate-y-16 flex flex-col items-center">
              <div className="border-2 border-[#c45eec] px-2 py-0.5 rounded-xs bg-[#0011fe]/60 shadow-[0_0_10px_rgba(196,94,236,0.5)] flex items-center gap-1 animate-pulse">
                <Target className="w-3.5 h-3.5 text-[#c45eec]" />
                <span className="text-[#c45eec] font-bold tracking-wider">
                  TGT: {activeWaypoint.name} [{targetDistance.toFixed(1)} NM]
                </span>
              </div>
            </div>
          )}

          {/* Low Altitude Warning */}
          {isLowAltitude && (
            <div className="absolute bottom-24 flex items-center gap-2 px-4 py-1.5 bg-red-600/90 border-2 border-yellow-300 text-yellow-100 font-bold text-sm tracking-widest animate-retro-blink rounded-xs shadow-[0_0_15px_red]">
              <AlertTriangle className="w-4 h-4 text-yellow-300" />
              <span>TERRAIN AHEAD - PULL UP</span>
            </div>
          )}
        </div>
      )}

      {/* 3. LEFT TELEMETRY & GIS POSITION PANEL (Matching Reference GIF layout) */}
      <div className="absolute top-16 left-3 w-56 md:w-64 flex flex-col gap-2 pointer-events-auto">
        {/* Position & Coordinates Frame */}
        <div className="p-2.5 bg-[#0011fe]/85 border border-[#2ca801] rounded-xs shadow-lg backdrop-blur-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#2ca801]/40">
            <span className="text-[#ffe600] font-bold tracking-wider text-[11px] flex items-center gap-1">
              <Navigation className="w-3 h-3 text-[#2ca801]" /> POSITION
            </span>
            <span className="text-[10px] text-[#2ca801] font-mono">SYS.01</span>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div>
              <span className="text-[#2ca801]/80 block text-[9px]">LATITUDE X</span>
              <span className="text-[#eefbf4] font-mono font-bold">{latFormatted}</span>
            </div>
            <div>
              <span className="text-[#2ca801]/80 block text-[9px]">LONGITUDE Y</span>
              <span className="text-[#eefbf4] font-mono font-bold">{lonFormatted}</span>
            </div>
          </div>
        </div>

        {/* Altitude & Flight Parameters */}
        <div className="p-2.5 bg-[#0011fe]/85 border border-[#2ca801] rounded-xs shadow-lg backdrop-blur-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#2ca801]/40">
            <span className="text-[#ffe600] font-bold tracking-wider text-[11px]">
              ALTITUDE &amp; SPEED
            </span>
            {autopilot && (
              <span className="px-1.5 py-0.2 bg-[#2ca801] text-[#0011fe] font-bold text-[9px] rounded-xs animate-pulse">
                AUTO
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#2ca801]/80">ALT (MSL):</span>
              <span className="text-[#eefbf4] font-mono font-bold">{altitudeMSL.toLocaleString()} FT</span>
            </div>
            
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#2ca801]/80">CLEARANCE (AGL):</span>
              <span className={`font-mono font-bold ${altitudeAGL < 400 ? 'text-red-400 animate-pulse' : 'text-[#eefbf4]'}`}>
                {altitudeAGL.toLocaleString()} FT
              </span>
            </div>

            {/* Altitude Bar */}
            <div className="w-full bg-[#000a30] h-1.5 rounded-full overflow-hidden border border-[#2ca801]/40">
              <div
                className="h-full bg-gradient-to-r from-[#2ca801] to-[#ffe600] transition-all duration-100"
                style={{ width: `${Math.min(100, (altitudeAGL / 3000) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2ca801]/20">
              <div>
                <span className="text-[#2ca801]/80 block text-[9px]">AIRSPEED</span>
                <span className="text-[#eefbf4] font-mono font-bold">{Math.round(speed)} KTS</span>
              </div>
              <div>
                <span className="text-[#2ca801]/80 block text-[9px]">CLIMB (VVI)</span>
                <span className="text-[#eefbf4] font-mono font-bold">
                  {climbRate >= 0 ? `+${climbRate}` : climbRate} FPM
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 text-[10px] text-[#2ca801]/70">
              <span>G-FORCE: {gForce.toFixed(1)} G</span>
              <span>PITCH: {Math.round(pitch)}°</span>
              <span>ROLL: {Math.round(roll)}°</span>
            </div>
          </div>
        </div>

        {/* Tactical Mini-Radar Display */}
        <div className="p-2 bg-[#0011fe]/85 border border-[#2ca801] rounded-xs shadow-lg backdrop-blur-xs">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#2ca801]/30">
            <span className="text-[#ffe600] font-bold text-[10px] flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#2ca801]" /> 2D RADAR SWEEP
            </span>
            <span className="text-[9px] text-[#2ca801]">RANGE 5NM</span>
          </div>

          <div className="relative w-full h-32 bg-[#000d54] border border-[#2ca801]/50 rounded-xs flex items-center justify-center overflow-hidden">
            {/* Concentric Radar Rings */}
            <div className="absolute w-24 h-24 rounded-full border border-[#2ca801]/30" />
            <div className="absolute w-16 h-16 rounded-full border border-[#2ca801]/40" />
            <div className="absolute w-8 h-8 rounded-full border border-[#2ca801]/50" />
            
            {/* Radar Crosshairs */}
            <div className="absolute w-full h-px bg-[#2ca801]/25" />
            <div className="absolute h-full w-px bg-[#2ca801]/25" />

            {/* Rotating Radar Sweep Line */}
            <div className="absolute inset-0 animate-radar-sweep flex items-center justify-center pointer-events-none">
              <div className="w-1/2 h-full bg-gradient-to-l from-[#2ca801]/30 via-[#2ca801]/10 to-transparent origin-right clip-path-radar" />
            </div>

            {/* Aircraft Position Indicator */}
            <div
              className="absolute w-3 h-3 flex items-center justify-center transition-transform duration-75"
              style={{ transform: `rotate(${yaw}deg)` }}
            >
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-[#ffe600]" />
            </div>

            {/* Waypoint Blips on Radar */}
            {waypoints.map((wp) => {
              const dx = (wp.x - flightState.x) * 0.04;
              const dz = (wp.z - flightState.z) * 0.04;
              const isSelected = activeWaypoint?.id === wp.id;

              if (Math.abs(dx) > 55 || Math.abs(dz) > 55) return null;

              return (
                <button
                  key={wp.id}
                  onClick={() => onSelectWaypoint(wp)}
                  className="absolute pointer-events-auto cursor-pointer group"
                  style={{
                    left: `calc(50% + ${dx}px - 4px)`,
                    top: `calc(50% + ${dz}px - 4px)`,
                  }}
                  title={wp.name}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full border ${
                      isSelected
                        ? 'bg-[#c45eec] border-[#ffffff] animate-ping'
                        : 'bg-[#2ca801] border-[#eefbf4]'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between px-3 py-1 bg-[#0011fe]/90 border border-[#2ca801] rounded-xs text-[10px] text-[#eefbf4] backdrop-blur-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2ca801] animate-pulse" />
            <span>GEO-RADAR ACTIVE</span>
          </span>
          <span className="text-[#2ca801]">|</span>
          <span>FPS: 60</span>
          <span className="text-[#2ca801]">|</span>
          <span>TIME: {Math.floor(flightState.time / 60)}:{(Math.floor(flightState.time) % 60).toString().padStart(2, '0')}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#ffe600]">PRESET: {terrainConfig.preset.toUpperCase()}</span>
          <span className="text-[#2ca801]">|</span>
          <span>MODE: {terrainConfig.wireframeMode.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
