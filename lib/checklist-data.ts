import type { ChecklistItem } from './types';

export const CHECKLIST_ITEMS: ChecklistItem[] = [
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
    id: 'ankle_sound',
    question: '발목을 돌리면 소리가 난다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'ankle',
  },
  {
    id: 'knee_valgus_squat',
    question: '스쿼트 시 무릎이 안쪽으로 모인다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'knee',
  },
  {
    id: 'pants_rotate',
    question: '바지가 한쪽으로 돌아간다',
    options: ['없음', '좌측', '우측'],
    category: 'pelvis',
  },
  {
    id: 'core_tension',
    question: '하복부에 힘을 줘야 자세가 잡히는 느낌이 있다',
    options: ['아니오', '예'],
    category: 'core',
  },
  {
    id: 'grip_weak',
    question: '한쪽 악력이 유독 약하다',
    options: ['없음', '좌측', '우측'],
    category: 'upper',
  },
  {
    id: 'knee_valgus_rise',
    question: '앉았다 일어날 때 무릎이 안쪽으로 모인다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'knee',
  },
  {
    id: 'shoulder_stiff',
    question: '목/어깨 한쪽이 자주 뭉친다',
    options: ['없음', '좌측', '우측'],
    category: 'upper',
  },
  {
    id: 'back_tension',
    question: '허리를 숙이면 한쪽이 더 뭉치는 느낌이 있다',
    options: ['없음', '좌측', '우측'],
    category: 'back',
  },
  {
    id: 'anterior_tilt',
    question: '서 있을 때 배가 앞으로 나오고 허리가 과도하게 꺾인다',
    options: ['아니오', '약간', '심하게'],
    category: 'core',
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
    id: 'hip_click',
    question: '고관절(사타구니/엉덩이)에서 소리가 나거나 걸리는 느낌이 있다',
    options: ['없음', '좌측', '우측', '양쪽'],
    category: 'pelvis',
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
