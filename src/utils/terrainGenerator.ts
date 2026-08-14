import { createNoise2D } from 'simplex-noise';
import { ColorTheme, TerrainPreset, ThemeColors, Waypoint } from '../types';

const noise2D = createNoise2D(() => 0.42);
const noiseDetail2D = createNoise2D(() => 0.88);

export function getTerrainHeight(
  x: number,
  z: number,
  preset: TerrainPreset,
  elevationScale: number
): number {
  let height = 0;

  switch (preset) {
    case 'alpine': {
      // High frequency jagged mountains with sharp ridges (ridge noise)
      const scale1 = 0.003;
      const n1 = Math.abs(noise2D(x * scale1, z * scale1)); // Ridged multifractal
      const scale2 = 0.008;
      const n2 = noiseDetail2D(x * scale2, z * scale2) * 0.5;
      const scale3 = 0.02;
      const n3 = noise2D(x * scale3, z * scale3) * 0.2;
      height = (n1 * 1.8 + n2 + n3) * 45;
      break;
    }

    case 'canyons': {
      // Terraced stepped canyons with deep carved chasms
      const scale1 = 0.004;
      const raw = (noise2D(x * scale1, z * scale1) + 1) * 0.5;
      // Terracing function
      const stepped = Math.floor(raw * 5) / 5 + Math.pow((raw * 5) % 1, 3) * 0.2;
      const chasm = Math.sin(x * 0.008 + z * 0.005);
      const chasmCut = chasm > 0.6 ? -15 : 0;
      height = stepped * 50 + chasmCut;
      break;
    }

    case 'coastal': {
      // Island archipelago with flat ocean level
      const scale = 0.003;
      const n = noise2D(x * scale, z * scale);
      height = Math.max(0, n * 35);
      break;
    }

    case 'lunar': {
      // Craters and smooth lunar maria
      const scale = 0.004;
      const n = noise2D(x * scale, z * scale);
      // Crater formula
      const distToCenter = Math.sqrt((x % 300 - 150) ** 2 + (z % 300 - 150) ** 2);
      const crater = distToCenter < 90 ? Math.sin((distToCenter / 90) * Math.PI) * -18 + 8 : 0;
      height = (n * 20) + crater + 15;
      break;
    }

    case 'synth_wave':
    default: {
      // Rolling sine waves with fractal ripple
      const wave1 = Math.sin(x * 0.015) * Math.cos(z * 0.012) * 16;
      const wave2 = Math.sin((x + z) * 0.02) * 8;
      const n = noise2D(x * 0.005, z * 0.005) * 12;
      height = wave1 + wave2 + n + 15;
      break;
    }
  }

  return height * elevationScale;
}

export const THEMES: Record<ColorTheme, ThemeColors> = {
  cobalt_green: {
    name: 'Cobalt CRT (Reference GIF)',
    bgHex: 0x0011fe,
    bgCss: '#0011fe',
    wireHex: 0x2ca801,
    wireCss: '#2ca801',
    faceHex: 0x146703,
    faceCss: '#146703',
    accentHex: 0xc45eec,
    accentCss: '#c45eec',
    hudTextCss: 'text-[#eefbf4]',
    hudBorderCss: 'border-[#2ca801]',
  },
  matrix_green: {
    name: 'Matrix Vector Green',
    bgHex: 0x021204,
    bgCss: '#021204',
    wireHex: 0x00ff66,
    wireCss: '#00ff66',
    faceHex: 0x003b14,
    faceCss: '#003b14',
    accentHex: 0x76ff03,
    accentCss: '#76ff03',
    hudTextCss: 'text-[#80ffaa]',
    hudBorderCss: 'border-[#00ff66]',
  },
  amber_radar: {
    name: 'Amber CRT Radar',
    bgHex: 0x140a00,
    bgCss: '#140a00',
    wireHex: 0xffaa00,
    wireCss: '#ffaa00',
    faceHex: 0x472600,
    faceCss: '#472600',
    accentHex: 0xff3b00,
    accentCss: '#ff3b00',
    hudTextCss: 'text-[#ffd280]',
    hudBorderCss: 'border-[#ffaa00]',
  },
  synthwave_magenta: {
    name: 'Synthwave Sunset',
    bgHex: 0x120024,
    bgCss: '#120024',
    wireHex: 0xff007f,
    wireCss: '#ff007f',
    faceHex: 0x3d0047,
    faceCss: '#3d0047',
    accentHex: 0x00f0ff,
    accentCss: '#00f0ff',
    hudTextCss: 'text-[#fce4ec]',
    hudBorderCss: 'border-[#ff007f]',
  },
  cyber_cyan: {
    name: 'Cyberpunk Cyan',
    bgHex: 0x001724,
    bgCss: '#001724',
    wireHex: 0x00e5ff,
    wireCss: '#00e5ff',
    faceHex: 0x003d52,
    faceCss: '#003d52',
    accentHex: 0xff0055,
    accentCss: '#ff0055',
    hudTextCss: 'text-[#e0f7fa]',
    hudBorderCss: 'border-[#00e5ff]',
  },
};

export const INITIAL_WAYPOINTS: Waypoint[] = [
  { id: 'ALPHA', name: 'VALLEY PASS 01', x: 0, z: -350, alt: 42, type: 'beacon', color: '#c45eec' },
  { id: 'BRAVO', name: 'PEAK SUMMIT', x: 280, z: -700, alt: 85, type: 'summit', color: '#ffe600' },
  { id: 'CHARLIE', name: 'CANYON RADAR', x: -320, z: -1100, alt: 30, type: 'base', color: '#00e5ff' },
  { id: 'DELTA', name: 'DELTA SECTOR', x: 120, z: -1500, alt: 60, type: 'beacon', color: '#ff3b00' },
];
