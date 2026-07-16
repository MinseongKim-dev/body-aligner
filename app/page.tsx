import Link from 'next/link';

const STEPS = [
  {
    num: '01',
    icon: '📋',
    title: '체크리스트 작성',
    desc: '15가지 자가 진단 항목과 통증 부위 바디맵으로 체형 상태를 파악합니다.',
  },
  {
    num: '02',
    icon: '📸',
    title: '사진 포즈 분석',
    desc: 'MediaPipe Pose로 사진 속 관절 각도를 자동 측정 — 어깨 기울기, 골반 틀어짐, 무릎 정렬을 감지합니다.',
  },
  {
    num: '03',
    icon: '🔍',
    title: '패턴 분석 & 우선순위',
    desc: '발목→무릎→골반 연쇄 패턴을 파악하고 교정 우선 순위를 도출합니다.',
  },
  {
    num: '04',
    icon: '▶️',
    title: '유튜브 영상 매칭',
    desc: '유튜브 자막에서 운동 정보를 자동 추출, 내 체형 패턴과 매칭합니다.',
  },
  {
    num: '05',
    icon: '💪',
    title: '맞춤 루틴 생성',
    desc: '스트레칭→활성화→근력 순서로 단계별 맞춤 루틴을 제공합니다.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          완전 무료 · 서버에 데이터 저장 없음
        </div>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-5">
          당신의 체형에 맞는 운동을<br />
          <span className="text-blue-400">정확하게</span> 추천해드립니다
        </h1>
        <p className="text-slate-300 text-lg max-w-xl leading-relaxed mb-10">
          체크리스트 + 사진 분석(MediaPipe)으로 체형 문제를 파악하고,<br className="hidden sm:block" />
          유튜브 영상 속 운동을 자동 추출해 맞춤 교정 루틴을 만들어 드립니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/checklist"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-900/40 text-lg"
          >
            분석 시작하기 →
          </Link>
          <Link
            href="/photo"
            className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl border border-white/20 transition-colors text-base"
          >
            📸 사진만 분석하기
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          사진은 브라우저에서만 처리 · 서버 전송 없음 · 비용 없음
        </p>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center text-slate-800 mb-3">어떻게 작동하나요?</h2>
          <p className="text-slate-500 text-center mb-12">5단계로 완성되는 맞춤 체형 교정 플랜</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-bold text-slate-400 tracking-widest">{step.num}</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-3">🆓</div>
            <h3 className="font-bold text-slate-800 mb-1">완전 무료</h3>
            <p className="text-sm text-slate-500">LLM API 없음. MediaPipe는 브라우저에서 무료 실행.</p>
          </div>
          <div>
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold text-slate-800 mb-1">프라이버시 보호</h3>
            <p className="text-sm text-slate-500">사진은 내 브라우저에서만 처리. 서버 전송 없음.</p>
          </div>
          <div>
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-bold text-slate-800 mb-1">연쇄 패턴 인식</h3>
            <p className="text-sm text-slate-500">발목→무릎→골반 연쇄를 고려한 교정 순서 제시.</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="py-6 px-6 text-center border-t border-slate-200 bg-white">
        <p className="text-xs text-slate-400">
          ⚠️ 이 서비스는 의료 진단을 대체하지 않습니다. 통증이 심하거나 부상이 의심되면 의료 전문가와 상담하세요.
        </p>
        <p className="text-xs text-slate-300 mt-1">BodyAlign — 체형 분석 기반 맞춤 운동 추천 플랫폼</p>
      </footer>
    </div>
  );
}
