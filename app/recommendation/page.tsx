'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressSteps from '@/components/ProgressSteps';
import ExerciseCard from '@/components/ExerciseCard';
import { loadState, saveState } from '@/lib/storage';
import { getExercisesByPatterns, EXERCISES } from '@/lib/exercises';
import type { BodyPattern, Exercise, VideoAnalysis } from '@/lib/types';

const PHASE_INFO: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: 'Phase 1', desc: '활성화 + 가동범위 (맨몸)', color: 'bg-sky-50 border-sky-200 text-sky-800' },
  2: { label: 'Phase 2', desc: '기초 근력 (밴드/경량)', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  3: { label: 'Phase 3', desc: '기능적 움직임 (복합 운동)', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
};

const ORDER_LABEL: Record<string, string> = {
  stretch: '① 스트레칭',
  mobility: '② 가동범위',
  activation: '③ 활성화',
  strength: '④ 근력',
};

const SESSION_ORDER = [
  { key: 'stretch', label: '스트레칭' },
  { key: 'mobility', label: '가동범위' },
  { key: 'activation', label: '활성화' },
  { key: 'strength', label: '근력 강화' },
];

// 4-day weekly split
const WEEKLY_PLAN = [
  { day: '월', label: 'Day A', focus: 'Phase 1 — 스트레칭 + 가동범위', phases: [1], purposes: ['stretch', 'mobility'] },
  { day: '화', label: 'Day B', focus: 'Phase 1 — 활성화 + Phase 2', phases: [1, 2], purposes: ['activation', 'strength'] },
  { day: '수', label: '휴식', focus: '가벼운 걷기 또는 완전 휴식', phases: [], purposes: [] },
  { day: '목', label: 'Day A', focus: 'Phase 1 — 스트레칭 + 가동범위', phases: [1], purposes: ['stretch', 'mobility'] },
  { day: '금', label: 'Day B', focus: 'Phase 1 — 활성화 + Phase 2', phases: [1, 2], purposes: ['activation', 'strength'] },
  { day: '토', label: 'Day C', focus: 'Phase 2-3 — 근력 + 기능', phases: [2, 3], purposes: ['strength'] },
  { day: '일', label: '휴식', focus: '회복 및 스트레칭', phases: [], purposes: [] },
];

function buildVideoSources(exerciseId: string, analyses: VideoAnalysis[]) {
  const sources: { url: string; label: string }[] = [];
  for (const a of analyses) {
    for (const ex of a.exercises) {
      if (ex.exerciseId === exerciseId) {
        sources.push({ url: a.url, label: a.title || a.url });
      }
    }
  }
  return sources;
}

type MainTab = 'routine' | 'weekly';

export default function RecommendationPage() {
  const router = useRouter();
  const [patterns, setPatterns] = useState<BodyPattern[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([]);
  const [activePhase, setActivePhase] = useState(1);
  const [mainTab, setMainTab] = useState<MainTab>('routine');
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  useEffect(() => {
    const state = loadState();
    setPatterns(state.detectedPatterns);
    setVideoAnalyses(state.videoAnalyses);
    const exs = getExercisesByPatterns(state.detectedPatterns.map((p) => p.id));
    setExercises(exs);

    const today = new Date().toISOString().slice(0, 10);
    const todayLog = (state.workoutLogs ?? []).find((l) => l.date === today);
    if (todayLog) setCompletedToday(todayLog.completedExerciseIds);
  }, []);

  const byPhase = (phase: number) => exercises.filter((e) => e.phase === phase);
  const phaseNumbers = [1, 2, 3].filter((p) => byPhase(p).length > 0);

  const patternNameFor = (ex: Exercise) =>
    patterns.filter((p) => ex.patternIds.includes(p.id)).map((p) => p.name);

  const toggleComplete = (exId: string) => {
    const updated = completedToday.includes(exId)
      ? completedToday.filter((id) => id !== exId)
      : [...completedToday, exId];
    setCompletedToday(updated);
    const state = loadState();
    const today = new Date().toISOString().slice(0, 10);
    const logs = (state.workoutLogs ?? []).filter((l) => l.date !== today);
    saveState({ workoutLogs: [{ date: today, completedExerciseIds: updated }, ...logs] });
  };

  const doneCount = exercises.filter((e) => completedToday.includes(e.id)).length;
  const pct = exercises.length > 0 ? (doneCount / exercises.length) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6 print:py-4 print:px-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">맞춤 운동 루틴</h1>
            <p className="text-slate-500 text-sm mt-1">
              감지된 {patterns.length}가지 패턴 기반 맞춤 교정 루틴
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => router.push('/history')}
              className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              📊 기록
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              🖨️ 출력
            </button>
          </div>
        </div>

        {/* No patterns */}
        {patterns.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-slate-600 font-medium mb-3">분석 데이터가 없습니다</p>
            <button onClick={() => router.push('/checklist')} className="text-blue-700 font-medium hover:underline text-sm">
              체크리스트 작성하러 가기 →
            </button>
          </div>
        )}

        {patterns.length > 0 && (
          <>
            {/* Today's progress */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm print:hidden">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">오늘 진행률</p>
                <span className="text-sm font-bold text-blue-700">{doneCount}/{exercises.length}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <button
                onClick={() => router.push(`/session?phase=${activePhase}`)}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors"
              >
                ▶ 세션 모드로 운동 시작 (Phase {activePhase})
              </button>
            </div>

            {/* Main tabs */}
            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => setMainTab('routine')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                  mainTab === 'routine'
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                운동 루틴
              </button>
              <button
                onClick={() => setMainTab('weekly')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                  mainTab === 'weekly'
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                주간 계획
              </button>
            </div>

            {/* ── 운동 루틴 탭 ── */}
            {(mainTab === 'routine' || true) && (
              <div className={mainTab === 'weekly' ? 'hidden print:block' : ''}>
                {/* Session order */}
                <div className="bg-slate-900 text-white rounded-2xl p-5">
                  <p className="text-xs font-semibold text-slate-400 mb-3">매 세션 순서</p>
                  <div className="flex items-center gap-2 flex-wrap text-sm font-medium">
                    <span className="bg-slate-700 px-2 py-1 rounded-lg">마사지</span>
                    <span className="text-slate-600">→</span>
                    <span className="bg-sky-900 px-2 py-1 rounded-lg">가동범위</span>
                    <span className="text-slate-600">→</span>
                    <span className="bg-amber-900 px-2 py-1 rounded-lg">활성화</span>
                    <span className="text-slate-600">→</span>
                    <span className="bg-emerald-900 px-2 py-1 rounded-lg">근력</span>
                    <span className="text-slate-600">→</span>
                    <span className="bg-slate-700 px-2 py-1 rounded-lg">보행 연습</span>
                  </div>
                </div>

                {/* Phase tabs */}
                <div className="flex gap-2">
                  {phaseNumbers.map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setActivePhase(phase)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                        activePhase === phase
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Phase {phase}
                      <span className="block text-xs font-normal opacity-75">{PHASE_INFO[phase].desc.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Phase description */}
                <div className={`rounded-2xl border p-4 ${PHASE_INFO[activePhase]?.color}`}>
                  <p className="font-bold text-sm">{PHASE_INFO[activePhase]?.label}: {PHASE_INFO[activePhase]?.desc}</p>
                  {activePhase === 1 && <p className="text-xs mt-1 opacity-80">맨몸으로 시작. 활성화와 가동범위 확보가 목표.</p>}
                  {activePhase === 2 && <p className="text-xs mt-1 opacity-80">밴드나 가벼운 중량 기초 근력. Phase 1 이후 진입.</p>}
                  {activePhase === 3 && <p className="text-xs mt-1 opacity-80">복합 기능적 움직임. Phase 2 완료 후 진입.</p>}
                </div>

                {/* Exercises */}
                {SESSION_ORDER.map(({ key }) => {
                  const exs = byPhase(activePhase).filter((e) => e.purpose === key);
                  if (exs.length === 0) return null;
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-bold text-slate-500 px-2">{ORDER_LABEL[key]}</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                      {exs.map((ex) => (
                        <div key={ex.id} className="relative">
                          <ExerciseCard
                            exercise={ex}
                            matchedPatternNames={patternNameFor(ex)}
                            videoSources={buildVideoSources(ex.id, videoAnalyses)}
                            showPhase={false}
                          />
                          {/* Check-off button */}
                          <button
                            onClick={() => toggleComplete(ex.id)}
                            className={`absolute top-4 right-12 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all print:hidden ${
                              completedToday.includes(ex.id)
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 bg-white text-transparent hover:border-emerald-400'
                            }`}
                            title={completedToday.includes(ex.id) ? '완료 취소' : '완료 체크'}
                          >
                            ✓
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Transition criteria */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <p className="text-sm font-bold text-slate-700">단계 전환 기준</p>
                  <div className="space-y-1.5 text-sm text-slate-600">
                    <p>✓ <strong>Phase 2 진입:</strong> 한발서기 30초 흔들림 없이 가능, Phase 1 동작 모두 통증 없음</p>
                    <p>✓ <strong>Phase 3 진입:</strong> 밴드 스쿼트 시 무릎 정렬 유지, 싱글 레그 브릿지 12회 가능</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── 주간 계획 탭 ── */}
            {mainTab === 'weekly' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">교정 운동은 주 3-4회가 효과적입니다. 아래 4일 스플릿을 따르세요.</p>
                {WEEKLY_PLAN.map(({ day, label, focus, phases, purposes }) => {
                  const dayExercises = exercises.filter(
                    (e) => phases.includes(e.phase) && (purposes.length === 0 || purposes.includes(e.purpose)),
                  );
                  const isRest = phases.length === 0;
                  return (
                    <div
                      key={day}
                      className={`rounded-2xl border p-4 ${
                        isRest ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-lg font-black w-8 text-center ${isRest ? 'text-slate-400' : 'text-blue-700'}`}>
                          {day}
                        </span>
                        <div>
                          <span className={`text-sm font-bold ${isRest ? 'text-slate-400' : 'text-slate-700'}`}>{label}</span>
                          <p className="text-xs text-slate-400">{focus}</p>
                        </div>
                      </div>
                      {!isRest && dayExercises.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-11">
                          {dayExercises.slice(0, 8).map((ex) => (
                            <span key={ex.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {ex.nameKr}
                            </span>
                          ))}
                          {dayExercises.length > 8 && (
                            <span className="text-xs text-slate-400">+{dayExercises.length - 8}개</span>
                          )}
                        </div>
                      )}
                      {!isRest && dayExercises.length > 0 && (
                        <div className="mt-3 ml-11">
                          <button
                            onClick={() => {
                              setMainTab('routine');
                              if (phases[0]) setActivePhase(phases[0] as 1 | 2 | 3);
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            이 날 운동 보기 →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 leading-relaxed">
              ⚠️ 이 루틴은 의료 진단을 대체하지 않습니다. 통증이 발생하면 즉시 중단하고 전문가와 상담하세요.
            </div>
          </>
        )}

        <div className="flex gap-3 print:hidden">
          <button
            onClick={() => router.push('/video')}
            className="flex-1 py-3 text-slate-500 border border-slate-200 rounded-2xl hover:bg-slate-50 font-medium"
          >
            ← 영상 추가
          </button>
          <button
            onClick={() => router.push('/checklist')}
            className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl transition-colors"
          >
            새 분석 시작
          </button>
        </div>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, .print\\:hidden { display: none !important; }
          body { background: white; }
          main { max-width: 100% !important; padding: 0 !important; }
          .rounded-2xl { border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}
