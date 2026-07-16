'use client';

interface BodyMapProps {
  selected: string[];
  onChange: (parts: string[]) => void;
}

interface BodyPart {
  id: string;
  label: string;
  shape: 'ellipse' | 'rect';
  cx?: number; cy?: number; rx?: number; ry?: number;
  x?: number; y?: number; w?: number; h?: number;
  r?: number;
}

const PARTS: BodyPart[] = [
  // Head
  { id: 'neck', label: '목/경추', shape: 'ellipse', cx: 100, cy: 35, rx: 28, ry: 30 },
  // Shoulders
  { id: 'left_shoulder', label: '왼쪽 어깨', shape: 'ellipse', cx: 56, cy: 88, rx: 22, ry: 18 },
  { id: 'right_shoulder', label: '오른쪽 어깨', shape: 'ellipse', cx: 144, cy: 88, rx: 22, ry: 18 },
  // Upper torso
  { id: 'upper_back', label: '등 상부', shape: 'rect', x: 72, y: 70, w: 56, h: 55, r: 6 },
  // Lower torso
  { id: 'lower_back', label: '허리', shape: 'rect', x: 72, y: 123, w: 56, h: 45, r: 4 },
  // Hips
  { id: 'left_hip', label: '왼쪽 고관절', shape: 'ellipse', cx: 76, cy: 186, rx: 22, ry: 20 },
  { id: 'right_hip', label: '오른쪽 고관절', shape: 'ellipse', cx: 124, cy: 186, rx: 22, ry: 20 },
  // Knees
  { id: 'left_knee', label: '왼쪽 무릎', shape: 'ellipse', cx: 76, cy: 278, rx: 18, ry: 18 },
  { id: 'right_knee', label: '오른쪽 무릎', shape: 'ellipse', cx: 124, cy: 278, rx: 18, ry: 18 },
  // Ankles
  { id: 'left_ankle', label: '왼쪽 발목', shape: 'ellipse', cx: 76, cy: 362, rx: 14, ry: 14 },
  { id: 'right_ankle', label: '오른쪽 발목', shape: 'ellipse', cx: 124, cy: 362, rx: 14, ry: 14 },
  // Feet
  { id: 'left_foot', label: '왼쪽 발', shape: 'rect', x: 58, y: 378, w: 36, h: 18, r: 6 },
  { id: 'right_foot', label: '오른쪽 발', shape: 'rect', x: 106, y: 378, w: 36, h: 18, r: 6 },
];

export default function BodyMap({ selected, onChange }: BodyMapProps) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-slate-500 text-center">통증 또는 불편한 부위를 클릭하세요 (복수 선택 가능)</p>
      <div className="relative">
        <svg
          viewBox="0 0 200 405"
          className="w-48 h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body outline */}
          {/* Upper legs */}
          <rect x="62" y="202" width="34" height="80" rx="6" fill="#e2e8f0" />
          <rect x="104" y="202" width="34" height="80" rx="6" fill="#e2e8f0" />
          {/* Lower legs */}
          <rect x="62" y="294" width="34" height="72" rx="6" fill="#e2e8f0" />
          <rect x="104" y="294" width="34" height="72" rx="6" fill="#e2e8f0" />

          {/* Clickable parts */}
          {PARTS.map((part) => {
            const isSelected = selected.includes(part.id);
            const fill = isSelected ? '#ef4444' : '#cbd5e1';
            const hoverFill = isSelected ? '#dc2626' : '#94a3b8';
            return part.shape === 'ellipse' ? (
              <ellipse
                key={part.id}
                cx={part.cx}
                cy={part.cy}
                rx={part.rx}
                ry={part.ry}
                fill={fill}
                className="cursor-pointer transition-colors duration-150"
                style={{ fill: isSelected ? '#ef4444' : '#cbd5e1' }}
                onClick={() => toggle(part.id)}
              >
                <title>{part.label}</title>
              </ellipse>
            ) : (
              <rect
                key={part.id}
                x={part.x}
                y={part.y}
                width={part.w}
                height={part.h}
                rx={part.r}
                fill={fill}
                className="cursor-pointer transition-colors duration-150"
                style={{ fill: isSelected ? '#ef4444' : '#cbd5e1' }}
                onClick={() => toggle(part.id)}
              >
                <title>{part.label}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
          {selected.map((id) => {
            const part = PARTS.find((p) => p.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium cursor-pointer"
                onClick={() => toggle(id)}
              >
                {part?.label} ×
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
