/** 与 variables.scss 中 $breakpoint-md 保持一致 */
export const MOBILE_BREAKPOINT = 768;

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}
