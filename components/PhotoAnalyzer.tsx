'use client';

import { useCallback, useRef, useState } from 'react';
import type { PhotoAnalysisResult, PhotoType, PoseIssue } from '@/lib/types';

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface Props {
  photoType: PhotoType;
  onResult: (result: PhotoAnalysisResult) => void;
}

const TYPE_GUIDES: Record<PhotoType, { icon: string; title: string; tips: string[] }> = {
  front: {
    icon: '🧍',
    title: '전신 정면 사진',
    tips: [
      '발부터 머리까지 전신이 보이도록',
      '양발을 어깨 너비로 벌리고 팔은 옆으로',
      '카메라는 가슴 높이, 정면을 바라보세요',
      '밝은 배경, 단색 옷 권장',
    ],
  },
  side: {
    icon: '🚶',
    title: '전신 측면 사진',
    tips: [
      '몸의 오른쪽 또는 왼쪽이 카메라를 향하도록',
      '자연스러운 자세로 서서 팔은 옆으로',
      '발이 수직 기준선 위에 오도록',
      '전두경추 자세와 골반 전방경사를 측정합니다',
    ],
  },
  ankle: {
    icon: '🦶',
    title: '발목 사진',
    tips: [
      '발목과 종아리가 보이도록 촬영',
      '정면 혹은 약간 기울어진 각도',
      '발이 자연스럽게 선 상태에서 촬영',
    ],
  },
  knee: {
    icon: '🦵',
    title: '무릎 사진',
    tips: [
      '무릎 관절이 중심에 오도록',
      '정면에서 촬영해 내·외측 편위 확인',
      '약간 구부린 상태도 좋습니다',
    ],
  },
  shoulder: {
    icon: '💪',
    title: '어깨 사진',
    tips: [
      '어깨와 상체가 모두 보이도록',
      '등을 편 자연스러운 자세',
      '정면 또는 후면에서 촬영',
    ],
  },
};

