'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadState, saveState } from '@/lib/storage';
import { getExercisesByPatterns } from '@/lib/exercises';
import type { Exercise } from '@/lib/types';

const PURPOSE_COLORS: Record<string, string> = {
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

type SessionPhase = 'intro' | 'active' | 'rest' | 'done';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}초`;
}

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phaseParam = Number(searchParams.get('phase') ?? '1') as 1 | 2 | 3;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>('intro');
  const [restTimer, setRestTimer] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const state = loadState();
    const patternIds = state.detectedPatterns.map((p) => p.id);
    const exs = getExercisesByPatterns(patternIds).filter((e) => e.phase === phaseParam);
    setExercises(exs);

    // Pre-load today's completed
    const today = new Date().toISOString().slice(0, 10);
    const todayLog = state.workoutLogs.find((l) => l.date === today);
    if (todayLog) setCompleted(todayLog.completedExerciseIds);
  }, [phaseParam]);

  const ex = exercises[exIdx];
  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? ((exIdx + (phase === 'done' ? 1 : 0)) / totalExercises) * 100 : 0;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRest = () => {
    if (!ex) return;
    setPhase('rest');
    setRestTimer(ex.prescription.restSec);
    intervalRef.current = setInterval(() => {
      setRestTimer((t) => {
        if (t <= 1) {
          clearTimer();
          advanceSet();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const advanceSet = () => {
    if (!ex) return;
    const nextSet = setIdx + 1;
    if (nextSet >= ex.prescription.sets) {
      // Exercise complete
      const newCompleted = [...completed, ex.id];
      setCompleted(newCompleted);
      saveCompletedLog(newCompleted);

      const nextEx = exIdx + 1;
      if (nextEx >= exercises.length) {
        setPhase('done');
      } else {
        setExIdx(nextEx);
        setSetIdx(0);
        setPhase('intro');
      }
    } else {
      setSetIdx(nextSet);
      setPhase('active');
    }
  };

  const saveCompletedLog = (ids: string[]) => {
    const state = loadState();
    const today = new Date().toISOString().slice(0, 10);
    const logs = state.workoutLogs.filter((l) => l.date !== today);
    saveState({ workoutLogs: [{ date: today, completedExerciseIds: ids }, ...logs] });
  };

  const handleSetDone = () => {
    clearTimer();
    startRest();
  };

  const skipRest = () => {
    clearTimer();
    advanceSet();
  };

  const skipExercise = () => {
    clearTimer();
    const nextEx = exIdx + 1;
    if (nextEx >= exercises.length) {
      setPhase('done');
    } else {
      setExIdx(nextEx);
      setSetIdx(0);
      setPhase('intro');
    }
  };

  useEffect(() => () => clearTimer(), []);

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-500 text-center">분석 결과가 없습니다. 먼저 체크리스트를 작성해주세요.</p>
        <button
          onClick={() => router.push('/checklist')}
          className="px-6 py-3 bg-blue-700 text-white rounded-2xl font-bold"
        >
          체크리스트 작성하기
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-black text-slate-800">세션 완료!</h1>
        <p className="text-slate-500">Phase {phaseParam} 운동 {completed.length}개 완료했습니다</p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push('/recommendation')}
            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl font-medium hover:bg-slate-50"
          >
            루틴으로
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex-1 py-3 bg-blue-700 text-white rounded-2xl font-bold hover:bg-blue-800"
          >
            기록 보기
          </button>
        </div>
      </div>
    );
  }

  if (!ex) return null;

  const { sets, reps, durationSec, eachSide, note } = ex.prescription;
  const volumeStr = reps ? `${reps}회${eachSide ? ' (각 방향)' : ''}` : `${durationSec}초${eachSide ? ' (각 방향)' : ''}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/recommendation')} className="text-slate-400 hover:text-slate-600 text-lg">←</button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>운동 {exIdx + 1}/{totalExercises}</span>
            <span>Phase {phaseParam}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6 gap-5">

        {/* Exercise info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PURPOSE_COLORS[ex.purpose]}`}>
              {PURPOSE_LABELS[ex.purpose]}
            </span>
            <span className="text-xs text-slate-400">세트 {setIdx + 1}/{sets}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">{ex.nameKr}</h2>
          <p className="text-sm text-slate-500">{ex.nameEn}</p>
          <div className="text-4xl font-black text-blue-700 py-2">{volumeStr}</div>
          <p className="text-sm text-slate-600 leading-relaxed">{ex.howTo}</p>
          {note && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700 font-medium">💡 {note}</p>
            </div>
          )}
          <p className="text-xs text-slate-400">{ex.targetMuscles.join(' · ')}</p>
        </div>

        {/* Rest timer */}
        {phase === 'rest' && (
          <div className="bg-blue-700 text-white rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm font-medium opacity-80">휴식 중</p>
            <p className="text-5xl font-black">{formatTime(restTimer)}</p>
            <p className="text-sm opacity-70">
              {setIdx + 1 < sets
                ? `다음: 세트 ${setIdx + 2}/${sets}`
                : exIdx + 1 < exercises.length
                ? `다음 운동: ${exercises[exIdx + 1].nameKr}`
                : '마지막 운동'}
            </p>
            <button
              onClick={skipRest}
              className="mt-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
            >
              건너뛰기
            </button>
          </div>
        )}

        {/* Action buttons */}
        {(phase === 'intro' || phase === 'active') && (
          <div className="space-y-3">
            <button
              onClick={phase === 'intro' ? () => setPhase('active') : handleSetDone}
              className="w-full py-5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xl rounded-2xl transition-colors shadow-md"
            >
              {phase === 'intro' ? '시작하기' : '세트 완료 ✓'}
            </button>
            <button
              onClick={skipExercise}
              className="w-full py-3 text-slate-400 text-sm hover:text-slate-600 transition-colors"
            >
              이 운동 건너뛰기
            </button>
          </div>
        )}

        {/* Upcoming exercises */}
        {exIdx + 1 < exercises.length && phase !== 'rest' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 px-1">다음 운동</p>
            {exercises.slice(exIdx + 1, exIdx + 4).map((next, i) => (
              <div key={next.id} className="bg-white rounded-xl border border-slate-100 px-4 py-2.5 flex items-center gap-3 opacity-60">
                <span className="text-xs text-slate-400 w-4">{exIdx + 2 + i}</span>
                <span className="text-sm font-medium text-slate-700 flex-1">{next.nameKr}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PURPOSE_COLORS[next.purpose]}`}>
                  {PURPOSE_LABELS[next.purpose]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
