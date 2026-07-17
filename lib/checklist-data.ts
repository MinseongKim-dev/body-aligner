import type { ChecklistItem } from './types';

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // ── 골반 (9) ────────────────────────────────────────────
  {
    id: 'glute_nonfeel',
    question: '운동 중 한쪽 엉덩이가 수축(조여지는) 느낌이 없다',
    options: ['없음', '좌측', '우측'],
    category: 'pelvis',
  },
  {
    id: 'running_height_diff',
    question: '걷거나 뛸 때 양발의 지면 이탈 높이가 달라 단차가 느껴진다',
    options: ['아니오', '예'],
    category: 'pelvis',
  },
  {
    id: 'tilt_walk',
    question: '걸을 때 한쪽으로 기우는 느낌이 있다',
    options: ['없음', '좌측', '우측'],
    category: 'pelvis',
  },
  {
    id: 'stairs_weak',
    question: '계단 오를 때 한쪽 다리에 힘이 빠진다',
    options: ['없음', '좌측', '우측'],
    category: 'pelvis',
  },
  {
    id: 'pelvis_float',
    question: '누우면 한쪽 골반이 뜨는 느낌이 있다',
    options: ['없음', '좌측', '우측'],
    category: 'pelvis',
  },
  {
    id: 'pants_rotate',
    question: '바지가 한쪽으로 돌아간다',
    options: ['없음', '좌측', '우측'],
    category: 'pelvis',
  },
  {
    id: 'hip_click',
    question: '고관절(사타구니/엉덩이)에서 소리가 나거나 걸리는 느낌이 있다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'pelvis',
  },
  {
    id: 'leg_length_diff',
    question: '두 다리 길이가 달라 한쪽 신발이 더 빨리 닳는다',
    options: ['없음', '좌측', '우측'],
    category: 'pelvis',
  },
  {
    id: 'si_pain',
    question: '엉치뼈(천장관절) 주변이 앉다 일어날 때 아프거나 뻐근하다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'pelvis',
  },

  // ── 무릎 (6) ─────────────────────────────────────────────
  {
    id: 'knee_drive_limited',
    question: '달릴 때 한쪽 무릎이 잘 올라오지 않거나 보폭이 작아진다',
    options: ['없음', '좌측', '우측'],
    category: 'knee',
  },
  {
    id: 'knee_valgus_squat',
    question: '스쿼트 시 무릎이 안쪽으로 모인다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'knee',
  },
  {
    id: 'knee_valgus_rise',
    question: '앉았다 일어날 때 무릎이 안쪽으로 모인다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'knee',
  },
  {
    id: 'knee_hyperextension',
    question: '서 있으면 무릎이 뒤로 꺾이는 느낌이 있다 (과신전)',
    options: ['없음', '가끔', '항상'],
    category: 'knee',
  },
  {
    id: 'knee_pain_descend',
    question: '계단을 내려갈 때 무릎 앞쪽(슬개골)이 아프다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'knee',
  },
  {
    id: 'knee_clicking',
    question: '무릎을 구부릴 때 소리가 나거나 걸리는 느낌이 있다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'knee',
  },

  // ── 발목 (6) ─────────────────────────────────────────────
  {
    id: 'calf_numbness_run',
    question: '달리거나 잘못 걸을 때 한쪽 발목·종아리가 저리거나 무거워진다',
    options: ['없음', '좌측', '우측'],
    category: 'ankle',
  },
  {
    id: 'ankle_sound',
    question: '발목을 돌리면 소리가 난다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'ankle',
  },
  {
    id: 'foot_direction',
    question: '편하게 서 있을 때 한쪽 발이 더 많이 바깥으로 향한다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'ankle',
  },
  {
    id: 'single_leg_balance',
    question: '한 발로 서면 한쪽이 유독 흔들린다',
    options: ['없음', '좌측', '우측'],
    category: 'ankle',
  },
  {
    id: 'flat_foot',
    question: '발 아치가 무너져 있거나 발이 안쪽으로 기운다 (평발)',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'ankle',
  },
  {
    id: 'calf_tightness',
    question: '종아리가 자주 뭉치거나 쥐가 난다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'ankle',
  },

  // ── 코어 (4) ─────────────────────────────────────────────
  {
    id: 'core_tension',
    question: '하복부에 힘을 줘야 자세가 잡히는 느낌이 있다',
    options: ['아니오', '예'],
    category: 'core',
  },
  {
    id: 'anterior_tilt',
    question: '서 있을 때 배가 앞으로 나오고 허리가 과도하게 꺾인다',
    options: ['아니오', '약간', '심하게'],
    category: 'core',
  },
  {
    id: 'ab_separation',
    question: '복부 중앙(배꼽 위아래)이 불룩 튀어나오거나 틈이 느껴진다 (복직근 이개)',
    options: ['아니오', '가끔', '항상'],
    category: 'core',
  },
  {
    id: 'breath_shallow',
    question: '숨을 깊이 쉬려 하면 가슴만 올라오고 배가 안 나온다 (흉식 호흡)',
    options: ['아니오', '예'],
    category: 'core',
  },

  // ── 어깨·상체 (5) ────────────────────────────────────────
  {
    id: 'shoulder_stiff',
    question: '목/어깨 한쪽이 자주 뭉친다',
    options: ['없음', '좌측', '우측'],
    category: 'upper',
  },
  {
    id: 'grip_weak',
    question: '한쪽 악력이 유독 약하다',
    options: ['없음', '좌측', '우측'],
    category: 'upper',
  },
  {
    id: 'head_forward',
    question: '귀가 어깨보다 앞으로 나와있다 (거북목)',
    options: ['아니오', '약간', '심하게'],
    category: 'upper',
  },
  {
    id: 'thoracic_stiff',
    question: '등 뒤로 팔을 올리기 어렵거나 흉추가 굳어있는 느낌이 있다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'upper',
  },
  {
    id: 'winging_scapula',
    question: '등을 봤을 때 날개뼈(견갑골)가 한쪽이 떠있거나 튀어나와 있다',
    options: ['없음', '좌측', '우측'],
    category: 'upper',
  },

  // ── 허리 (4) ─────────────────────────────────────────────
  {
    id: 'back_tension',
    question: '허리를 숙이면 한쪽이 더 뭉치는 느낌이 있다',
    options: ['없음', '좌측', '우측'],
    category: 'back',
  },
  {
    id: 'morning_stiffness',
    question: '아침에 일어날 때 허리가 뻣뻣하여 5분 이상 걸린다',
    options: ['아니오', '가끔', '자주'],
    category: 'back',
  },
  {
    id: 'sitting_pain',
    question: '30분 이상 앉아있으면 허리 또는 엉덩이가 아프다',
    options: ['없음', '가끔', '자주'],
    category: 'back',
  },
  {
    id: 'lower_back_arch',
    question: '서 있을 때 허리 아래 손 넣는 공간이 주먹 하나 이상이다 (과전만)',
    options: ['아니오', '예'],
    category: 'back',
  },
];

export const BODY_PARTS = [
  { id: 'neck', label: '목/경추' },
  { id: 'left_shoulder', label: '왼쪽 어깨' },
  { id: 'right_shoulder', label: '오른쪽 어깨' },
  { id: 'upper_back', label: '등 (상부)' },
  { id: 'lower_back', label: '허리 (하부)' },
  { id: 'left_hip', label: '왼쪽 고관절' },
  { id: 'right_hip', label: '오른쪽 고관절' },
  { id: 'left_knee', label: '왼쪽 무릎' },
  { id: 'right_knee', label: '오른쪽 무릎' },
  { id: 'left_ankle', label: '왼쪽 발목' },
  { id: 'right_ankle', label: '오른쪽 발목' },
  { id: 'left_foot', label: '왼쪽 발' },
  { id: 'right_foot', label: '오른쪽 발' },
];
