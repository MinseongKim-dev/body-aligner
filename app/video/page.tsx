'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressSteps from '@/components/ProgressSteps';
import { loadState, saveState } from '@/lib/storage';
import { matchExercisesFromTranscript } from '@/lib/exercise-keywords';
import type { VideoAnalysis, BodyPattern } from '@/lib/types';

export default function VideoPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState<VideoAnalysis[]>([]);
  const [patterns, setPatterns] = useState<BodyPattern[]>([]);

  useEffect(() => {
    const state = loadState();
    setAnalyses(state.videoAnalyses);
    setPatterns(state.detectedPatterns);
  }, []);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/transcript?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '자막 추출에 실패했습니다.');
        return;
      }

      const exercises = matchExercisesFromTranscript(data.transcript);

      // Extract video ID from URL
      const match = url.match(/(?:youtu\.be\/|watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);
      const videoId = match?.[1] ?? 'unknown';

      const newAnalysis: VideoAnalysis = {
        videoId,
        url: url.trim(),
        title: data.title,
        exercises,
        analyzedAt: new Date().toISOString(),
      };

      const updated = [newAnalysis, ...analyses.filter((a) => a.videoId !== videoId)];
      setAnalyses(updated);
      saveState({ videoAnalyses: updated });
      setUrl('');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const removeAnalysis = (videoId: string) => {
    const updated = analyses.filter((a) => a.videoId !== videoId);
    setAnalyses(updated);
    saveState({ videoAnalyses: updated });
  };

  const matchesPattern = (patternIds: string[]) =>
    patternIds.some((p) => patterns.map((pt) => pt.id).includes(p));

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">유튜브 영상 운동 추출</h1>
          <p className="text-slate-500 text-sm mt-1">
            유튜브 URL을 입력하면 자막에서 운동 정보를 자동 추출합니다. 자막이 있는 영상이어야 합니다.
          </p>
        </div>

        {/* URL input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <label className="block text-sm font-semibold text-slate-700">유튜브 영상 URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={analyze}
              disabled={loading || !url.trim()}
              className="px-5 py-3 bg-blue-700 text-white rounded-xl font-medium text-sm hover:bg-blue-800 transition-colors disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  추출 중
                </span>
              ) : (
                '분석'
              )}
            </button>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </div>
          )}
          <p className="text-xs text-slate-400">
            * 한국어·영어 자막이 있는 운동 영상에서 가장 잘 작동합니다
          </p>
        </div>

        {/* Pattern badges */}
        {patterns.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">내 체형 패턴 (매칭 기준)</p>
            <div className="flex flex-wrap gap-2">
              {patterns.map((p) => (
                <span key={p.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Analyzed videos */}
        {analyses.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-700">분석된 영상 ({analyses.length}개)</h2>
            {analyses.map((analysis) => (
              <div key={analysis.videoId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Video header */}
                <div className="flex items-start gap-3 p-4 border-b border-slate-100">
                  <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    <img
                      src={`https://img.youtube.com/vi/${analysis.videoId}/mqdefault.jpg`}
                      alt={analysis.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm line-clamp-2 leading-tight">
                      {analysis.title || '제목 없음'}
                    </p>
                    <a
                      href={analysis.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      YouTube에서 보기 ↗
                    </a>
                  </div>
                  <button
                    onClick={() => removeAnalysis(analysis.videoId)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Exercises */}
                {analysis.exercises.length === 0 ? (
                  <p className="p-4 text-sm text-slate-400">인식된 운동이 없습니다. 자막에 운동 이름이 포함된 영상을 시도해보세요.</p>
                ) : (
                  <div className="p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 mb-3">
                      추출된 운동 {analysis.exercises.length}개
                    </p>
                    {analysis.exercises.map((ex, i) => {
                      const matched = patterns.length === 0 || matchesPattern(ex.patternIds);
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border p-3 ${
                            matched
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-slate-100 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-slate-800">{ex.name}</span>
                                {matched && patterns.length > 0 && (
                                  <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    ✓ 내 패턴 해당
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {ex.targetMuscles.join(' · ')}
                              </p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                {ex.difficulty}
                              </span>
                              <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                                {ex.purpose}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push('/analysis')}
            className="flex-1 py-3 text-slate-500 border border-slate-200 rounded-2xl hover:bg-slate-50 font-medium"
          >
            ← 뒤로
          </button>
          <button
            onClick={() => router.push('/recommendation')}
            className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl transition-colors"
          >
            추천 루틴 보기 →
          </button>
        </div>
      </main>
    </div>
  );
}
