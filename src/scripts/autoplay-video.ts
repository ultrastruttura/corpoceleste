/**
 * Muted inline loops across Safari/iOS/Chrome/Android.
 * Avoid CSS mask/filter/transform on the <video> itself — those freeze frames on some iOS GPUs.
 */
export function bindAutoplayVideos(root: ParentNode = document) {
  root.querySelectorAll<HTMLVideoElement>("[data-autoplay-video]").forEach(prime);
}

function prime(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  try {
    video.disableRemotePlayback = true;
  } catch {
    /* older WebKit */
  }

const tryPlay = () => {
    if (document.hidden) return;
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  tryPlay();

  for (const ev of ["loadedmetadata", "loadeddata", "canplay"] as const) {
    video.addEventListener(ev, tryPlay);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tryPlay();
  });

  // bfcache restore (Safari back-swipe) leaves media paused
  window.addEventListener("pageshow", () => tryPlay());

  // Low Power Mode / data saver / in-app browsers: unlock on first gesture
  const unlock = () => tryPlay();
  for (const ev of ["pointerdown", "touchstart", "keydown"] as const) {
    document.addEventListener(ev, unlock, { passive: true });
  }

  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) tryPlay();
          else if (!video.paused) video.pause();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(video);
  }
}
