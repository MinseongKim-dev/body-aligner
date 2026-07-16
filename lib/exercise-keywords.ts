import { EXERCISES } from './exercises';
import type { VideoExercise } from './types';

// keyword → exercise ID mapping
const KEYWORD_MAP: Record<string, string> = {
  // 클램쉘
  클램쉘: 'clamshell', 클렘쉘: 'clamshell', 'clam shell': 'clamshell', clamshell: 'clamshell',
  // 글루트 브릿지
  '글루트 브릿지': 'glute_bridge', 글루트브릿지: 'glute_bridge', '힙 브릿지': 'glute_bridge',
  '힙브릿지': 'glute_bridge', 'glute bridge': 'glute_bridge', 'hip bridge': 'glute_bridge',
  // 데드벅
  데드벅: 'dead_bug', '데드 벅': 'dead_bug', '데드버그': 'dead_bug', 'dead bug': 'dead_bug',
  // 드로인
  드로인: 'draw_in', '드로 인': 'draw_in', 'draw in': 'draw_in', '복횡근 수축': 'draw_in',
  // 골반 틸트
  '골반 틸트': 'pelvic_tilt', 골반틸트: 'pelvic_tilt', 'pelvic tilt': 'pelvic_tilt',
  // 사이드워크
  사이드워크: 'side_walk', '사이드 워크': 'side_walk', 'side walk': 'side_walk', '옆으로 걷기': 'side_walk',
  '밴드 사이드워크': 'side_walk', 'lateral band walk': 'side_walk',
  // 밴드 스쿼트
  '밴드 스쿼트': 'band_squat', 밴드스쿼트: 'band_squat', 'band squat': 'band_squat',
  // 발목 스트레칭
  '월 앵클': 'wall_ankle_stretch', '벽 발목': 'wall_ankle_stretch', 'wall ankle': 'wall_ankle_stretch',
  '발목 스트레칭': 'wall_ankle_stretch', 'ankle stretch': 'wall_ankle_stretch',
  // 토 레이즈
  '토 레이즈': 'toe_raises', 토레이즈: 'toe_raises', '발가락 들기': 'toe_raises', 'toe raise': 'toe_raises',
  // 90-90
  '90-90': '90_90_stretch', '9090': '90_90_stretch', '구십구십': '90_90_stretch', '90도 스트레칭': '90_90_stretch',
  '90-90 스트레칭': '90_90_stretch', '90-90 stretch': '90_90_stretch',
  // 장요근
  '장요근 스트레칭': 'hip_flexor_stretch', '힙 플렉서': 'hip_flexor_stretch', '장요근': 'hip_flexor_stretch',
  'hip flexor': 'hip_flexor_stretch', '고관절 굴곡근': 'hip_flexor_stretch',
  // 버드독
  버드독: 'bird_dog', '버드 독': 'bird_dog', 'bird dog': 'bird_dog', '사지 교차': 'bird_dog',
  // 당나귀 킥
  '당나귀 킥': 'donkey_kicks', '도니킥': 'donkey_kicks', '도니 킥': 'donkey_kicks', 'donkey kick': 'donkey_kicks',
  '힙 익스텐션': 'donkey_kicks', 'hip extension': 'donkey_kicks',
  // 스탠딩 둔근
  '스탠딩 둔근': 'standing_glute_squeeze', '서서 엉덩이': 'standing_glute_squeeze', 'standing glute': 'standing_glute_squeeze',
  // 힙 어덕션/외전
  '힙 어덕션': 'hip_abduction', '고관절 외전': 'hip_abduction', 'hip abduction': 'hip_abduction',
  '밴드 외전': 'hip_abduction',
  // 한 다리 브릿지
  '한 다리 브릿지': 'single_leg_bridge', '싱글 레그 브릿지': 'single_leg_bridge', 'single leg bridge': 'single_leg_bridge',
  // 힙 쓰러스트
  '힙 쓰러스트': 'hip_thrust', 힙쓰러스트: 'hip_thrust', 'hip thrust': 'hip_thrust',
  // 팔로프 프레스
  '팔로프 프레스': 'pallof_press', '팔로프': 'pallof_press', 'pallof press': 'pallof_press',
  // 흉추 회전
  '흉추 회전': 'thoracic_rotation', '등 회전': 'thoracic_rotation', 'thoracic rotation': 'thoracic_rotation',
  '흉추 가동성': 'thoracic_rotation', '흉추가동성': 'thoracic_rotation',
  // 월 엔젤
  '월 엔젤': 'wall_angels', '월엔젤': 'wall_angels', 'wall angel': 'wall_angels', '벽 천사': 'wall_angels',
  // 비둘기 자세
  '비둘기 자세': 'pigeon_pose', '피전 포즈': 'pigeon_pose', 'pigeon pose': 'pigeon_pose',
  // 카프 레이즈
  '카프 레이즈': 'calf_raise', 카프레이즈: 'calf_raise', '종아리 운동': 'calf_raise', 'calf raise': 'calf_raise',
  '발뒤꿈치 들기': 'calf_raise',
  // 종아리 스트레칭
  '종아리 스트레칭': 'calf_stretch', '카프 스트레칭': 'calf_stretch', 'calf stretch': 'calf_stretch',
  // 루마니안 데드리프트
  'RDL': 'rdl', 'rdl': 'rdl', '루마니안': 'rdl', '루마니안 데드리프트': 'rdl', 'romanian deadlift': 'rdl',
  // 스플릿 스쿼트
  '스플릿 스쿼트': 'split_squat', '불가리안': 'split_squat', '불가리안 스플릿': 'split_squat',
  'split squat': 'split_squat', 'bulgarian split squat': 'split_squat',
  // 발목 돌리기
  '발목 돌리기': 'ankle_circles', '발목 원': 'ankle_circles', 'ankle circle': 'ankle_circles',
  // 발목 가동성
  '발목 가동성': 'wall_ankle_stretch', '발목 가동범위': 'wall_ankle_stretch',
};

export function matchExercisesFromTranscript(transcript: string): VideoExercise[] {
  const text = transcript.toLowerCase();
  const found = new Map<string, VideoExercise>();

  for (const [keyword, exerciseId] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword.toLowerCase()) && !found.has(exerciseId)) {
      const ex = EXERCISES[exerciseId];
      if (ex) {
        found.set(exerciseId, {
          name: ex.nameKr,
          exerciseId: ex.id,
          targetMuscles: ex.targetMuscles,
          difficulty: ex.difficulty === 'beginner' ? '초급' : ex.difficulty === 'intermediate' ? '중급' : '고급',
          equipment: ex.equipment,
          purpose: purposeKr(ex.purpose),
          patternIds: ex.patternIds,
        });
      }
    }
  }

  return Array.from(found.values());
}

function purposeKr(purpose: string): string {
  const map: Record<string, string> = {
    strength: '근력 강화',
    mobility: '가동범위',
    activation: '활성화',
    stretch: '스트레칭',
  };
  return map[purpose] ?? purpose;
}
