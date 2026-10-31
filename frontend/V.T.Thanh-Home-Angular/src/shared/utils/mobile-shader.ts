export function isMobileShaderMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
    window.matchMedia('(max-width: 767px), (max-width: 1023px) and (max-height: 500px)').matches
  );
}

export function applyMobileShaderBackground(
  canvas: HTMLCanvasElement,
  page: 'home' | 'about' | 'blog' | 'project',
): boolean {
  if (!isMobileShaderMode()) return false;
  canvas.classList.add('mobile-shader-background', `mobile-shader-${page}`);
  return true;
}
