'use client';

import { useCallback, useRef, useState } from 'react';
import type { PhotoAnalysisResult, PoseIssue, Severity } from '@/lib/types';

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface Props {
  onResult: (result: PhotoAnalysisResult) => void;
}

export default function PhotoAnalyzer({ onResult }: Props) {
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
      // Dynamically import MediaPipe Tasks Vision
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

      // Draw image on canvas and run inference
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

      const result = poseLandmarker.detect(canvas);
      poseLandmarker.close();

      if (!result.landmarks || result.landmarks.length === 0) {
        setStatus('error');
        setErrorMsg('포즈를 감지하지 못했습니다. 전신이 보이는 밝은 사진을 사용해 주세요.');
        return;
      }

      const landmarks = result.landmarks[0] as NormalizedLandmark[];

      // Draw skeleton overlay
      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawConnectors(result.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, {
        color: '#00e5ff',
        lineWidth: 2,
      });
      drawingUtils.drawLandmarks(result.landmarks[0], {
        color: '#ff0066',
        radius: 4,
      });

      // ─── Measurements ──────────────────────────────
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

      // Shoulder tilt (positive = right shoulder lower)
      const shoulderTiltDeg = toDeg(
        Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x),
      );

      // Hip tilt (positive = right hip lower)
      const hipTiltDeg = toDeg(
        Math.atan2(rHip.y - lHip.y, rHip.x - lHip.x),
      );

      // Knee deviation from hip-ankle midline (normalized)
      const bodyWidth = Math.abs(rShoulder.x - lShoulder.x) || 0.2;
      const lKneeMidX = (lHip.x + lAnkle.x) / 2;
      const rKneeMidX = (rHip.x + rAnkle.x) / 2;
      const leftKneeDeviation = ((lKnee.x - lKneeMidX) / bodyWidth) * 100;
      const rightKneeDeviation = ((rKnee.x - rKneeMidX) / bodyWidth) * 100;

      // Foot angle (external rotation from vertical)
      const leftFootAngleDeg = toDeg(
        Math.atan2(lFootIdx.x - lAnkle.x, lAnkle.y - lFootIdx.y),
      );
      const rightFootAngleDeg = toDeg(
        Math.atan2(rAnkle.x - rFootIdx.x, rAnkle.y - rFootIdx.y),
      );

      // ─── Issue Detection ───────────────────────────
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

      // Left knee valgus: knee moves medially (towards body center, i.e. positive x for left leg)
      if (leftKneeDeviation > 8) {
        issues.push({
          patternId: 'knee_valgus',
          severity: leftKneeDeviation > 15 ? 'high' : 'medium',
          description: `좌측 무릎 내측 붕괴 (${leftKneeDeviation.toFixed(0)}% 편위)`,
          side: 'left',
          measurement: leftKneeDeviation,
        });
      }
      // Right knee valgus: knee moves medially (towards body center, i.e. negative x for right leg)
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

      const analysisResult: PhotoAnalysisResult = {
        shoulderTiltDeg,
        hipTiltDeg,
        leftKneeDeviation,
        rightKneeDeviation,
        leftFootAngleDeg,
        rightFootAngleDeg,
        issues,
      };

      setStatus('done');
      onResult(analysisResult);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('분석 중 오류가 발생했습니다. MediaPipe 모델 로딩에 인터넷 연결이 필요합니다.');
    }
  }, [onResult]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyze(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) analyze(file);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
      >
        <span className="text-4xl">📸</span>
        <p className="text-sm text-slate-600 text-center">
          전면 또는 측면 전신 사진을 업로드하거나 드래그하세요
        </p>
        <p className="text-xs text-slate-400 text-center">
          밝은 곳에서 찍은 전신 사진 권장 · PNG, JPG, WEBP 지원
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button className="mt-1 px-4 py-2 bg-blue-700 text-white text-sm rounded-lg font-medium hover:bg-blue-800 transition-colors">
          사진 선택
        </button>
      </div>

      {/* Status */}
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

      {/* Canvas preview with skeleton */}
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
          <p className="text-xs font-semibold text-slate-700 mb-2">사진 촬영 가이드</p>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• 전신이 보이도록 충분히 멀리서 촬영</li>
            <li>• 발부터 머리까지 모두 포함</li>
            <li>• 정면: 양발을 어깨 너비, 팔은 옆으로</li>
            <li>• 밝은 배경, 단색 옷 권장</li>
            <li>• <strong>개인정보</strong>: 사진은 브라우저에서만 처리되며 서버에 전송되지 않습니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}
