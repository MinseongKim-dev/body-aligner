'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProgressSteps from '@/components/ProgressSteps';
import { loadState, saveState } from '@/lib/storage';
import type { PhotoAnalysisResult, PhotoType } from '@/lib/types';

const PhotoAnalyzer = dynamic(() => import('@/components/PhotoAnalyzer'), { ssr: false });

const PHOTO_TYPES: { type: PhotoType; label: string; icon: string }[] = [
  { type: 'front', label: '전신 정면', icon: '🧍' },
  { type: 'side', label: '전신 측면', icon: '🚶' },
  { type: 'ankle', label: '발목', icon: '🦶' },
  { type: 'knee', label: '무릎', icon: '🦵' },
  { type: 'shoulder', label: '어깨', icon: '💪' },
];

const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-sky-600 bg-sky-50 border-sky-200',
};

const SEVERITY_LABELS: Record<string, string> = { high: '심각', medium: '중간', low: '경미' };

export default function PhotoPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<PhotoType>('front');
  const [results, setResults] = useState<Record<string, PhotoAnalysisResult>>({});

  useEffect(() => {
    const state = loadState();
    if (state.photoAnalyses && state.photoAnalyses.length > 0) {
      const map: Record<string, PhotoAnalysisResult> = {};
      state.photoAnalyses.forEach((r) => { map[r.type] = r; });
      setResults(map);
    }
  }, []);

  const handleResult = (r: PhotoAnalysisResult) => {
    const updated = { ...results, [r.type]: r };
    setResults(updated);
    saveState({ photoAnalyses: Object.values(updated) });
  };

  const removeResult = (type: PhotoType) => {
    const updated = { ...results };
    delete updated[type];
    setResults(updated);
    saveState({ photoAnalyses: Object.values(updated) });
  };

  const activeResult = results[activeType];
  const totalAnalyzed = Object.keys(results).length;

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">부위별 사진 분석</h1>
          <p className="text-slate-500 text-sm mt-1">
            MediaPipe Pose로 관절 각도를 자동 측정합니다. 사진은 브라우저에서만 처리됩니다.
          </p>
          {totalAnalyzed > 0 && (
            <p className="text-blue-600 text-sm font-medium mt-1">
              {totalAnalyzed}개 부위 분석 완료
            </p>
          )}
        </div>

        {/* Photo type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PHOTO_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                activeType === type
                  ? 'bg-blue-700 text-white'
                  : results[type]
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {results[type] && activeType !== type && (
                <span className="text-xs">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Analyzer for active type */}
        {activeResult ? (
          <div className="space-y-4">
            {/* Show re-analyze option */}
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <span className="text-sm text-emerald-700 font-medium">
                ✓ {PHOTO_TYPES.find((t) => t.type === activeType)?.label} 분석 완료
              </span>
              <button
                onClick={() => removeResult(activeType)}
                className="text-xs text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg px-3 py-1 hover:border-red-300 transition-colors"
              >
                다시 분석
              </button>
            </div>

            {/* Issue display */}
            {activeResult.issues.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800">감지된 이슈</h3>
                {activeResult.issues.map((issue, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${SEVERITY_COLORS[issue.severity]}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{issue.description}</span>
                      <span className="text-xs font-bold">{SEVERITY_LABELS[issue.severity]}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <p className="text-emerald-700 font-bold">✓ 이 사진에서 큰 이상이 감지되지 않았습니다</p>
              </div>
            )}

            {/* Measurements */}
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">어깨 기울기</p>
                <p className="font-bold">{Math.abs(activeResult.shoulderTiltDeg).toFixed(1)}°</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">골반 기울기</p>
                <p className="font-bold">{Math.abs(activeResult.hipTiltDeg).toFixed(1)}°</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">좌측 발 외회전</p>
                <p className="font-bold">{Math.abs(activeResult.leftFootAngleDeg).toFixed(0)}°</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">우측 발 외회전</p>
                <p className="font-bold">{Math.abs(activeResult.rightFootAngleDeg).toFixed(0)}°</p>
              </div>
              {activeResult.forwardHeadMm !== undefined && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">두부 전방 변위</p>
                  <p className="font-bold">{activeResult.forwardHeadMm > 30 ? '⚠️ 전방 변위' : '정상'}</p>
                </div>
              )}
              {activeResult.anteriorPelvicTilt !== undefined && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">골반 전방경사</p>
                  <p className="font-bold">{activeResult.anteriorPelvicTilt > 10 ? '⚠️ 전방경사' : '정상'}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <PhotoAnalyzer key={activeType} photoType={activeType} onResult={handleResult} />
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              saveState({ photoAnalyses: Object.values(results) });
              router.push('/analysis');
            }}
            className="flex-1 py-3 text-slate-500 border border-slate-200 rounded-2xl hover:bg-slate-50 font-medium transition-colors"
          >
            건너뛰기
          </button>
          <button
            onClick={() => {
              saveState({ photoAnalyses: Object.values(results) });
              router.push('/analysis');
            }}
            disabled={totalAnalyzed === 0}
            className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl transition-colors disabled:opacity-40"
          >
            {totalAnalyzed > 0 ? `분석 결과 보기 (${totalAnalyzed}개) →` : '계속하기 →'}
          </button>
        </div>
      </main>
    </div>
  );
}
