export type ViewMode = 'cockpit' | 'chase' | 'orbit' | 'topdown' | 'isometric';

export type WireframeMode = 'shaded_wire' | 'wireframe' | 'hidden_line' | 'contour_topo' | 'heatmap';

export type TerrainPreset = 'alpine' | 'canyons' | 'coastal' | 'lunar' | 'synth_wave';

export type ColorTheme = 'cobalt_green' | 'amber_radar' | 'synthwave_magenta' | 'cyber_cyan' | 'matrix_green';

export interface FlightState {
  x: number;
  y: number; // altitude in world units
  z: number;
  pitch: number; // degrees -85 to 85
  roll: number; // degrees -180 to 180
  yaw: number; // heading 0 to 360
  speed: number; // current speed (knots)
  throttle: number; // 0 to 100%
  climbRate: number; // ft/min
  gForce: number;
  groundElevation: number;
  altitudeAGL: number; // Above Ground Level
  altitudeMSL: number; // Mean Sea Level
  lat: number;
  lon: number;
  autopilot: boolean;
  autopilotMode: 'cruise' | 'orbit' | 'canyon' | 'survey';
  time: number;
}

export interface CameraConfig {
  mode: ViewMode;
  fov: number; // 30 - 110
  zoom: number; // 0.5 - 3.0
  pitchOffset: number;
  yawOffset: number;
  distance: number;
}

export interface TerrainConfig {
  preset: TerrainPreset;
  wireframeMode: WireframeMode;
  density: 'retro_low' | 'standard' | 'high_res';
  elevationScale: number; // 0.5 to 2.5
  colorTheme: ColorTheme;
  gridSpacing: number;
  scanSpeed: number; // 0.2 to 3.0
}

export interface Waypoint {
  id: string;
  name: string;
  x: number;
  z: number;
  alt: number;
  type: 'base' | 'beacon' | 'summit' | 'canyon_gate';
  color: string;
}

export interface ThemeColors {
  name: string;
  bgHex: number;
  bgCss: string;
  wireHex: number;
  wireCss: string;
  faceHex: number;
  faceCss: string;
  accentHex: number;
  accentCss: string;
  hudTextCss: string;
  hudBorderCss: string;
}
