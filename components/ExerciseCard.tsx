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

function PrescriptionBadge({ exercise }: { exercise: Exercise }) {
  const { sets, reps, durationSec, restSec, eachSide } = exercise.prescription;
  const volumeStr = reps
    ? `${reps}회`
    : durationSec
    ? `${durationSec}초`
    : '';
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
        {sets}세트 × {volumeStr}
        {eachSide && <span className="font-normal text-blue-500"> (각 방향)</span>}
      </span>
      <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm">
        휴식 {restSec}초
      </span>
    </div>
  );
}

export default function ExerciseCard({ exercise, matchedPatternNames, videoSources, showPhase }: Props) {
  const [open, setOpen] = useState(false);

  const demoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.demoSearchQuery)}`;

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
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PURPOSE_STYLES[exercise.purpose]}`}>
              {PURPOSE_LABELS[exercise.purpose]}
            </span>
            <span className="text-xs text-slate-400">{DIFFICULTY_LABELS[exercise.difficulty]}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h4 className="font-bold text-slate-800 text-base">{exercise.nameKr}</h4>
            <span className="text-xs text-slate-400">{exercise.nameEn}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{exercise.targetMuscles.join(' · ')}</p>
          {/* Prescription summary always visible */}
          <PrescriptionBadge exercise={exercise} />
        </div>
        <span className="text-slate-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">방법</p>
            <p className="text-sm text-slate-700 leading-relaxed">{exercise.howTo}</p>
          </div>

          {exercise.prescription.note && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700 font-medium">💡 {exercise.prescription.note}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {exercise.equipment.map((eq) => (
              <span key={eq} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {eq}
              </span>
            ))}
          </div>

          {/* Demo search link */}
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium hover:bg-red-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-600" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
            </svg>
            동작 시범 영상 검색
          </a>

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
