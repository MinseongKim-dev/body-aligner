import type { BodyPattern, PhotoAnalysisResult, Severity } from './types';

export const PATTERN_CASCADES: Record<string, string> = {
  ankle_restriction: '발목 가동범위 부족 → 무릎 내측 붕괴 → 둔근 비활성 → 골반 비대칭',
  knee_valgus: '무릎 내측 붕괴 → 고관절 외회전 약화 → 중둔근 약화 → 보행 비효율',
  glute_amnesia: '둔근 비활성 → 햄스트링 과부하 → 골반 전방경사 → 허리 과부하',
  pelvic_asymmetry: '골반 비대칭 → 척추 측만 → 어깨 불균형 → 두통/목 통증',
  core_weakness: '코어 약화 → 골반 전방경사 → 요추 과신전 → 허리 통증',
  upper_asymmetry: '어깨 불균형 → 흉추 제한 → 경추 긴장 → 두통',
  hip_external_rotation: '고관절 외회전 과도 → 내회전 부족 → 무릎 내측 부하 → 전방십자인대 스트레스',
};

export function detectPatterns(
  answers: Record<string, string>,
  painLocations: string[],
  photoAnalyses: PhotoAnalysisResult[] = [],
): BodyPattern[] {
  const patterns: BodyPattern[] = [];

  // Flatten all issues from all photo analyses
  const allIssues = photoAnalyses.flatMap((pa) => pa.issues);
  const findIssueSeverity = (patternId: string) =>
    allIssues.find((i) => i.patternId === patternId)?.severity;

  // ─── 발목 가동범위 제한 ──────────────────────────────────
  const ankleSound = answers['ankle_sound'];
  const footDir = answers['foot_direction'];
  const singleLeg = answers['single_leg_balance'];
  const anklePain = painLocations.some((p) => p.includes('ankle') || p.includes('foot'));

  const ankleSignals = [ankleSound, footDir, singleLeg].filter((v) => v && v !== '없음' && v !== '아니오');
  const photoAnkleSeverity = findIssueSeverity('ankle_restriction');

  if (ankleSignals.length >= 1 || anklePain || photoAnkleSeverity) {
    const severity = computeSeverity(ankleSignals.length + (anklePain ? 1 : 0) + (photoAnkleSeverity === 'high' ? 2 : photoAnkleSeverity === 'medium' ? 1 : 0), 3);
    patterns.push({
      id: 'ankle_restriction',
      name: '발목 가동범위 제한',
      description: '발목의 배측굴곡(등쪽 굽힘) 가동범위가 줄어든 상태입니다. 발목이 굳으면 보상작용으로 무릎·골반까지 연쇄적으로 영향을 줍니다.',
      cascade: PATTERN_CASCADES['ankle_restriction'],
      severity,
      priority: 1,
      side: sideDominant([ankleSound, footDir, singleLeg]),
      exerciseIds: ['wall_ankle_stretch', 'ankle_circles', 'calf_stretch', 'toe_raises', 'calf_raise'],
    });
  }

  // ─── 무릎 내측 붕괴 (니밸거스) ───────────────────────────
  const kneeValgusSquat = answers['knee_valgus_squat'];
  const kneeValgusRise = answers['knee_valgus_rise'];
  const kneePain = painLocations.some((p) => p.includes('knee'));
  const photoKneeSeverity = findIssueSeverity('knee_valgus');

  const kneeSignals = [kneeValgusSquat, kneeValgusRise].filter((v) => v && v !== '없음');
  if (kneeSignals.length >= 1 || kneePain || photoKneeSeverity) {
    const severity = computeSeverity(kneeSignals.length + (kneePain ? 1 : 0) + (photoKneeSeverity === 'high' ? 2 : photoKneeSeverity === 'medium' ? 1 : 0), 3);
    patterns.push({
      id: 'knee_valgus',
      name: '무릎 내측 붕괴 (니밸거스)',
      description: '무릎이 안쪽으로 모이는 패턴입니다. 중둔근 약화, 발목 제한, 고관절 외회전 부족이 복합적으로 작용합니다.',
      cascade: PATTERN_CASCADES['knee_valgus'],
      severity,
      priority: 2,
      side: sideDominant([kneeValgusSquat, kneeValgusRise]),
      exerciseIds: ['clamshell', 'band_squat', 'side_walk', 'hip_abduction'],
    });
  }

  // ─── 둔근 비활성화 (글루트 암네시아) ─────────────────────
  const stairsWeak = answers['stairs_weak'];
  const hipClick = answers['hip_click'];
  const hipPain = painLocations.some((p) => p.includes('hip'));
  const gluteSignals = [stairsWeak, kneeValgusSquat].filter((v) => v && v !== '없음');

  if (gluteSignals.length >= 1 || hipPain) {
    patterns.push({
      id: 'glute_amnesia',
      name: '둔근 비활성화',
      description: '엉덩이 근육(대둔근·중둔근)이 제대로 활성화되지 않아, 허리와 무릎에 과부하가 걸리는 상태입니다.',
      cascade: PATTERN_CASCADES['glute_amnesia'],
      severity: gluteSignals.length >= 2 || hipPain ? 'medium' : 'low',
      priority: 2,
      side: sideDominant([stairsWeak]),
      exerciseIds: ['clamshell', 'glute_bridge', 'donkey_kicks', 'standing_glute_squeeze', 'hip_thrust'],
    });
  }

  // ─── 골반 비대칭 ──────────────────────────────────────────
  const tiltWalk = answers['tilt_walk'];
  const pelvisFloat = answers['pelvis_float'];
  const pantsRotate = answers['pants_rotate'];
  const backTension = answers['back_tension'];
  const photoHipSeverity = findIssueSeverity('pelvic_asymmetry');

  const pelvisSignals = [tiltWalk, pelvisFloat, pantsRotate, backTension].filter((v) => v && v !== '없음');
  const backPain = painLocations.some((p) => p.includes('back') || p.includes('hip'));

  if (pelvisSignals.length >= 1 || backPain || photoHipSeverity) {
    const severity = computeSeverity(pelvisSignals.length + (backPain ? 1 : 0) + (photoHipSeverity === 'high' ? 2 : photoHipSeverity === 'medium' ? 1 : 0), 4);
    patterns.push({
      id: 'pelvic_asymmetry',
      name: '골반 비대칭',
      description: '골반이 한쪽으로 기울거나 회전된 상태입니다. 좌우 근력 불균형과 연조직 긴장이 원인이 되며, 척추·어깨로 연쇄됩니다.',
      cascade: PATTERN_CASCADES['pelvic_asymmetry'],
      severity,
      priority: 3,
      side: sideDominant([tiltWalk, pelvisFloat, pantsRotate]),
      exerciseIds: ['90_90_stretch', 'hip_flexor_stretch', 'pelvic_tilt', 'bird_dog', 'single_leg_bridge', 'split_squat'],
    });
  }

  // ─── 코어 약화 / 골반 전방경사 ───────────────────────────
  const coreTension = answers['core_tension'];
  const anteriorTilt = answers['anterior_tilt'];
  const photoCoreSeverity = findIssueSeverity('core_weakness');

  const coreSignals = [
    coreTension === '예' ? '예' : null,
    anteriorTilt !== '아니오' ? anteriorTilt : null,
  ].filter(Boolean);

  if (coreSignals.length >= 1 || photoCoreSeverity) {
    const severity = anteriorTilt === '심하게' || photoCoreSeverity === 'high' ? 'high' : 'medium';
    patterns.push({
      id: 'core_weakness',
      name: '코어 약화 / 골반 전방경사',
      description: '심부 코어(복횡근·다열근)가 약해져 골반이 앞으로 기운 상태입니다. 허리에 과부하가 생기고 복부가 앞으로 튀어나와 보입니다.',
      cascade: PATTERN_CASCADES['core_weakness'],
      severity,
      priority: 3,
      exerciseIds: ['pelvic_tilt', 'draw_in', 'dead_bug', 'bird_dog', 'pallof_press', 'rdl'],
    });
  }

  // ─── 상체 비대칭 ──────────────────────────────────────────
  const shoulderStiff = answers['shoulder_stiff'];
  const gripWeak = answers['grip_weak'];
  const photoShoulderSeverity = findIssueSeverity('upper_asymmetry');

  const upperSignals = [shoulderStiff, gripWeak].filter((v) => v && v !== '없음');
  const neckPain = painLocations.some((p) => p.includes('neck') || p.includes('shoulder'));

  if (upperSignals.length >= 1 || neckPain || photoShoulderSeverity) {
    patterns.push({
      id: 'upper_asymmetry',
      name: '어깨/상체 비대칭',
      description: '어깨 높이 차이나 좌우 근력 불균형이 있는 상태입니다. 흉추 가동성 저하와 연관되는 경우가 많습니다.',
      cascade: PATTERN_CASCADES['upper_asymmetry'],
      severity: (neckPain || photoShoulderSeverity === 'high') ? 'medium' : 'low',
      priority: 4,
      side: sideDominant([shoulderStiff, gripWeak]),
      exerciseIds: ['thoracic_rotation', 'wall_angels', 'shoulder_rolls'],
    });
  }

  // ─── 고관절 외회전 과도 ────────────────────────────────────
  const footExternal = answers['foot_direction'];
  const hipClickAns = answers['hip_click'];
  const photoHipExt = allIssues.find((i) => i.patternId === 'hip_external_rotation');

  if ((footExternal && footExternal !== '없음') || (hipClickAns && hipClickAns !== '없음') || photoHipExt) {
    patterns.push({
      id: 'hip_external_rotation',
      name: '고관절 외회전 과도',
      description: '발이 과도하게 바깥으로 향하는 패턴입니다. 고관절 내회전이 부족하고 이상근이 단축된 경우 많습니다.',
      cascade: PATTERN_CASCADES['hip_external_rotation'],
      severity: 'medium',
      priority: 2,
      side: sideDominant([footExternal, hipClickAns]),
      exerciseIds: ['90_90_stretch', 'pigeon_pose', 'clamshell'],
    });
  }

  return patterns.sort((a, b) => a.priority - b.priority);
}

function computeSeverity(signals: number, threshold: number): Severity {
  if (signals >= threshold) return 'high';
  if (signals >= threshold / 2) return 'medium';
  return 'low';
}

function sideDominant(values: (string | undefined | null)[]): 'left' | 'right' | 'both' | undefined {
  const cleaned = values.filter(Boolean) as string[];
  const left = cleaned.filter((v) => v === '좌측').length;
  const right = cleaned.filter((v) => v === '우측').length;
  const both = cleaned.filter((v) => v === '양쪽').length;
  if (both > 0 || (left > 0 && right > 0)) return 'both';
  if (left > 0) return 'left';
  if (right > 0) return 'right';
  return undefined;
}
