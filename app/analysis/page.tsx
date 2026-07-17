'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressSteps from '@/components/ProgressSteps';
import PatternCard from '@/components/PatternCard';
import { loadState, saveState } from '@/lib/storage';
import { detectPatterns } from '@/lib/patterns';
import type { BodyPattern } from '@/lib/types';

const PRIORITY_CHAIN = [
  { label: '발목', icon: '🦶' },
  { label: '무릎', icon: '🦵' },
  { label: '고관절', icon: '🦴' },
  { label: '골반', icon: '🔵' },
  { label: '코어', icon: '💪' },
  { label: '어깨', icon: '⬆️' },
];

export default function AnalysisPage() {
  const router = useRouter();
  const [patterns, setPatterns] = useState<BodyPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = loadState();
    const detected = detectPatterns(
      state.checklistAnswers,
      state.painLocations,
      state.photoAnalyses,
    );
    setPatterns(detected);
    saveState({ detectedPatterns: detected });
    setLoading(false);
  }, []);

  const hasPatterns = patterns.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">체형 패턴 분석 결과</h1>
          <p className="text-slate-500 text-sm mt-1">
            체크리스트와 사진 분석을 종합한 결과입니다.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasPatterns ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-bold text-emerald-800 text-lg mb-2">큰 문제 패턴이 감지되지 않았습니다</h3>
            <p className="text-sm text-emerald-600">
              체크리스트에서 더 많은 증상을 체크하거나, 사진 분석을 진행해 보세요.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-blue-700 text-white rounded-2xl p-5">
              <p className="text-sm font-medium opacity-80 mb-1">감지된 패턴</p>
              <p className="text-3xl font-black mb-3">{patterns.length}가지</p>
              <div className="flex flex-wrap gap-2">
                {patterns.map((p) => (
                  <span key={p.id} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Correction priority chain */}
            <div className="bg-slate-800 text-white rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 mb-3">교정 우선순위 (아래에서 위로)</p>
              <div className="flex items-center gap-1 flex-wrap">
                {PRIORITY_CHAIN.map((node, idx) => {
                  const isActive = patterns.some((p) =>
                    p.id.includes(node.label === '발목' ? 'ankle' :
                      node.label === '무릎' ? 'knee' :
                      node.label === '고관절' ? 'hip_external' :
                      node.label === '골반' ? 'pelvic' :
                      node.label === '코어' ? 'core' : 'upper'),
                  );
                  return (
                    <span key={node.label} className="flex items-center gap-1">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {node.icon} {node.label}
                      </span>
                      {idx < PRIORITY_CHAIN.length - 1 && (
                        <span className="text-slate-600 text-sm">→</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Pattern cards */}
            <div className="space-y-4">
              <h2 className="font-bold text-slate-700">우선 교정 순서</h2>
              {patterns.map((pattern, idx) => (
                <PatternCard key={pattern.id} pattern={pattern} rank={idx + 1} />
              ))}
            </div>

            {/* Cascade explanation */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-amber-800 mb-2">💡 연쇄 패턴이란?</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                체형 문제는 하나로 끝나지 않습니다. 발목 가동범위 부족이 무릎 내측 붕괴를 만들고, 이것이 둔근 비활성을 유발하며 골반 비대칭으로 이어집니다. 아래에서 위로, 우선순위가 높은 패턴부터 교정하는 것이 핵심입니다.
              </p>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/checklist')}
            className="flex-1 py-3 text-slate-500 border border-slate-200 rounded-2xl hover:bg-slate-50 font-medium transition-colors"
          >
            ← 다시 하기
          </button>
          <button
            onClick={() => router.push('/video')}
            className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl transition-colors"
          >
            유튜브 영상 매칭 →
          </button>
        </div>
      </main>
    </div>
  );
}
