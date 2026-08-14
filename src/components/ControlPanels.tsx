import React, { useState } from 'react';
import { CameraConfig, ColorTheme, FlightState, TerrainConfig, TerrainPreset, ViewMode, Waypoint, WireframeMode } from '../types';
import { THEMES } from '../utils/terrainGenerator';
import { audioSynth } from '../utils/audioSynth';
import {
  Camera,
  Compass,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Mountain,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Tv,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

interface ControlPanelsProps {
  flightState: FlightState;
  onUpdateFlightState: (updater: (prev: FlightState) => FlightState) => void;
  cameraConfig: CameraConfig;
  onChangeCameraConfig: (updater: (prev: CameraConfig) => CameraConfig) => void;
  terrainConfig: TerrainConfig;
  onChangeTerrainConfig: (updater: (prev: TerrainConfig) => TerrainConfig) => void;
  waypoints: Waypoint[];
  activeWaypoint: Waypoint | null;
  onSelectWaypoint: (wp: Waypoint) => void;
  showCrt: boolean;
  onToggleCrt: () => void;
  showRefModal: boolean;
  onToggleRefModal: () => void;
}

export const ControlPanels: React.FC<ControlPanelsProps> = ({
  flightState,
  onUpdateFlightState,
  cameraConfig,
  onChangeCameraConfig,
  terrainConfig,
  onChangeTerrainConfig,
  waypoints,
  activeWaypoint,
  onSelectWaypoint,
  showCrt,
  onToggleCrt,
  showRefModal,
  onToggleRefModal,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(audioSynth.getMuted());
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'terrain' | 'flight'>('camera');

  const theme = THEMES[terrainConfig.colorTheme];

  const handleToggleAudio = () => {
    const unmuted = audioSynth.toggleMute();
    setIsAudioMuted(!unmuted);
    if (unmuted) {
      audioSynth.startEngine();
      audioSynth.playClick();
    }
  };

  const handlePresetChange = (preset: TerrainPreset) => {
    audioSynth.playClick();
    onChangeTerrainConfig((prev) => ({ ...prev, preset }));
  };

  const handleWireframeModeChange = (mode: WireframeMode) => {
    audioSynth.playClick();
    onChangeTerrainConfig((prev) => ({ ...prev, wireframeMode: mode }));
  };

  const handleThemeChange = (colorTheme: ColorTheme) => {
    audioSynth.playClick();
    onChangeTerrainConfig((prev) => ({ ...prev, colorTheme }));
  };

  const handleViewModeChange = (mode: ViewMode) => {
    audioSynth.playClick();
    onChangeCameraConfig((prev) => ({ ...prev, mode }));
  };

  const handleAutopilotToggle = (mode?: FlightState['autopilotMode']) => {
    audioSynth.playClick();
    onUpdateFlightState((prev) => ({
      ...prev,
      autopilot: mode ? true : !prev.autopilot,
      autopilotMode: mode || prev.autopilotMode,
    }));
  };

  const handleResetFlight = () => {
    audioSynth.playClick();
    onUpdateFlightState((prev) => ({
      ...prev,
      x: 0,
      y: 60,
      z: 0,
      pitch: 0,
      roll: 0,
      yaw: 0,
      speed: 160,
      throttle: 60,
      climbRate: 0,
    }));
  };

  return (
    <>
      {/* TOP HEADER CONTROLS BAR */}
      <header className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0011fe]/90 border border-[#2ca801] rounded-xs shadow-md">
            <Sparkles className="w-4 h-4 text-[#ffe600] animate-spin" />
            <h1 className="text-sm font-bold tracking-wider text-[#eefbf4] font-tech uppercase">
              Retro 3D Wireframe Flight Simulator
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Compare Reference GIF Button */}
          <button
            id="toggle-reference-gif-btn"
            onClick={() => {
              audioSynth.playClick();
              onToggleRefModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0011fe]/90 border border-[#c45eec] hover:bg-[#c45eec]/20 text-[#c45eec] text-xs font-bold rounded-xs transition-all cursor-pointer shadow-md"
            title="Compare with Reference GIF"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>ORIGINAL GIF REF</span>
          </button>

          {/* CRT Scanline Toggle */}
          <button
            id="toggle-crt-effect-btn"
            onClick={() => {
              audioSynth.playClick();
              onToggleCrt();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xs border transition-all cursor-pointer shadow-md ${
              showCrt
                ? 'bg-[#2ca801]/30 border-[#2ca801] text-[#eefbf4]'
                : 'bg-[#0011fe]/90 border-[#2ca801]/40 text-[#2ca801]/60'
            }`}
            title="Toggle CRT Scanlines & Screen Curvature"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CRT {showCrt ? 'ON' : 'OFF'}</span>
          </button>

          {/* Audio Sound FX Toggle */}
          <button
            id="toggle-sound-effects-btn"
            onClick={handleToggleAudio}
            className={`p-1.5 rounded-xs border transition-all cursor-pointer shadow-md ${
              !isAudioMuted
                ? 'bg-[#ffe600]/20 border-[#ffe600] text-[#ffe600]'
                : 'bg-[#0011fe]/90 border-[#2ca801]/40 text-[#2ca801]/60'
            }`}
            title={isAudioMuted ? 'Unmute Flight Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* RIGHT VIEW & CAMERA CONTROL PANEL (Matching Reference GIF "Views 3D", "Camera", "FOV", "Zoom") */}
      <aside className="absolute top-16 right-3 w-64 md:w-72 flex flex-col gap-2 pointer-events-auto z-30">
        <div className="bg-[#0011fe]/90 border border-[#2ca801] rounded-xs shadow-xl backdrop-blur-xs overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#000d54] border-b border-[#2ca801]/50">
            <span className="text-[#ffe600] font-bold text-xs flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#2ca801]" /> VIEWS 3D &amp; RENDER
            </span>
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="text-[#2ca801] hover:text-[#ffe600] cursor-pointer"
            >
              {isPanelCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isPanelCollapsed && (
            <div className="p-3 space-y-3 text-xs font-tech">
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#000a30] border border-[#2ca801]/30 rounded-xs">
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`py-1 text-[11px] font-bold rounded-xs cursor-pointer transition-colors ${
                    activeTab === 'camera'
                      ? 'bg-[#2ca801] text-[#0011fe]'
                      : 'text-[#eefbf4]/70 hover:text-[#eefbf4]'
                  }`}
                >
                  CAMERA
                </button>
                <button
                  onClick={() => setActiveTab('terrain')}
                  className={`py-1 text-[11px] font-bold rounded-xs cursor-pointer transition-colors ${
                    activeTab === 'terrain'
                      ? 'bg-[#2ca801] text-[#0011fe]'
                      : 'text-[#eefbf4]/70 hover:text-[#eefbf4]'
                  }`}
                >
                  TERRAIN
                </button>
                <button
                  onClick={() => setActiveTab('flight')}
                  className={`py-1 text-[11px] font-bold rounded-xs cursor-pointer transition-colors ${
                    activeTab === 'flight'
                      ? 'bg-[#2ca801] text-[#0011fe]'
                      : 'text-[#eefbf4]/70 hover:text-[#eefbf4]'
                  }`}
                >
                  FLIGHT
                </button>
              </div>

              {/* TAB 1: CAMERA & VIEWS */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[#2ca801]/90 font-bold block text-[10px] mb-1">
                      VIEW MODE
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'cockpit', label: '1. COCKPIT' },
                        { id: 'chase', label: '2. CHASE 3D' },
                        { id: 'orbit', label: '3. ORBIT FREE' },
                        { id: 'topdown', label: '4. TOP-DOWN 2D' },
                        { id: 'isometric', label: '5. ISOMETRIC' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleViewModeChange(v.id as ViewMode)}
                          className={`px-2 py-1 text-left rounded-xs text-[11px] font-bold border transition-all cursor-pointer ${
                            cameraConfig.mode === v.id
                              ? 'bg-[#ffe600] border-[#ffe600] text-[#0011fe]'
                              : 'bg-[#000d54] border-[#2ca801]/40 text-[#eefbf4] hover:border-[#2ca801]'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FOV Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#2ca801]/90">
                      <span>FOV: {cameraConfig.fov}°</span>
                      <span>[30° - 100°]</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={cameraConfig.fov}
                      onChange={(e) =>
                        onChangeCameraConfig((prev) => ({
                          ...prev,
                          fov: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#2ca801] cursor-pointer"
                    />
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#2ca801]/90">
                      <span>ZOOM: {cameraConfig.zoom.toFixed(1)}x</span>
                      <span>[0.5x - 3.0x]</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={cameraConfig.zoom}
                      onChange={(e) =>
                        onChangeCameraConfig((prev) => ({
                          ...prev,
                          zoom: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#ffe600] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: TERRAIN & SHADING */}
              {activeTab === 'terrain' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[#2ca801]/90 font-bold block text-[10px] mb-1">
                      LANDSCAPE PRESET
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'alpine', label: 'ALPINE RIDGE' },
                        { id: 'canyons', label: 'CANYON MAZE' },
                        { id: 'coastal', label: 'COASTAL GIS' },
                        { id: 'lunar', label: 'LUNAR CRATERS' },
                        { id: 'synth_wave', label: 'SYNTH WAVES' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handlePresetChange(p.id as TerrainPreset)}
                          className={`px-2 py-1 text-left rounded-xs text-[11px] font-bold border transition-all cursor-pointer ${
                            terrainConfig.preset === p.id
                              ? 'bg-[#2ca801] border-[#2ca801] text-[#0011fe]'
                              : 'bg-[#000d54] border-[#2ca801]/40 text-[#eefbf4] hover:border-[#2ca801]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wireframe Rendering Style */}
                  <div>
                    <span className="text-[#2ca801]/90 font-bold block text-[10px] mb-1">
                      WIREFRAME SHADING
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'shaded_wire', label: 'SHADED RELIEF' },
                        { id: 'wireframe', label: 'PURE WIRE' },
                        { id: 'hidden_line', label: 'HIDDEN LINE' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          onClick={() => handleWireframeModeChange(w.id as WireframeMode)}
                          className={`px-2 py-1 text-left rounded-xs text-[11px] font-bold border transition-all cursor-pointer ${
                            terrainConfig.wireframeMode === w.id
                              ? 'bg-[#c45eec] border-[#c45eec] text-[#0011fe]'
                              : 'bg-[#000d54] border-[#2ca801]/40 text-[#eefbf4] hover:border-[#2ca801]'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div>
                    <span className="text-[#2ca801]/90 font-bold block text-[10px] mb-1">
                      COLOR THEME
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { id: 'cobalt_green', label: 'COBALT CRT (GIF MATCH)', dot: '#2ca801' },
                        { id: 'matrix_green', label: 'MATRIX GREEN', dot: '#00ff66' },
                        { id: 'amber_radar', label: 'AMBER RADAR', dot: '#ffaa00' },
                        { id: 'synthwave_magenta', label: 'SYNTHWAVE SUNSET', dot: '#ff007f' },
                        { id: 'cyber_cyan', label: 'CYBERPUNK CYAN', dot: '#00e5ff' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id as ColorTheme)}
                          className={`flex items-center justify-between px-2 py-1 rounded-xs text-[11px] font-bold border transition-all cursor-pointer ${
                            terrainConfig.colorTheme === t.id
                              ? 'bg-[#000a30] border-[#ffe600] text-[#ffe600]'
                              : 'bg-[#000d54] border-[#2ca801]/30 text-[#eefbf4]/80 hover:border-[#2ca801]'
                          }`}
                        >
                          <span>{t.label}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: t.dot }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Elevation Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#2ca801]/90">
                      <span>ELEVATION GAIN: {terrainConfig.elevationScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={terrainConfig.elevationScale}
                      onChange={(e) =>
                        onChangeTerrainConfig((prev) => ({
                          ...prev,
                          elevationScale: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#2ca801] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: FLIGHT & AUTOPILOT */}
              {activeTab === 'flight' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[#2ca801]/90 font-bold block text-[10px] mb-1">
                      AUTOPILOT MODES
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'cruise', label: 'CRUISE FLYOVER' },
                        { id: 'orbit', label: 'ORBIT SECTOR' },
                        { id: 'canyon', label: 'CANYON RUN' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleAutopilotToggle(m.id as FlightState['autopilotMode'])}
                          className={`px-2 py-1 text-left rounded-xs text-[11px] font-bold border transition-all cursor-pointer ${
                            flightState.autopilot && flightState.autopilotMode === m.id
                              ? 'bg-[#ffe600] border-[#ffe600] text-[#0011fe]'
                              : 'bg-[#000d54] border-[#2ca801]/40 text-[#eefbf4] hover:border-[#2ca801]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Throttle Control */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#2ca801]/90">
                      <span>THROTTLE: {Math.round(flightState.throttle)}%</span>
                      <span>SPEED: {Math.round(flightState.speed)} KTS</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={flightState.throttle}
                      onChange={(e) =>
                        onUpdateFlightState((prev) => ({
                          ...prev,
                          throttle: Number(e.target.value),
                          autopilot: false,
                        }))
                      }
                      className="w-full accent-[#ffe600] cursor-pointer"
                    />
                  </div>

                  {/* Reset Position Button */}
                  <button
                    onClick={handleResetFlight}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#000d54] hover:bg-[#2ca801]/20 border border-[#2ca801] text-[#eefbf4] text-xs font-bold rounded-xs cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#2ca801]" />
                    <span>RESET FLIGHT VECTOR</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Waypoints Selection Widget */}
        <div className="p-2.5 bg-[#0011fe]/90 border border-[#2ca801] rounded-xs shadow-lg backdrop-blur-xs">
          <span className="text-[#ffe600] font-bold text-[10px] block mb-1.5">
            WAYPOINTS &amp; TARGETS
          </span>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {waypoints.map((wp) => (
              <button
                key={wp.id}
                onClick={() => {
                  audioSynth.playLockOn();
                  onSelectWaypoint(wp);
                }}
                className={`px-2 py-1 rounded-xs border text-left font-bold transition-all cursor-pointer ${
                  activeWaypoint?.id === wp.id
                    ? 'bg-[#c45eec] border-[#c45eec] text-[#0011fe]'
                    : 'bg-[#000d54] border-[#2ca801]/30 text-[#eefbf4] hover:border-[#2ca801]'
                }`}
              >
                {wp.id}: {wp.name}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
