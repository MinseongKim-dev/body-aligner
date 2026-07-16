'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STEPS = [
  { label: '체크리스트', path: '/checklist', icon: '📋' },
  { label: '사진 분석', path: '/photo', icon: '📸' },
  { label: '결과 분석', path: '/analysis', icon: '🔍' },
  { label: '영상 매칭', path: '/video', icon: '▶️' },
  { label: '추천 루틴', path: '/recommendation', icon: '💪' },
];

export default function ProgressSteps() {
  const pathname = usePathname();
  const currentIdx = STEPS.findIndex((s) => pathname.startsWith(s.path));

  return (
    <nav className="w-full bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <ol className="flex items-center justify-between gap-1">
          {STEPS.map((step, idx) => {
            const done = currentIdx > idx;
            const active = currentIdx === idx;
            return (
              <li key={step.path} className="flex items-center flex-1">
                <Link
                  href={step.path}
                  className={`flex flex-col items-center gap-0.5 text-center flex-1 group transition-colors ${
                    active
                      ? 'text-blue-700'
                      : done
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      active
                        ? 'bg-blue-700 text-white'
                        : done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? '✓' : idx + 1}
                  </span>
                  <span className="text-[10px] font-medium hidden sm:block leading-tight">{step.label}</span>
                </Link>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 transition-colors ${
                      done ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
