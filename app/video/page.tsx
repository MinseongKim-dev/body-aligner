'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressSteps from '@/components/ProgressSteps';
import { loadState, saveState } from '@/lib/storage';
import { matchExercisesFromTranscript } from '@/lib/exercise-keywords';
import type { VideoAnalysis, BodyPattern } from '@/lib/types';

function isYouTubeUrl(url: string) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function isInstagramUrl(url: string) {
  return /instagram\.com\/(?:p|reel|tv)\//i.test(url);
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default function VideoPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState<VideoAnalysis[]>([]);
  const [patterns, setPatterns] = useState<BodyPattern[]>([]);

  useEffect(() => {
    const state = loadState();
    setAnalyses(state.videoAnalyses);
    setPatterns(state.detectedPatterns);
  }, []);

  const analyzeUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setShowManual(false);

    const isYT = isYouTubeUrl(trimmed);
    const isIG = isInstagramUrl(trimmed);

    if (!isYT && !isIG) {
      setError('YouTube 또는 Instagram URL을 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      let transcript = '';
      let title = '';
      let videoId = '';
      let platform: 'youtube' | 'instagram' = 'youtube';

      if (isYT) {
        platform = 'youtube';
        const res = await fetch(`/api/transcript?url=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '자막 추출에 실패했습니다.');
          setLoading(false);
          return;
        }
        transcript = data.transcript;
        title = data.title;
        videoId = extractYouTubeId(trimmed) ?? data.videoId ?? 'unknown';
      } else {
        platform = 'instagram';
        const res = await fetch(`/api/instagram?url=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Instagram 캡션 추출에 실패했습니다.');
          setShowManual(true);
          setLoading(false);
          return;
        }
        transcript = data.transcript;
        title = data.title;
        videoId = data.postId ?? trimmed.replace(/[^a-zA-Z0-9]/g, '').slice(-11);
        if (!transcript) {
          setError('캡션을 자동으로 추출할 수 없습니다. 아래에 직접 텍스트를 붙여넣어주세요.');
          setShowManual(true);
          setLoading(false);
          return;
        }
      }

      const exercises = matchExercisesFromTranscript(transcript);

      const newAnalysis: VideoAnalysis = {
        videoId,
        url: trimmed,
        title,
        platform,
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

  const analyzeManual = () => {
    if (!manualText.trim()) return;
    const exercises = matchExercisesFromTranscript(manualText);
    const videoId = `manual_${Date.now()}`;
    const newAnalysis: VideoAnalysis = {
      videoId,
      url: url.trim() || videoId,
      title: '수동 입력',
      platform: isInstagramUrl(url.trim()) ? 'instagram' : 'youtube',
      exercises,
      analyzedAt: new Date().toISOString(),
    };
    const updated = [newAnalysis, ...analyses];
    setAnalyses(updated);
    saveState({ videoAnalyses: updated });
    setManualText('');
    setShowManual(false);
    setUrl('');
    setError('');
  };

  const removeAnalysis = (videoId: string) => {
    const updated = analyses.filter((a) => a.videoId !== videoId);
    setAnalyses(updated);
    saveState({ videoAnalyses: updated });
  };

  const matchesPattern = (patternIds: string[]) =>
    patternIds.some((p) => patterns.map((pt) => pt.id).includes(p));

  const urlType = isYouTubeUrl(url) ? 'youtube' : isInstagramUrl(url) ? 'instagram' : null;

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">영상 운동 분석</h1>
          <p className="text-slate-500 text-sm mt-1">
            YouTube 또는 Instagram 링크를 입력하면 운동 정보를 자동 추출합니다.
          </p>
        </div>

        {/* URL input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-semibold text-slate-700 flex-1">영상 URL</label>
            {urlType === 'youtube' && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">YouTube</span>
            )}
            {urlType === 'instagram' && (
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">Instagram</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); setShowManual(false); }}
              onKeyDown={(e) => e.key === 'Enter' && analyzeUrl()}
              placeholder="YouTube 또는 Instagram 링크를 붙여넣으세요"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={analyzeUrl}
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

          {/* Manual text input fallback (for Instagram) */}
          {showManual && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-600">캡션 직접 붙여넣기</p>
              <p className="text-xs text-slate-400">
                Instagram 게시물의 캡션 텍스트를 복사해서 아래에 붙여넣으세요.
              </p>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="운동 설명이 담긴 캡션을 여기에 붙여넣으세요..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
              <button
                onClick={analyzeManual}
                disabled={!manualText.trim()}
                className="w-full py-2 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors disabled:opacity-40"
              >
                텍스트로 분석하기
              </button>
            </div>
          )}

          <div className="flex gap-3 text-xs text-slate-400">
            <span>✓ YouTube: 자막 자동 추출</span>
            <span>✓ Instagram: 캡션 텍스트 추출</span>
          </div>
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
                  {analysis.platform === 'youtube' ? (
                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                      <img
                        src={`https://img.youtube.com/vi/${analysis.videoId}/mqdefault.jpg`}
                        alt={analysis.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xl">📷</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-slate-800 text-sm line-clamp-1 leading-tight flex-1">
                        {analysis.title || '제목 없음'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        analysis.platform === 'youtube'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {analysis.platform === 'youtube' ? 'YouTube' : 'Instagram'}
                      </span>
                    </div>
                    <a
                      href={analysis.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      원본 보기 ↗
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
                  <p className="p-4 text-sm text-slate-400">
                    인식된 운동이 없습니다. 운동 설명이 포함된 영상인지 확인해주세요 — 체형 교정·재활·피트니스 관련 내용이어야 매칭됩니다.
                  </p>
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
                            matched ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'
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
