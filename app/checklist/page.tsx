'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressSteps from '@/components/ProgressSteps';
import BodyMap from '@/components/BodyMap';
import { CHECKLIST_ITEMS } from '@/lib/checklist-data';
import { loadState, saveState } from '@/lib/storage';

const CATEGORIES: Record<string, string> = {
  pelvis: '🦴 골반',
  knee: '🦵 무릎',
  ankle: '🦶 발목',
  core: '🔵 코어',
  upper: '💪 어깨·상체',
  back: '🔶 허리',
};

export default function ChecklistPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [painLocations, setPainLocations] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('pelvis');

  useEffect(() => {
    const state = loadState();
    setAnswers(state.checklistAnswers);
    setPainLocations(state.painLocations);
  }, []);

  const categories: string[] = [...new Set(CHECKLIST_ITEMS.map((i) => i.category))];
  const categoryItems = CHECKLIST_ITEMS.filter((i) => (i.category as string) === activeCategory);
  const answeredCount = Object.keys(answers).length;
  const totalCount = CHECKLIST_ITEMS.length;

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    saveState({ checklistAnswers: answers, painLocations });
    router.push('/photo');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressSteps />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">자가 체형 체크리스트</h1>
          <p className="text-slate-500 text-sm mt-1">
            {answeredCount}/{totalCount}개 응답 · 통증 부위도 표시해 주세요
          </p>
          <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {CATEGORIES[cat]}
            </button>
          ))}
          <button
            onClick={() => setActiveCategory('bodymap')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'bodymap'
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            🗺️ 통증 부위
          </button>
        </div>

        {/* Questions */}
        {activeCategory !== 'bodymap' ? (
          <div className="space-y-4">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-colors ${
                  answers[item.id] ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'
                }`}
              >
                <p className="font-medium text-slate-800 mb-4 leading-relaxed">{item.question}</p>
                <div className="flex flex-wrap gap-2">
                  {item.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(item.id, opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        answers[item.id] === opt
                          ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Category navigation */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => {
                  const idx = categories.indexOf(activeCategory);
                  if (idx > 0) setActiveCategory(categories[idx - 1]);
                }}
                disabled={categories.indexOf(activeCategory) === 0}
                className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30"
              >
                ← 이전
              </button>
              <button
                onClick={() => {
                  const idx = categories.indexOf(activeCategory);
                  if (idx < categories.length - 1) setActiveCategory(categories[idx + 1]);
                  else setActiveCategory('bodymap');
                }}
                className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800"
              >
                다음 →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">통증 · 불편 부위 선택</h3>
            <BodyMap selected={painLocations} onChange={setPainLocations} />
          </div>
        )}

        {/* Submit */}
        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={handleSubmit}
            disabled={answeredCount < 5}
            className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg"
          >
            분석 계속하기 →
          </button>
          {answeredCount < 5 && (
            <p className="text-center text-xs text-slate-400 mt-2">
              최소 5개 이상 응답해 주세요 ({answeredCount}/5)
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
