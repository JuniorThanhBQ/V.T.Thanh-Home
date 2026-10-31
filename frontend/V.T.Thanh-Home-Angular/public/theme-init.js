(function () {
  let theme;
  try {
    const saved = window.localStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {}
  if (!theme) {
    try {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      theme = 'light';
    }
  }
  const root = document.documentElement;
  root.classList.add('theme-initializing');
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.addEventListener(
    'DOMContentLoaded',
    function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.classList.remove('theme-initializing');
        });
      });
    },
    { once: true },
  );
})();
