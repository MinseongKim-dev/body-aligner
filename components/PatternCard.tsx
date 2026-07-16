import type { BodyPattern } from '@/lib/types';

interface Props {
  pattern: BodyPattern;
  rank: number;
}

const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-sky-100 text-sky-700 border-sky-200',
};

const SEVERITY_LABELS: Record<string, string> = {
  high: '심각',
  medium: '중간',
  low: '경미',
};

const SIDE_LABELS: Record<string, string> = {
  left: '좌측',
  right: '우측',
  both: '양쪽',
};

export default function PatternCard({ pattern, rank }: Props) {
  return (
    <div className={`rounded-2xl border p-5 ${SEVERITY_STYLES[pattern.severity]} transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-slate-700 text-sm shadow-sm">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base">{pattern.name}</h3>
            {pattern.side && (
              <span className="text-xs font-medium bg-white/70 px-2 py-0.5 rounded-full">
                {SIDE_LABELS[pattern.side]}
              </span>
            )}
            <span className="text-xs font-semibold ml-auto">{SEVERITY_LABELS[pattern.severity]}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed opacity-90">{pattern.description}</p>
          {pattern.cascade && (
            <div className="mt-3 p-3 bg-white/50 rounded-xl">
              <p className="text-xs font-semibold mb-1 opacity-75">연쇄 패턴</p>
              <p className="text-xs opacity-80 leading-relaxed">{pattern.cascade}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
