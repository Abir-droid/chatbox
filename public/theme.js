// Runs before first paint (loaded in <head>) so the saved theme never flashes.
(function () {
  try {
    var saved = localStorage.getItem('chatbox.theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
