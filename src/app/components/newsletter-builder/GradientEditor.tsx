import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X } from 'lucide-react';

interface GradientStop {
  color: string;
  position: number; // 0-100
}

interface Props {
  value: string; // CSS gradient string
  onChange: (v: string) => void;
}

function parseGradient(css: string): { type: 'linear' | 'radial'; angle: number; stops: GradientStop[] } {
  const defaults = { type: 'linear' as const, angle: 90, stops: [{ color: '#004BE2', position: 0 }, { color: '#E42527', position: 100 }] };
  if (!css) return defaults;

  const isRadial = css.startsWith('radial');
  const type = isRadial ? 'radial' as const : 'linear' as const;

  let angle = 90;
  const angleMatch = css.match(/(\d+)deg/);
  if (angleMatch) angle = parseInt(angleMatch[1]);

  // Parse color stops
  const stops: GradientStop[] = [];
  // Remove gradient function wrapper
  const inner = css.replace(/^(linear|radial)-gradient\(/, '').replace(/\)$/, '');
  // Split by commas, but skip the first part (angle/shape)
  const parts = inner.split(',').map(s => s.trim());

  for (const part of parts) {
    if (part.includes('deg') || part === 'circle' || part === 'ellipse' || part.includes('at ')) continue;
    const colorMatch = part.match(/(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|[a-z]+)/);
    const posMatch = part.match(/(\d+)%/);
    if (colorMatch) {
      stops.push({
        color: colorMatch[1],
        position: posMatch ? parseInt(posMatch[1]) : -1,
      });
    }
  }

  // Auto-assign positions if missing
  if (stops.length > 0) {
    stops.forEach((s, i) => {
      if (s.position === -1) {
        s.position = stops.length === 1 ? 50 : Math.round((i / (stops.length - 1)) * 100);
      }
    });
  }

  return { type, angle, stops: stops.length >= 2 ? stops : defaults.stops };
}

