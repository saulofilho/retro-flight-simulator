import React, { useState, useEffect, useCallback } from 'react';
import { CameraConfig, FlightState, TerrainConfig, ViewMode, Waypoint } from './types';
import { INITIAL_WAYPOINTS } from './utils/terrainGenerator';
import { audioSynth } from './utils/audioSynth';
import { Viewport3D } from './components/Viewport3D';
import { HUDOverlay } from './components/HUDOverlay';
import { ControlPanels } from './components/ControlPanels';
import { FlightControls } from './components/FlightControls';
import { ReferenceGifModal } from './components/ReferenceGifModal';

export default function App() {
  // Flight physics state
  const [flightState, setFlightState] = useState<FlightState>({
    x: 0,
    y: 55, // initial flight altitude
    z: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
    speed: 175,
    throttle: 65,
    climbRate: 0,
    gForce: 1.0,
    groundElevation: 25,
    altitudeAGL: 1050,
    altitudeMSL: 3125,
    lat: 34.0522,
    lon: -118.2437,
    autopilot: true, // Default to continuous flight like the reference GIF
    autopilotMode: 'cruise',
    time: 0,
  });

  // Camera settings
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    mode: 'chase',
    fov: 65,
    zoom: 1.0,
    pitchOffset: 0,
    yawOffset: 0,
    distance: 30,
  });

  // Terrain & Rendering settings
  const [terrainConfig, setTerrainConfig] = useState<TerrainConfig>({
    preset: 'alpine',
    wireframeMode: 'shaded_wire',
    density: 'standard',
    elevationScale: 1.2,
    colorTheme: 'cobalt_green', // Signature Tumblr reference GIF palette
    gridSpacing: 15,
    scanSpeed: 1.0,
  });

  // Waypoints & Navigation
  const [waypoints] = useState<Waypoint[]>(INITIAL_WAYPOINTS);
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(INITIAL_WAYPOINTS[0]);

  // Input states
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({});
  const [joystickInput, setJoystickInput] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Visual Effects
  const [showCrt, setShowCrt] = useState(true);
  const [showRefModal, setShowRefModal] = useState(false);

  // Sync engine sound with throttle and speed
  useEffect(() => {
    audioSynth.updateEnginePitch(flightState.speed, flightState.throttle);
  }, [flightState.speed, flightState.throttle]);

  // Cycle view modes
  const handleCycleView = useCallback(() => {
    const modes: ViewMode[] = ['cockpit', 'chase', 'orbit', 'topdown', 'isometric'];
    setCameraConfig((prev) => {
      const nextIdx = (modes.indexOf(prev.mode) + 1) % modes.length;
      return { ...prev, mode: modes[nextIdx] };
    });
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting input if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // Start engine sound on first user action
      audioSynth.startEngine();

      if (e.code === 'KeyV') {
        handleCycleView();
        return;
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        // Cycle active target waypoint
        setActiveWaypoint((prev) => {
          if (!prev) return waypoints[0];
          const currIdx = waypoints.findIndex((w) => w.id === prev.id);
          const nextWp = waypoints[(currIdx + 1) % waypoints.length];
          audioSynth.playLockOn();
          return nextWp;
        });
        return;
      }

      if (e.code === 'Space') {
        // Toggle autopilot
        setFlightState((prev) => ({
          ...prev,
          autopilot: !prev.autopilot,
        }));
        return;
      }

      setKeysPressed((prev) => ({ ...prev, [e.code]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed((prev) => {
        const next = { ...prev };
        delete next[e.code];
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleCycleView, waypoints]);

  return (
    <div
      id="retro-flight-app-container"
      className={`relative w-screen h-screen overflow-hidden bg-[#000d54] text-slate-100 font-tech ${
        showCrt ? 'crt-overlay crt-vignette' : ''
      }`}
      onClick={() => {
        // Resume web audio context on user click
        audioSynth.startEngine();
      }}
    >
      {/* 1. Main 3D Wireframe WebGL Viewport */}
      <Viewport3D
        flightState={flightState}
        onUpdateFlightState={setFlightState}
        cameraConfig={cameraConfig}
        terrainConfig={terrainConfig}
        waypoints={waypoints}
        activeWaypoint={activeWaypoint}
        keysPressed={keysPressed}
        joystickInput={joystickInput}
      />

      {/* 2. Vector Flight Telemetry & HUD Overlay */}
      <HUDOverlay
        flightState={flightState}
        cameraConfig={cameraConfig}
        terrainConfig={terrainConfig}
        waypoints={waypoints}
        activeWaypoint={activeWaypoint}
        onSelectWaypoint={setActiveWaypoint}
      />

      {/* 3. Header & Right Control Panels */}
      <ControlPanels
        flightState={flightState}
        onUpdateFlightState={setFlightState}
        cameraConfig={cameraConfig}
        onChangeCameraConfig={setCameraConfig}
        terrainConfig={terrainConfig}
        onChangeTerrainConfig={setTerrainConfig}
        waypoints={waypoints}
        activeWaypoint={activeWaypoint}
        onSelectWaypoint={setActiveWaypoint}
        showCrt={showCrt}
        onToggleCrt={() => setShowCrt((prev) => !prev)}
        showRefModal={showRefModal}
        onToggleRefModal={() => setShowRefModal((prev) => !prev)}
      />

      {/* 4. Interactive Virtual Flight Joystick & HUD Shortcuts */}
      <FlightControls
        onJoystickMove={setJoystickInput}
        onThrottleDelta={(delta) =>
          setFlightState((prev) => ({
            ...prev,
            throttle: Math.max(0, Math.min(100, prev.throttle + delta)),
            autopilot: false,
          }))
        }
        onSwitchView={handleCycleView}
        autopilot={flightState.autopilot}
        onToggleAutopilot={() =>
          setFlightState((prev) => ({
            ...prev,
            autopilot: !prev.autopilot,
          }))
        }
      />

      {/* 5. Reference GIF Comparison Modal */}
      <ReferenceGifModal
        isOpen={showRefModal}
        onClose={() => setShowRefModal(false)}
      />
    </div>
  );
}
