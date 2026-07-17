'use client';

import { useCallback, useRef, useState } from 'react';
import type { PhotoAnalysisResult, PhotoType, PoseIssue } from '@/lib/types';

interface NormalizedLandmark {
  x: number; y: number; z: number; visibility?: number;
}

interface Props {
  photoType: PhotoType;
  onResult: (result: PhotoAnalysisResult) => void;
}

// ── Shooting guides ────────────────────────────────────────
const TYPE_GUIDES: Record<PhotoType, { icon: string; title: string; tips: string[] }> = {
  front: {
    icon: '🧍', title: '전신 정면 사진',
    tips: ['발부터 머리까지 전신이 보이도록', '양발 어깨 너비, 팔은 옆으로', '카메라는 가슴 높이 정면', '밝은 배경·단색 옷 권장'],
  },
  side: {
    icon: '🚶', title: '전신 측면 사진',
    tips: ['몸 오른쪽 또는 왼쪽이 카메라를 향하도록', '자연스러운 자세로 팔은 옆으로', '전두경추 자세와 골반 전방경사를 측정합니다'],
  },
  ankle: {
    icon: '🦶', title: '발목·발 사진',
    tips: ['발목과 종아리가 보이도록 촬영', '서 있는 상태 정면·후면 모두 가능', '앉아서 찍을 경우 자동 분석이 어려울 수 있어 시각 관찰로 대체됩니다'],
  },
  knee: {
    icon: '🦵', title: '무릎 사진',
    tips: ['무릎 관절이 중심에 오도록', '정면에서 촬영해 내·외측 편위 확인', '앉아서 찍을 경우 자동 분석이 어려울 수 있어 시각 관찰로 대체됩니다'],
  },
  shoulder: {
    icon: '💪', title: '어깨·상체 사진',
    tips: ['어깨와 상체가 모두 보이도록', '등을 편 자연스러운 자세', '정면 또는 후면에서 촬영', '자동 분석 실패 시 시각 관찰로 대체됩니다'],
  },
};

// ── Visual observation fallback ────────────────────────────
interface ObsOption {
  label: string;
  issue: PoseIssue | null;
}
interface ObsQuestion {
  id: string;
  question: string;
  options: ObsOption[];
}

const OBSERVATION_QUESTIONS: Partial<Record<PhotoType, ObsQuestion[]>> = {
  ankle: [
    {
      id: 'ankle_arch',
      question: '발 아치가 무너져 발이 안쪽으로 기울어져 있나요? (과내전·평발)',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'ankle_restriction', severity: 'medium', description: '좌측 발 아치 무너짐 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'ankle_restriction', severity: 'medium', description: '우측 발 아치 무너짐 (시각 관찰)', side: 'right' } },
        { label: '양쪽', issue: { patternId: 'ankle_restriction', severity: 'high', description: '양측 발 아치 무너짐 (시각 관찰)', side: 'both' } },
      ],
    },
    {
      id: 'foot_external',
      question: '발가락 방향이 과도하게 바깥을 향하나요? (외족지)',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'hip_external_rotation', severity: 'medium', description: '좌측 발 외회전 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'hip_external_rotation', severity: 'medium', description: '우측 발 외회전 (시각 관찰)', side: 'right' } },
        { label: '양쪽', issue: { patternId: 'hip_external_rotation', severity: 'high', description: '양측 발 외회전 (시각 관찰)', side: 'both' } },
      ],
    },
    {
      id: 'ankle_instability',
      question: '발목이 자주 삐끗하거나 안쪽으로 무너지는 느낌이 있나요?',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'ankle_restriction', severity: 'medium', description: '좌측 발목 불안정 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'ankle_restriction', severity: 'medium', description: '우측 발목 불안정 (시각 관찰)', side: 'right' } },
        { label: '양쪽', issue: { patternId: 'ankle_restriction', severity: 'high', description: '양측 발목 불안정 (시각 관찰)', side: 'both' } },
      ],
    },
  ],
  knee: [
    {
      id: 'knee_valgus_obs',
      question: '무릎이 발끝보다 안쪽으로 모여 있나요? (니밸거스 X자)',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'knee_valgus', severity: 'medium', description: '좌측 무릎 내측 붕괴 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'knee_valgus', severity: 'medium', description: '우측 무릎 내측 붕괴 (시각 관찰)', side: 'right' } },
        { label: '양쪽', issue: { patternId: 'knee_valgus', severity: 'high', description: '양측 무릎 내측 붕괴 (시각 관찰)', side: 'both' } },
      ],
    },
    {
      id: 'knee_varum_obs',
      question: '무릎이 바깥으로 벌어져 있나요? (니바럼 O자)',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'knee_valgus', severity: 'low', description: '좌측 무릎 외측 편위 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'knee_valgus', severity: 'low', description: '우측 무릎 외측 편위 (시각 관찰)', side: 'right' } },
        { label: '양쪽', issue: { patternId: 'knee_valgus', severity: 'medium', description: '양측 무릎 외측 편위 (시각 관찰)', side: 'both' } },
      ],
    },
    {
      id: 'knee_hyperext_obs',
      question: '서 있을 때 무릎이 뒤로 과도하게 꺾이나요? (과신전)',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'knee_valgus', severity: 'low', description: '좌측 무릎 과신전 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'knee_valgus', severity: 'low', description: '우측 무릎 과신전 (시각 관찰)', side: 'right' } },
        { label: '양쪽', issue: { patternId: 'knee_valgus', severity: 'medium', description: '양측 무릎 과신전 (시각 관찰)', side: 'both' } },
      ],
    },
  ],
  shoulder: [
    {
      id: 'shoulder_height_obs',
      question: '한쪽 어깨가 더 높이 올라가 있나요?',
      options: [
        { label: '없음', issue: null },
        { label: '좌측이 높음', issue: { patternId: 'upper_asymmetry', severity: 'medium', description: '좌측 어깨 높음 (시각 관찰)', side: 'right' } },
        { label: '우측이 높음', issue: { patternId: 'upper_asymmetry', severity: 'medium', description: '우측 어깨 높음 (시각 관찰)', side: 'left' } },
      ],
    },
    {
      id: 'round_shoulder_obs',
      question: '어깨가 앞으로 둥글게 말려있나요? (라운드 숄더)',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'upper_asymmetry', severity: 'medium', description: '좌측 라운드 숄더 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'upper_asymmetry', severity: 'medium', description: '우측 라운드 숄더 (시각 관찰)', side: 'right' } },
        { label: '양쪽', issue: { patternId: 'upper_asymmetry', severity: 'high', description: '양측 라운드 숄더 (시각 관찰)', side: 'both' } },
      ],
    },
    {
      id: 'scapula_wing_obs',
      question: '날개뼈(견갑골)가 한쪽이 떠있거나 튀어나와 있나요?',
      options: [
        { label: '없음', issue: null },
        { label: '좌측', issue: { patternId: 'upper_asymmetry', severity: 'medium', description: '좌측 견갑골 익상 (시각 관찰)', side: 'left' } },
        { label: '우측', issue: { patternId: 'upper_asymmetry', severity: 'medium', description: '우측 견갑골 익상 (시각 관찰)', side: 'right' } },
      ],
    },
  ],
};

