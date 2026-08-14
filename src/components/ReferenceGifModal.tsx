import React from 'react';
import { X, ExternalLink, CheckCircle, Info } from 'lucide-react';

interface ReferenceGifModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceGifModal: React.FC<ReferenceGifModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#000d54] border-2 border-[#2ca801] rounded-xs shadow-[0_0_25px_rgba(44,168,1,0.5)] font-tech text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0011fe] border-b border-[#2ca801]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe600] animate-pulse" />
            <h2 className="text-sm font-bold tracking-wider text-[#eefbf4] uppercase">
              Reference GIF Comparison &amp; Architecture
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2ca801]/30 rounded-xs text-[#eefbf4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Reference Image / GIF */}
            <div className="flex flex-col items-center">
              <div className="relative w-full rounded-xs border-2 border-[#2ca801] overflow-hidden bg-black shadow-lg">
                <img
                  src="/reference.gif"
                  alt="Original Reference GIF"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback to Tumblr URL if local public asset fails
                    (e.target as HTMLImageElement).src =
                      'https://64.media.tumblr.com/83fa9583481b9121bb1ffd4b48958054/271320c9b0589e4f-dd/s640x960/5f7bfae7b0952cdbdb5d05332dbb3806c6f8b55b.gifv';
                  }}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#0011fe]/90 border border-[#2ca801] text-[10px] text-[#ffe600] font-bold">
                  ORIGINAL TUMBLR GIF
                </div>
              </div>
            </div>

            {/* Feature Fidelity Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0011fe]/80 border border-[#2ca801]/60 rounded-xs">
                <h3 className="text-[#ffe600] font-bold text-sm mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#2ca801]" />
                  Recreated Interactive Features
                </h3>
                <ul className="space-y-1.5 text-[#eefbf4]/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#2ca801] shrink-0 mt-0.5" />
                    <span><strong>Electric Cobalt &amp; Neon Green CRT Palette:</strong> Authentic 80s/90s vector flight simulator aesthetics with phosphor glow and scanlines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#2ca801] shrink-0 mt-0.5" />
                    <span><strong>Real-time 3D Wireframe Terrain:</strong> Infinite rolling fractal mesh with multiple landscape presets (Alpine, Canyons, Coastal, Lunar, Synthwave).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#2ca801] shrink-0 mt-0.5" />
                    <span><strong>Interactive Camera &amp; Views:</strong> 3D Cockpit, 3D Chase, Orbit Free, Top-Down GIS 2D, and Isometric views with FOV &amp; Zoom controls.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#2ca801] shrink-0 mt-0.5" />
                    <span><strong>Full Telemetry &amp; Flight HUD:</strong> Heading ribbon, pitch ladder, GPS latitude/longitude, altitude MSL/AGL, climb rate, airspeed, and mini-radar scanner.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#2ca801] shrink-0 mt-0.5" />
                    <span><strong>Web Audio Synthesizer:</strong> Procedural engine hum, radar sweeps, lock-on tones, and warning chimes.</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://64.media.tumblr.com/83fa9583481b9121bb1ffd4b48958054/271320c9b0589e4f-dd/s640x960/5f7bfae7b0952cdbdb5d05332dbb3806c6f8b55b.gifv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#c45eec] hover:underline"
                >
                  <span>Open raw Tumblr link in new tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={onClose}
                  className="px-4 py-1.5 bg-[#2ca801] text-[#0011fe] font-bold rounded-xs cursor-pointer hover:bg-[#32d74b] transition-colors"
                >
                  CLOSE &amp; FLY
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