function buildGradient(type: 'linear' | 'radial', angle: number, stops: GradientStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopsStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
  if (type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`;
  }
  return `linear-gradient(${angle}deg, ${stopsStr})`;
}

/** Buffered text input for a gradient stop's color hex — commits only on
 *  Enter / Tab / Blur. Without buffering, every keystroke would update the
 *  parent stops array and re-emit the full CSS gradient string, pushing the
 *  canvas through every intermediate (often invalid) hex value while the
 *  user types. */
function StopColorInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <input type="text" value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => { if (e.target.value !== value) onCommit(e.target.value); }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          if ((e.target as HTMLInputElement).value !== value) onCommit((e.target as HTMLInputElement).value);
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Tab') {
          if ((e.target as HTMLInputElement).value !== value) onCommit((e.target as HTMLInputElement).value);
        } else if (e.key === 'Escape') {
          setLocal(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="flex-1 px-1.5 py-0.5 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[10px] text-[#2d3748] font-mono outline-none focus:border-[#004BE2]" />
  );
}

/** Buffered numeric input for a gradient stop's position (0-100) — commits
 *  only on Enter / Tab / Blur. */
function StopPositionInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  return (
    <input type="text" inputMode="numeric" value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => { const n = parseInt(e.target.value); if (!isNaN(n) && n !== value) onCommit(n); }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          const n = parseInt((e.target as HTMLInputElement).value);
          if (!isNaN(n) && n !== value) onCommit(n);
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Tab') {
          const n = parseInt((e.target as HTMLInputElement).value);
          if (!isNaN(n) && n !== value) onCommit(n);
        } else if (e.key === 'Escape') {
          setLocal(String(value));
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-8 px-1 py-0.5 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[10px] text-[#2d3748] text-center outline-none focus:border-[#004BE2]" />
  );
}

export function GradientEditor({ value, onChange }: Props) {
  const parsed = parseGradient(value);
  const [type, setType] = useState(parsed.type);
  const [angle, setAngle] = useState(parsed.angle);
  const [stops, setStops] = useState(parsed.stops);
  const [selectedStop, setSelectedStop] = useState(0);
  const [angleLocal, setAngleLocal] = useState(String(parsed.angle));
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  useEffect(() => {
    const p = parseGradient(value);
    setType(p.type);
    setAngle(p.angle);
    setAngleLocal(String(p.angle));
    setStops(p.stops);
  }, [value]);

  const emit = useCallback((t: typeof type, a: number, s: GradientStop[]) => {
    onChange(buildGradient(t, a, s));
  }, [onChange]);

  const handleBarMouseDown = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = idx;
    setSelectedStop(idx);

    const move = (me: MouseEvent) => {
      if (dragging.current === null || !barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(100, Math.round(((me.clientX - rect.left) / rect.width) * 100)));
      setStops(prev => {
        const next = [...prev];
        next[dragging.current!] = { ...next[dragging.current!], position: pos };
        emit(type, angle, next);
        return next;
      });
    };

    const up = () => {
      dragging.current = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const addStop = () => {
    const newPos = 50;
    const newColor = '#718096';
    const next = [...stops, { color: newColor, position: newPos }];
    setStops(next);
    setSelectedStop(next.length - 1);
    emit(type, angle, next);
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    const next = stops.filter((_, i) => i !== idx);
    setStops(next);
    setSelectedStop(Math.min(selectedStop, next.length - 1));
    emit(type, angle, next);
  };

  const updateStopColor = (idx: number, color: string) => {
    const next = [...stops];
    next[idx] = { ...next[idx], color };
    setStops(next);
    emit(type, angle, next);
  };

  const gradient = buildGradient(type, angle, stops);

  return (
    <div className="space-y-2" onClick={e => e.stopPropagation()}>
      {/* Preview bar */}
      <div
        ref={barRef}
        className="relative h-6 rounded-md border border-[#dce1e8] cursor-crosshair"
        style={{ background: gradient }}
        onDoubleClick={e => {
          const rect = barRef.current!.getBoundingClientRect();
          const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100);
          const next = [...stops, { color: '#ffffff', position: pos }];
          setStops(next);
          setSelectedStop(next.length - 1);
          emit(type, angle, next);
        }}
      >
        {/* Stop handles */}
        {stops.map((stop, i) => (
          <div
            key={i}
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 cursor-grab active:cursor-grabbing transition-shadow ${
              selectedStop === i ? 'border-[#004BE2] shadow-md ring-2 ring-[#004BE2]/30' : 'border-white shadow'
            }`}
            style={{
              left: `calc(${stop.position}% - 7px)`,
              backgroundColor: stop.color,
            }}
            onMouseDown={e => handleBarMouseDown(e, i)}
          />
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-1.5">
        {/* Type toggle */}
        <div className="flex bg-[#f0f2f5] rounded overflow-hidden">
          <button onClick={() => { setType('linear'); emit('linear', angle, stops); }}
            className={`px-2 py-0.5 text-[9px] transition-colors ${type === 'linear' ? 'bg-[#004BE2] text-white' : 'text-[#718096] hover:text-[#2d3748]'}`}
            style={{ fontWeight: 600 }}>Linear</button>
          <button onClick={() => { setType('radial'); emit('radial', angle, stops); }}
            className={`px-2 py-0.5 text-[9px] transition-colors ${type === 'radial' ? 'bg-[#004BE2] text-white' : 'text-[#718096] hover:text-[#2d3748]'}`}
            style={{ fontWeight: 600 }}>Radial</button>
        </div>

        {/* Angle */}
        {type === 'linear' && (
          <div className="flex items-center gap-1">
            <input type="text" inputMode="numeric" value={angleLocal}
              onChange={e => setAngleLocal(e.target.value)}
              onBlur={e => { const n = parseInt(e.target.value) || 0; setAngle(n); setAngleLocal(String(n)); emit('linear', n, stops); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const n = parseInt((e.target as HTMLInputElement).value) || 0;
                  setAngle(n); setAngleLocal(String(n)); emit('linear', n, stops);
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Tab') {
                  const n = parseInt((e.target as HTMLInputElement).value) || 0;
                  setAngle(n); setAngleLocal(String(n)); emit('linear', n, stops);
                } else if (e.key === 'Escape') {
                  setAngleLocal(String(angle));
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-10 px-1.5 py-0.5 bg-[#f7f8fa] border border-[#dce1e8] rounded text-[10px] text-[#2d3748] text-center outline-none focus:border-[#004BE2]"
            />
            <span className="text-[9px] text-[#a0aec0]">deg</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Add stop */}
        <button onClick={addStop}
          className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f0f2f5] text-[#718096] hover:text-[#004BE2] rounded text-[9px] transition-colors" style={{ fontWeight: 500 }}>
          <Plus size={9} /> Stop
        </button>
      </div>

      {/* Stop list */}
      <div className="space-y-1">
        {stops.map((stop, i) => (
          <div key={i} className={`flex items-center gap-1.5 px-1.5 py-1 rounded transition-colors ${selectedStop === i ? 'bg-[#E5EDFC]' : ''}`}
            onClick={() => setSelectedStop(i)}>
            <input type="color" value={stop.color.startsWith('#') ? stop.color : '#000000'}
              onChange={e => updateStopColor(i, e.target.value)}
              className="w-5 h-5 rounded border border-[#dce1e8] cursor-pointer p-0 shrink-0" />
            <StopColorInput value={stop.color} onCommit={c => updateStopColor(i, c)} />
            <StopPositionInput value={stop.position} onCommit={pos => {
              const next = [...stops];
              next[i] = { ...next[i], position: Math.max(0, Math.min(100, pos)) };
              setStops(next);
              emit(type, angle, next);
            }} />
            <span className="text-[8px] text-[#a0aec0]">%</span>
            {stops.length > 2 && (
              <button onClick={e => { e.stopPropagation(); removeStop(i); }}
                className="w-4 h-4 rounded hover:bg-red-50 text-[#a0aec0] hover:text-red-500 flex items-center justify-center transition-colors">
                <X size={9} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
