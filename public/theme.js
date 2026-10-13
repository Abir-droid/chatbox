// Runs before first paint (loaded in <head>) so the saved theme never flashes.
(function () {
  try {
    var saved = localStorage.getItem('chatbox.theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) { /* storage blocked: follow the system theme */ }
})();
