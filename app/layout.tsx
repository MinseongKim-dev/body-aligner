import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BodyAlign — 체형 분석 기반 맞춤 운동 추천',
  description: '체형 문제 패턴을 분석하고, 유튜브 운동 영상과 매칭하여 맞춤 교정 루틴을 제시합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
