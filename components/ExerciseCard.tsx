'use client';

import { useState } from 'react';
import type { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  matchedPatternNames?: string[];
  videoSources?: { url: string; label: string }[];
  showPhase?: boolean;
}

const PURPOSE_STYLES: Record<string, string> = {
  stretch: 'bg-purple-100 text-purple-700',
  mobility: 'bg-sky-100 text-sky-700',
  activation: 'bg-amber-100 text-amber-700',
  strength: 'bg-emerald-100 text-emerald-700',
};

const PURPOSE_LABELS: Record<string, string> = {
  stretch: '스트레칭',
  mobility: '가동범위',
  activation: '활성화',
  strength: '근력 강화',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

export default function ExerciseCard({ exercise, matchedPatternNames, videoSources, showPhase }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-3"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {showPhase && (
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Phase {exercise.phase}
              </span>
            )}
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PURPOSE_STYLES[exercise.purpose]}`}
            >
              {PURPOSE_LABELS[exercise.purpose]}
            </span>
            <span className="text-xs text-slate-400">{DIFFICULTY_LABELS[exercise.difficulty]}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h4 className="font-bold text-slate-800 text-base">{exercise.nameKr}</h4>
            <span className="text-xs text-slate-400">{exercise.nameEn}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{exercise.targetMuscles.join(' · ')}</p>
        </div>
        <span className="text-slate-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">방법</p>
            <p className="text-sm text-slate-700 leading-relaxed">{exercise.howTo}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((eq) => (
              <span key={eq} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {eq}
              </span>
            ))}
          </div>
          {matchedPatternNames && matchedPatternNames.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">해당 패턴</p>
              <div className="flex flex-wrap gap-1.5">
                {matchedPatternNames.map((name) => (
                  <span key={name} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {videoSources && videoSources.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">관련 영상</p>
              <div className="flex flex-col gap-1">
                {videoSources.map((v) => (
                  <a
                    key={v.url}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    ▶ {v.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