const PART_TYPES: PhotoType[] = ['ankle', 'knee', 'shoulder'];

// ── Component ──────────────────────────────────────────────
export default function PhotoAnalyzer({ photoType, onResult }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'analyzing' | 'done' | 'error' | 'observation'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [obsAnswers, setObsAnswers] = useState<Record<string, ObsOption | null>>({});
  const [mode, setMode] = useState<'auto' | 'observation'>('auto');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isPartType = PART_TYPES.includes(photoType);
  const obsQuestions = OBSERVATION_QUESTIONS[photoType] ?? [];

  // ── MediaPipe analysis ────────────────────────────────────
  const analyze = useCallback(async (file: File) => {
    setStatus('loading');
    setErrorMsg('');
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);

    try {
      const { PoseLandmarker, FilesetResolver, DrawingUtils } = await import('@mediapipe/tasks-vision');
      setStatus('analyzing');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
      );
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
      });

      const img = new Image();
      img.src = imageUrl;
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const mpResult = poseLandmarker.detect(canvas);
      poseLandmarker.close();

      if (!mpResult.landmarks || mpResult.landmarks.length === 0) {
        // For part types, auto-switch to observation mode
        if (isPartType) {
          setStatus('observation');
        } else {
          setStatus('error');
          setErrorMsg('포즈를 감지하지 못했습니다. 전신이 보이는 밝은 사진을 사용해 주세요.');
        }
        return;
      }

      const landmarks = mpResult.landmarks[0] as NormalizedLandmark[];

      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawConnectors(mpResult.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, { color: '#00e5ff', lineWidth: 2 });
      drawingUtils.drawLandmarks(mpResult.landmarks[0], { color: '#ff0066', radius: 4 });

      const nose = landmarks[0];
      const lEar = landmarks[7]; const rEar = landmarks[8];
      const lShoulder = landmarks[11]; const rShoulder = landmarks[12];
      const lHip = landmarks[23]; const rHip = landmarks[24];
      const lKnee = landmarks[25]; const rKnee = landmarks[26];
      const lAnkle = landmarks[27]; const rAnkle = landmarks[28];
      const lFootIdx = landmarks[31]; const rFootIdx = landmarks[32];

      const toDeg = (rad: number) => rad * (180 / Math.PI);

      const shoulderTiltDeg = toDeg(Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x));
      const hipTiltDeg = toDeg(Math.atan2(rHip.y - lHip.y, rHip.x - lHip.x));

      const bodyWidth = Math.abs(rShoulder.x - lShoulder.x) || 0.2;
      const leftKneeDeviation = ((lKnee.x - (lHip.x + lAnkle.x) / 2) / bodyWidth) * 100;
      const rightKneeDeviation = ((rKnee.x - (rHip.x + rAnkle.x) / 2) / bodyWidth) * 100;
      const leftFootAngleDeg = toDeg(Math.atan2(lFootIdx.x - lAnkle.x, lAnkle.y - lFootIdx.y));
      const rightFootAngleDeg = toDeg(Math.atan2(rAnkle.x - rFootIdx.x, rAnkle.y - rFootIdx.y));

      let forwardHeadMm: number | undefined;
      let anteriorPelvicTilt: number | undefined;
      if (photoType === 'side') {
        const earX = (lEar.x + rEar.x) / 2;
        forwardHeadMm = (nose.x - earX) * 1000;
        const hipX = (lHip.x + rHip.x) / 2;
        const kneeX = (lKnee.x + rKnee.x) / 2;
        anteriorPelvicTilt = (hipX - kneeX) * 100;
      }

      const issues: import('@/lib/types').PoseIssue[] = [];

      if (Math.abs(shoulderTiltDeg) > 3) {
        issues.push({ patternId: 'upper_asymmetry', severity: Math.abs(shoulderTiltDeg) > 7 ? 'high' : 'medium', description: `어깨 기울기 ${Math.abs(shoulderTiltDeg).toFixed(1)}° (${shoulderTiltDeg > 0 ? '우측' : '좌측'} 낮음)`, side: shoulderTiltDeg > 0 ? 'right' : 'left', measurement: shoulderTiltDeg });
      }
      if (Math.abs(hipTiltDeg) > 2) {
        issues.push({ patternId: 'pelvic_asymmetry', severity: Math.abs(hipTiltDeg) > 5 ? 'high' : 'medium', description: `골반 기울기 ${Math.abs(hipTiltDeg).toFixed(1)}° (${hipTiltDeg > 0 ? '우측' : '좌측'} 낮음)`, side: hipTiltDeg > 0 ? 'right' : 'left', measurement: hipTiltDeg });
      }
      if (leftKneeDeviation > 8) {
        issues.push({ patternId: 'knee_valgus', severity: leftKneeDeviation > 15 ? 'high' : 'medium', description: `좌측 무릎 내측 붕괴 (${leftKneeDeviation.toFixed(0)}% 편위)`, side: 'left', measurement: leftKneeDeviation });
      }
      if (rightKneeDeviation < -8) {
        issues.push({ patternId: 'knee_valgus', severity: rightKneeDeviation < -15 ? 'high' : 'medium', description: `우측 무릎 내측 붕괴 (${Math.abs(rightKneeDeviation).toFixed(0)}% 편위)`, side: 'right', measurement: rightKneeDeviation });
      }
      if (Math.abs(leftFootAngleDeg) > 15) {
        issues.push({ patternId: 'hip_external_rotation', severity: Math.abs(leftFootAngleDeg) > 25 ? 'high' : 'medium', description: `좌측 발 외회전 ${Math.abs(leftFootAngleDeg).toFixed(0)}°`, side: 'left', measurement: leftFootAngleDeg });
      }
      if (Math.abs(rightFootAngleDeg) > 15) {
        issues.push({ patternId: 'hip_external_rotation', severity: Math.abs(rightFootAngleDeg) > 25 ? 'high' : 'medium', description: `우측 발 외회전 ${Math.abs(rightFootAngleDeg).toFixed(0)}°`, side: 'right', measurement: rightFootAngleDeg });
      }
      if (photoType === 'side' && forwardHeadMm !== undefined && forwardHeadMm > 30) {
        issues.push({ patternId: 'upper_asymmetry', severity: forwardHeadMm > 60 ? 'high' : 'medium', description: '두부 전방 변위 감지 (거북목 패턴)', measurement: forwardHeadMm });
      }
      if (photoType === 'side' && anteriorPelvicTilt !== undefined && anteriorPelvicTilt > 10) {
        issues.push({ patternId: 'core_weakness', severity: anteriorPelvicTilt > 20 ? 'high' : 'medium', description: '골반 전방경사 패턴 감지', measurement: anteriorPelvicTilt });
      }

      setStatus('done');
      onResult({
        type: photoType,
        shoulderTiltDeg, hipTiltDeg,
        leftKneeDeviation, rightKneeDeviation,
        leftFootAngleDeg, rightFootAngleDeg,
        ...(forwardHeadMm !== undefined && { forwardHeadMm }),
        ...(anteriorPelvicTilt !== undefined && { anteriorPelvicTilt }),
        issues,
      });
    } catch (err) {
      console.error(err);
      if (isPartType) {
        setStatus('observation');
      } else {
        setStatus('error');
        setErrorMsg('분석 중 오류가 발생했습니다. MediaPipe 모델 로딩에 인터넷 연결이 필요합니다.');
      }
    }
  }, [onResult, photoType, isPartType]);

  // ── Observation submission ────────────────────────────────
  const submitObservation = () => {
    const issues: import('@/lib/types').PoseIssue[] = [];
    obsQuestions.forEach((q) => {
      const selected = obsAnswers[q.id];
      if (selected?.issue) issues.push(selected.issue);
    });
    onResult({
      type: photoType,
      shoulderTiltDeg: 0, hipTiltDeg: 0,
      leftKneeDeviation: 0, rightKneeDeviation: 0,
      leftFootAngleDeg: 0, rightFootAngleDeg: 0,
      issues,
    });
    setStatus('done');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyze(file);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) analyze(file);
  };

  const guide = TYPE_GUIDES[photoType];
  const obsAnsweredCount = Object.values(obsAnswers).filter(Boolean).length;
  const canSubmitObs = obsAnsweredCount >= Math.ceil(obsQuestions.length / 2);

  // ── Observation-only mode (no photo upload) ────────────────
  if (mode === 'observation' || status === 'observation') {
    return (
      <div className="space-y-4">
        {/* Mode toggle */}
        {isPartType && status !== 'observation' && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode('auto')}
              className="flex-1 py-2 text-sm font-medium rounded-xl border border-blue-300 bg-blue-50 text-blue-700"
            >
              📸 사진 자동 분석
            </button>
            <button
              onClick={() => setMode('observation')}
              className="flex-1 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-slate-100 text-slate-600"
            >
              ✏️ 시각 관찰 체크 (선택됨)
            </button>
          </div>
        )}

        {status === 'observation' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">사진에서 포즈를 감지하지 못했습니다</p>
              <p className="text-xs text-amber-700 mt-0.5">
                전신이 보이지 않거나 클로즈업 사진의 경우 자동 분석이 어렵습니다.
                아래 시각 관찰 체크리스트로 대신 분석하세요.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div>
            <p className="font-bold text-slate-800 text-sm">{guide.icon} {guide.title} — 시각 관찰 체크</p>
            <p className="text-xs text-slate-400 mt-0.5">사진을 보면서 해당하는 항목을 선택하세요</p>
          </div>
          {obsQuestions.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium text-slate-700 mb-2 leading-relaxed">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const selected = obsAnswers[q.id] === opt;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setObsAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={submitObservation}
            disabled={!canSubmitObs}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            관찰 결과 적용 ({obsAnsweredCount}/{obsQuestions.length}개 답변)
          </button>
        </div>

        {/* Also offer to try photo again */}
        {status === 'observation' && (
          <button
            onClick={() => { setStatus('idle'); setPreview(null); }}
            className="w-full py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            다른 사진으로 다시 시도
          </button>
        )}
      </div>
    );
  }

  // ── Auto photo mode ────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Mode toggle for part types */}
      {isPartType && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode('auto')}
            className="flex-1 py-2 text-sm font-medium rounded-xl border border-blue-300 bg-blue-50 text-blue-700"
          >
            📸 사진 자동 분석 (선택됨)
          </button>
          <button
            onClick={() => setMode('observation')}
            className="flex-1 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            ✏️ 시각 관찰 체크
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
      >
        <span className="text-4xl">{guide.icon}</span>
        <p className="text-sm text-slate-600 text-center font-medium">{guide.title} 업로드</p>
        <p className="text-xs text-slate-400 text-center">드래그하거나 클릭해서 선택 · PNG, JPG, WEBP</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button className="mt-1 px-4 py-2 bg-blue-700 text-white text-sm rounded-lg font-medium hover:bg-blue-800">
          사진 선택
        </button>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-700">MediaPipe 모델 로딩 중...</span>
        </div>
      )}
      {status === 'analyzing' && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-amber-700">포즈 분석 중...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errorMsg}</div>
      )}
      {status === 'done' && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700 font-medium">
          ✓ 분석 완료
        </div>
      )}

      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <canvas ref={canvasRef} className="w-full h-auto block" />
          {status !== 'done' && status !== 'error' && (
            <img src={preview} alt="preview" className="w-full h-auto block absolute inset-0 opacity-60" />
          )}
        </div>
      )}

      {!preview && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-2">📋 촬영 가이드</p>
          <ul className="text-xs text-slate-500 space-y-1">
            {guide.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
            <li>• <strong>개인정보</strong>: 사진은 브라우저에서만 처리되며 서버에 전송되지 않습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}