export default function PhotoAnalyzer({ photoType, onResult }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'analyzing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
      });

      const img = new Image();
      img.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const mpResult = poseLandmarker.detect(canvas);
      poseLandmarker.close();

      if (!mpResult.landmarks || mpResult.landmarks.length === 0) {
        setStatus('error');
        setErrorMsg('포즈를 감지하지 못했습니다. 전신이 보이는 밝은 사진을 사용해 주세요.');
        return;
      }

      const landmarks = mpResult.landmarks[0] as NormalizedLandmark[];

      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawConnectors(mpResult.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, {
        color: '#00e5ff',
        lineWidth: 2,
      });
      drawingUtils.drawLandmarks(mpResult.landmarks[0], {
        color: '#ff0066',
        radius: 4,
      });

      // Landmarks
      const nose = landmarks[0];
      const lEar = landmarks[7];
      const rEar = landmarks[8];
      const lShoulder = landmarks[11];
      const rShoulder = landmarks[12];
      const lHip = landmarks[23];
      const rHip = landmarks[24];
      const lKnee = landmarks[25];
      const rKnee = landmarks[26];
      const lAnkle = landmarks[27];
      const rAnkle = landmarks[28];
      const lFootIdx = landmarks[31];
      const rFootIdx = landmarks[32];

      const toDeg = (rad: number) => rad * (180 / Math.PI);

      const shoulderTiltDeg = toDeg(Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x));
      const hipTiltDeg = toDeg(Math.atan2(rHip.y - lHip.y, rHip.x - lHip.x));

      const bodyWidth = Math.abs(rShoulder.x - lShoulder.x) || 0.2;
      const lKneeMidX = (lHip.x + lAnkle.x) / 2;
      const rKneeMidX = (rHip.x + rAnkle.x) / 2;
      const leftKneeDeviation = ((lKnee.x - lKneeMidX) / bodyWidth) * 100;
      const rightKneeDeviation = ((rKnee.x - rKneeMidX) / bodyWidth) * 100;

      const leftFootAngleDeg = toDeg(Math.atan2(lFootIdx.x - lAnkle.x, lAnkle.y - lFootIdx.y));
      const rightFootAngleDeg = toDeg(Math.atan2(rAnkle.x - rFootIdx.x, rAnkle.y - rFootIdx.y));

      // Side-view specific: forward head posture (nose forward of ear midpoint) and anterior pelvic tilt
      let forwardHeadMm: number | undefined;
      let anteriorPelvicTilt: number | undefined;

      if (photoType === 'side') {
        // In side view, x-axis represents forward/backward displacement
        // Ear is reference for head position; shoulder for torso
        const earX = (lEar.x + rEar.x) / 2;
        const shoulderX = (lShoulder.x + rShoulder.x) / 2;
        // Positive = nose is forward of ear (forward head posture)
        // Use image width as rough scale (very approximate)
        const fhNorm = nose.x - earX;
        forwardHeadMm = fhNorm * 1000; // normalized units

        // Anterior pelvic tilt: hip higher (smaller y) than neutral relative to lumbar
        // Approximate via difference in y between hip and knee relative to trunk height
        const hipX = (lHip.x + rHip.x) / 2;
        const kneeX = (lKnee.x + rKnee.x) / 2;
        // Positive = hip forward of knee (anterior tilt indication)
        const aptNorm = hipX - kneeX;
        anteriorPelvicTilt = aptNorm * 100;
      }

      const issues: PoseIssue[] = [];

      if (Math.abs(shoulderTiltDeg) > 3) {
        issues.push({
          patternId: 'upper_asymmetry',
          severity: Math.abs(shoulderTiltDeg) > 7 ? 'high' : 'medium',
          description: `어깨 기울기 ${Math.abs(shoulderTiltDeg).toFixed(1)}° (${shoulderTiltDeg > 0 ? '우측' : '좌측'} 낮음)`,
          side: shoulderTiltDeg > 0 ? 'right' : 'left',
          measurement: shoulderTiltDeg,
        });
      }

      if (Math.abs(hipTiltDeg) > 2) {
        issues.push({
          patternId: 'pelvic_asymmetry',
          severity: Math.abs(hipTiltDeg) > 5 ? 'high' : 'medium',
          description: `골반 기울기 ${Math.abs(hipTiltDeg).toFixed(1)}° (${hipTiltDeg > 0 ? '우측' : '좌측'} 낮음)`,
          side: hipTiltDeg > 0 ? 'right' : 'left',
          measurement: hipTiltDeg,
        });
      }

      if (leftKneeDeviation > 8) {
        issues.push({
          patternId: 'knee_valgus',
          severity: leftKneeDeviation > 15 ? 'high' : 'medium',
          description: `좌측 무릎 내측 붕괴 (${leftKneeDeviation.toFixed(0)}% 편위)`,
          side: 'left',
          measurement: leftKneeDeviation,
        });
      }
      if (rightKneeDeviation < -8) {
        issues.push({
          patternId: 'knee_valgus',
          severity: rightKneeDeviation < -15 ? 'high' : 'medium',
          description: `우측 무릎 내측 붕괴 (${Math.abs(rightKneeDeviation).toFixed(0)}% 편위)`,
          side: 'right',
          measurement: rightKneeDeviation,
        });
      }

      if (Math.abs(leftFootAngleDeg) > 15) {
        issues.push({
          patternId: 'hip_external_rotation',
          severity: Math.abs(leftFootAngleDeg) > 25 ? 'high' : 'medium',
          description: `좌측 발 외회전 ${Math.abs(leftFootAngleDeg).toFixed(0)}°`,
          side: 'left',
          measurement: leftFootAngleDeg,
        });
      }
      if (Math.abs(rightFootAngleDeg) > 15) {
        issues.push({
          patternId: 'hip_external_rotation',
          severity: Math.abs(rightFootAngleDeg) > 25 ? 'high' : 'medium',
          description: `우측 발 외회전 ${Math.abs(rightFootAngleDeg).toFixed(0)}°`,
          side: 'right',
          measurement: rightFootAngleDeg,
        });
      }

      if (photoType === 'side' && forwardHeadMm !== undefined && forwardHeadMm > 30) {
        issues.push({
          patternId: 'upper_asymmetry',
          severity: forwardHeadMm > 60 ? 'high' : 'medium',
          description: `두부 전방 변위 감지 (거북목 패턴)`,
          measurement: forwardHeadMm,
        });
      }

      if (photoType === 'side' && anteriorPelvicTilt !== undefined && anteriorPelvicTilt > 10) {
        issues.push({
          patternId: 'core_weakness',
          severity: anteriorPelvicTilt > 20 ? 'high' : 'medium',
          description: `골반 전방경사 패턴 감지`,
          measurement: anteriorPelvicTilt,
        });
      }

      const analysisResult: PhotoAnalysisResult = {
        type: photoType,
        shoulderTiltDeg,
        hipTiltDeg,
        leftKneeDeviation,
        rightKneeDeviation,
        leftFootAngleDeg,
        rightFootAngleDeg,
        ...(forwardHeadMm !== undefined && { forwardHeadMm }),
        ...(anteriorPelvicTilt !== undefined && { anteriorPelvicTilt }),
        issues,
      };

      setStatus('done');
      onResult(analysisResult);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('분석 중 오류가 발생했습니다. MediaPipe 모델 로딩에 인터넷 연결이 필요합니다.');
    }
  }, [onResult, photoType]);

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

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
      >
        <span className="text-4xl">{guide.icon}</span>
        <p className="text-sm text-slate-600 text-center font-medium">{guide.title} 업로드</p>
        <p className="text-xs text-slate-400 text-center">사진을 드래그하거나 클릭해서 선택하세요 · PNG, JPG, WEBP</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button className="mt-1 px-4 py-2 bg-blue-700 text-white text-sm rounded-lg font-medium hover:bg-blue-800 transition-colors">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {status === 'done' && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700 font-medium">
          ✓ 포즈 분석 완료
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
            {guide.tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
            <li>• <strong>개인정보</strong>: 사진은 브라우저에서만 처리되며 서버에 전송되지 않습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}
