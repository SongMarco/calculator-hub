/**
 * AdSense 광고 슬롯 설정
 *
 * - 슬롯 ID는 AdSense > 광고 > 광고 단위에서 marco가 직접 생성한 실제 값.
 * - 정적 사이트라 빌드 시점에 HTML에 박히므로, ID 변경 후에는
 *   반드시 `npm run build` + 푸시(재배포)가 필요.
 * - 게시자 스크립트(ca-pub-8849084322770219)는 src/layouts/BaseLayout.astro에 고정.
 *
 * 배치 원칙 (2026-09-30, marco 확정):
 * - 히어로·계산기 입력 영역 주변 광고 금지. 첫 화면(above the fold)은 광고 없이 깨끗하게.
 * - 수동 광고 단위는 페이지당 최대 1~2개: 결과 하단(전 페이지) + 본문 하단(긴 페이지만).
 * - 앵커(하단 고정)·스티키·팝업성 포맷 사용 금지.
 * - 자동 광고(Auto ads)와 수동 배치가 겹쳐 과밀해지지 않게 보수적으로 운영.
 */
export const AD_CLIENT = 'ca-pub-8849084322770219';

export const AD_SLOTS = {
  /** 결과 하단용 (반응형) — 전 계산기 페이지 1순위 배치 */
  RESULT_BOTTOM: '6390360473',
  /** 본문 하단용 (반응형) — 긴 페이지에만 2순위로 추가 */
  IN_CONTENT: '8801824831',
};

export const AD_FORMAT = 'auto';
export const AD_FULL_WIDTH_RESPONSIVE = 'true';
