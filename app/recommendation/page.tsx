'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressSteps from '@/components/ProgressSteps';
import ExerciseCard from '@/components/ExerciseCard';
import { loadState } from '@/lib/storage';
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

export default function RecommendationPage() {
  const router = useRouter();
  const [patterns, setPatterns] = useState<BodyPattern[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([]);
  const [activePhase, setActivePhase] = useState(1);

  useEffect(() => {
    const state = loadState();
    setPatterns(state.detectedPatterns);
    setVideoAnalyses(state.videoAnalyses);
    const exs = getExercisesByPatterns(state.detectedPatterns.map((p) => p.id));
    setExercises(exs);
  }, []);

  const byPhase = (phase: number) => exercises.filter((e) => e.phase === phase);

  const patternNameFor = (ex: Exercise) =>
    patterns
      .filter((p) => ex.patternIds.includes(p.id))
      .map((p) => p.name);

  const phaseNumbers = [1, 2, 3].filter((p) => byPhase(p).length > 0);

  const SESSION_ORDER = [
    { key: 'stretch', label: '스트레칭' },
    { key: 'mobility', label: '가동범위' },
    { key: 'activation', label: '활성화' },
    { key: 'strength', label: '근력 강화' },
  ];

  const todayRoutine = exercises.filter((e) => e.phase === 1);

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">맞춤 운동 루틴</h1>
          <p className="text-slate-500 text-sm mt-1">
            감지된 {patterns.length}가지 패턴 기반으로 생성된 맞춤 교정 루틴입니다.
          </p>
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

        {/* Summary */}
        {patterns.length > 0 && (
          <>
            <div className="bg-slate-900 text-white rounded-2xl p-5">
              <p className="text-xs text-slate-400 font-semibold mb-2">운동 순서 (매 세션)</p>
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
              {activePhase === 1 && (
                <p className="text-xs mt-1 opacity-80">
                  맨몸으로 시작. 활성화와 가동범위 확보가 목표. 통증 없이 수행 가능해야 합니다.
                </p>
              )}
              {activePhase === 2 && (
                <p className="text-xs mt-1 opacity-80">
                  밴드나 가벼운 중량을 이용한 기초 근력. Phase 1 동작이 편해진 후 진입하세요.
                </p>
              )}
              {activePhase === 3 && (
                <p className="text-xs mt-1 opacity-80">
                  복합 기능적 움직임. 일상·스포츠 동작으로 통합. Phase 2 완료 후 진입하세요.
                </p>
              )}
            </div>

            {/* Exercises for active phase */}
            {SESSION_ORDER.map(({ key, label }) => {
              const exs = byPhase(activePhase).filter((e) => e.purpose === key);
              if (exs.length === 0) return null;
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-bold text-slate-500 px-2">{ORDER_LABEL[key] || label}</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  {exs.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      matchedPatternNames={patternNameFor(ex)}
                      videoSources={buildVideoSources(ex.id, videoAnalyses)}
                      showPhase={false}
                    />
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

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 leading-relaxed">
              ⚠️ 이 루틴은 의료 진단을 대체하지 않습니다. 통증이 발생하면 즉시 중단하고 전문가와 상담하세요. 보수적으로 시작하여 점진적으로 강도를 높이세요.
            </div>
          </>
        )}

        <div className="flex gap-3">
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
    </div>
  );
}
