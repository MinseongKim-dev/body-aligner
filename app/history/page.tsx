'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, clearState } from '@/lib/storage';
import type { AssessmentSnapshot, WorkoutLog } from '@/lib/types';

const SEVERITY_COLOR: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-sky-400',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function MiniBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-10 text-right">{value.toFixed(1)}°</span>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<AssessmentSnapshot[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const state = loadState();
    setHistory(state.assessmentHistory ?? []);
    const wlogs = state.workoutLogs ?? [];
    setLogs(wlogs);
    setStreak(computeStreak(wlogs));
  }, []);

  function computeStreak(wlogs: WorkoutLog[]): number {
    if (wlogs.length === 0) return 0;
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (wlogs.some((l) => l.date === key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  const totalWorkouts = logs.reduce((sum, l) => sum + l.completedExerciseIds.length, 0);

  // For trend chart: last 5 assessments with photo data
  const withPhoto = history.filter((h) => h.photoAnalyses.length > 0).slice(0, 5).reverse();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 text-lg">←</button>
        <h1 className="text-lg font-black text-slate-800">진행 기록</h1>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-700">{streak}</p>
            <p className="text-xs text-slate-500 mt-1">연속 운동일</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{totalWorkouts}</p>
            <p className="text-xs text-slate-500 mt-1">총 운동 완료</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-slate-700">{history.length}</p>
            <p className="text-xs text-slate-500 mt-1">체형 평가 횟수</p>
          </div>
        </div>

        {/* Workout log calendar (last 4 weeks) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4">운동 달력 (최근 4주)</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} className="text-center text-xs text-slate-400 pb-1">{d}</div>
            ))}
            {(() => {
              const today = new Date();
              const cells = [];
              // Fill leading empty cells based on day of week 28 days ago
              const start = new Date(today);
              start.setDate(today.getDate() - 27);
              const startDow = start.getDay();
              for (let i = 0; i < startDow; i++) {
                cells.push(<div key={`pad-${i}`} />);
              }
              for (let i = 0; i < 28; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const key = d.toISOString().slice(0, 10);
                const done = logs.some((l) => l.date === key);
                const isToday = key === today.toISOString().slice(0, 10);
                cells.push(
                  <div
                    key={key}
                    title={key}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                      done
                        ? 'bg-emerald-500 text-white'
                        : isToday
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {d.getDate()}
                  </div>,
                );
              }
              return cells;
            })()}
          </div>
          {logs.length === 0 && (
            <p className="text-center text-sm text-slate-400 mt-4">
              세션 모드로 운동하면 기록이 쌓입니다
            </p>
          )}
        </div>

        {/* Measurement trend */}
        {withPhoto.length >= 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">측정 수치 추이</h2>
            {withPhoto.length === 1 && (
              <p className="text-xs text-slate-400 mb-3">평가 데이터가 1개입니다. 재평가 후 변화를 비교할 수 있습니다.</p>
            )}
            <div className="space-y-4">
              {withPhoto.map((snap) => {
                const front = snap.photoAnalyses.find((p) => p.type === 'front');
                if (!front) return null;
                const shoulderAbs = Math.abs(front.shoulderTiltDeg);
                const hipAbs = Math.abs(front.hipTiltDeg);
                return (
                  <div key={snap.date}>
                    <p className="text-xs font-semibold text-slate-500 mb-2">{formatDate(snap.date)}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">어깨 기울기</p>
                        <MiniBar
                          value={shoulderAbs}
                          max={15}
                          color={shoulderAbs > 7 ? 'bg-red-400' : shoulderAbs > 3 ? 'bg-amber-400' : 'bg-emerald-400'}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">골반 기울기</p>
                        <MiniBar
                          value={hipAbs}
                          max={10}
                          color={hipAbs > 5 ? 'bg-red-400' : hipAbs > 2 ? 'bg-amber-400' : 'bg-emerald-400'}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assessment history */}
        <div className="space-y-3">
          <h2 className="font-bold text-slate-700">체형 평가 기록</h2>
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-400">
              아직 저장된 평가 기록이 없습니다.
              <br />분석을 완료하면 자동으로 저장됩니다.
            </div>
          ) : (
            history.map((snap, idx) => (
              <div key={snap.date} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-700 text-sm">{formatDate(snap.date)}</p>
                  {idx === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">최신</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {snap.detectedPatterns.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
                      style={{}}
                    >
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${SEVERITY_COLOR[p.severity]}`}
                      />
                      {p.name}
                    </span>
                  ))}
                  {snap.detectedPatterns.length === 0 && (
                    <span className="text-xs text-slate-400">감지된 패턴 없음</span>
                  )}
                </div>
                {snap.photoAnalyses.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    사진 분석 {snap.photoAnalyses.length}개 포함
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Reset data */}
        <div className="pt-2 border-t border-slate-200">
          <button
            onClick={() => {
              if (confirm('모든 분석 데이터와 기록을 초기화하시겠습니까? 되돌릴 수 없습니다.')) {
                clearState();
                router.push('/');
              }
            }}
            className="w-full py-3 text-red-500 border border-red-200 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            데이터 전체 초기화
          </button>
        </div>
      </main>
    </div>
  );
}
