import React, { useRef, useState, useEffect } from 'react';
import { audioSynth } from '../utils/audioSynth';
import { Crosshair, Move, Zap } from 'lucide-react';

interface FlightControlsProps {
  onJoystickMove: (input: { x: number; y: number }) => void;
  onThrottleDelta: (delta: number) => void;
  onSwitchView: () => void;
  autopilot: boolean;
  onToggleAutopilot: () => void;
}

export const FlightControls: React.FC<FlightControlsProps> = ({
  onJoystickMove,
  onThrottleDelta,
  onSwitchView,
  autopilot,
  onToggleAutopilot,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateStick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateStick(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setStickPos({ x: 0, y: 0 });
    onJoystickMove({ x: 0, y: 0 });
  };

  const updateStick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 16;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });
    // Normalize to -1.0 to 1.0
    onJoystickMove({
      x: dx / maxRadius,
      y: dy / maxRadius,
    });
  };

  return (
    <div className="absolute bottom-10 right-4 flex items-end gap-3 pointer-events-auto select-none z-30">
      {/* Keyboard Controls Legend (Desktop) */}
      <div className="hidden lg:flex flex-col gap-1 p-2 bg-[#0011fe]/85 border border-[#2ca801]/60 rounded-xs text-[10px] text-[#eefbf4] font-tech backdrop-blur-xs">
        <div className="text-[#ffe600] font-bold pb-0.5 border-b border-[#2ca801]/40">
          FLIGHT STICK KEYS
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
          <span><kbd className="px-1 bg-[#000a30] border border-[#2ca801] rounded">W</kbd>/<kbd className="px-1 bg-[#000a30] border border-[#2ca801] rounded">S</kbd> PITCH</span>
          <span><kbd className="px-1 bg-[#000a30] border border-[#2ca801] rounded">A</kbd>/<kbd className="px-1 bg-[#000a30] border border-[#2ca801] rounded">D</kbd> ROLL</span>
          <span><kbd className="px-1 bg-[#000a30] border border-[#2ca801] rounded">Q</kbd>/<kbd className="px-1 bg-[#000a30] border border-[#2ca801] rounded">E</kbd> RUDDER</span>
          <span><kbd className="px-1 bg-[#000a30] border border-[#2ca801] rounded">SHIFT</kbd> THRUST</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-col gap-1.5 font-tech">
        <button
          onClick={() => {
            audioSynth.playClick();
            onToggleAutopilot();
          }}
          className={`px-2.5 py-1.5 rounded-xs border text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1 ${
            autopilot
              ? 'bg-[#ffe600] border-[#ffe600] text-[#0011fe]'
              : 'bg-[#0011fe]/90 border-[#2ca801] text-[#eefbf4] hover:bg-[#2ca801]/20'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{autopilot ? 'AUTO ON' : 'MANUAL'}</span>
        </button>

        <button
          onClick={() => {
            audioSynth.playClick();
            onSwitchView();
          }}
          className="px-2.5 py-1.5 rounded-xs border border-[#2ca801] bg-[#0011fe]/90 hover:bg-[#2ca801]/20 text-[#eefbf4] text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#2ca801]" />
          <span>VIEW (V)</span>
        </button>
      </div>

      {/* Interactive Virtual Flight Joystick */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] text-[#2ca801] font-bold font-tech mb-0.5 tracking-wider">
          FLIGHT STICK
        </span>
        <div
          ref={joystickRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-28 h-28 rounded-full bg-[#000d54]/90 border-2 border-[#2ca801] flex items-center justify-center touch-none cursor-grab active:cursor-grabbing shadow-[0_0_12px_rgba(44,168,1,0.3)] backdrop-blur-xs"
        >
          {/* Crosshair guide lines */}
          <div className="absolute w-full h-px bg-[#2ca801]/30 pointer-events-none" />
          <div className="absolute h-full w-px bg-[#2ca801]/30 pointer-events-none" />
          <div className="absolute w-14 h-14 rounded-full border border-[#2ca801]/25 pointer-events-none" />

          {/* Stick Knob */}
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2ca801] to-[#146703] border-2 border-[#ffe600] flex items-center justify-center shadow-[0_0_10px_#2ca801] transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
            }}
          >
            <Move className="w-4 h-4 text-[#ffe600]" />
          </div>
        </div>
      </div>
    </div>
  );
};
