(function () {
  var STORAGE_KEY = 'osint.theme';
  var THEME_COLORS = {
    dark: '#060a10',
    light: '#f4f7fb',
  };

  var theme = null;
  try {
    var stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    }
  } catch (e) {
    // Ignore storage access errors (private mode / restricted storage)
  }

  if (!theme) {
    try {
      theme =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    } catch (e) {
      theme = 'dark';
    }
  }

  var root = document.documentElement;
  if (root) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }

  function syncThemeColorMeta() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.dark);
    }
  }

  function activateGoogleFonts() {
    var gf = document.getElementById('google-fonts');
    if (!gf) return false;
    if (gf.sheet) {
      gf.media = 'all';
    } else {
      gf.addEventListener(
        'load',
        function () {
          gf.media = 'all';
        },
        { once: true }
      );
      window.addEventListener(
        'load',
        function () {
          if (gf.media !== 'all') {
            gf.media = 'all';
          }
        },
        { once: true }
      );
    }
    return true;
  }

  syncThemeColorMeta();
  if (!activateGoogleFonts()) {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        syncThemeColorMeta();
        activateGoogleFonts();
      },
      { once: true }
    );
  }
})();
