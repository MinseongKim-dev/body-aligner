'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProgressSteps from '@/components/ProgressSteps';
import { loadState, saveState } from '@/lib/storage';
import type { PhotoAnalysisResult } from '@/lib/types';

const PhotoAnalyzer = dynamic(() => import('@/components/PhotoAnalyzer'), { ssr: false });

const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-sky-600 bg-sky-50 border-sky-200',
};

const SEVERITY_LABELS: Record<string, string> = { high: '심각', medium: '중간', low: '경미' };

export default function PhotoPage() {
  const router = useRouter();
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const state = loadState();
    if (state.photoAnalysis) setResult(state.photoAnalysis);
  }, []);

  const handleResult = (r: PhotoAnalysisResult) => {
    setResult(r);
    saveState({ photoAnalysis: r });
  };

  const goNext = () => router.push('/analysis');
  const handleSkip = () => {
    saveState({ photoAnalysis: null });
    setSkipped(true);
    router.push('/analysis');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">사진 포즈 분석</h1>
          <p className="text-slate-500 text-sm mt-1">
            MediaPipe Pose로 관절 각도를 자동 측정합니다. 선택 사항이며 건너뛸 수 있습니다.
          </p>
        </div>

        <PhotoAnalyzer onResult={handleResult} />

        {/* Results */}
        {result && result.issues.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800">감지된 이슈</h3>
            {result.issues.map((issue, i) => (
              <div key={i} className={`rounded-xl border p-3 ${SEVERITY_COLORS[issue.severity]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{issue.description}</span>
                  <span className="text-xs font-bold">{SEVERITY_LABELS[issue.severity]}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">어깨 기울기</p>
                <p className="font-bold">{Math.abs(result.shoulderTiltDeg).toFixed(1)}°</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">골반 기울기</p>
                <p className="font-bold">{Math.abs(result.hipTiltDeg).toFixed(1)}°</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">좌측 발 외회전</p>
                <p className="font-bold">{Math.abs(result.leftFootAngleDeg).toFixed(0)}°</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">우측 발 외회전</p>
                <p className="font-bold">{Math.abs(result.rightFootAngleDeg).toFixed(0)}°</p>
              </div>
            </div>
          </div>
        )}

        {result && result.issues.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
            <p className="text-emerald-700 font-bold">✓ 사진 분석 결과 큰 이상이 감지되지 않았습니다</p>
            <p className="text-sm text-emerald-600 mt-1">체크리스트 결과로 패턴을 파악합니다.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 text-slate-500 border border-slate-200 rounded-2xl hover:bg-slate-50 font-medium transition-colors"
          >
            건너뛰기
          </button>
          <button
            onClick={goNext}
            disabled={!result && !skipped}
            className="flex-2 flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl transition-colors disabled:opacity-40"
          >
            {result ? '분석 결과 보기 →' : '계속하기 →'}
          </button>
        </div>
      </main>
    </div>
  );
}
