/**
 * 환경별 base path 대응 내부 URL 헬퍼.
 * astro.config.mjs의 base 설정이 빌드 시점에 import.meta.env.BASE_URL로 주입됨
 * (trailing slash 포함: '/' 또는 '/calculator-hub/').
 *
 * u('/salary/') → base '/' 일 때 '/salary/', base '/calculator-hub' 일 때 '/calculator-hub/salary/'
 */

// import.meta.env는 Astro/Vite 빌드에서만 존재. plain node(단위 테스트)에서는 '/'로 폴백.
const RAW_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.BASE_URL === 'string' &&
    import.meta.env.BASE_URL) ||
  '/';

const BASE = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE; // '' 또는 '/calculator-hub'

/** 내부 경로에 base prefix를 붙여 반환. path는 '/'로 시작하는 형태 권장. */
export function u(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}`;
}

/** 현재 빌드의 base prefix ('' 또는 '/calculator-hub'). 디버깅용. */
export const BASE_PATH = BASE;
