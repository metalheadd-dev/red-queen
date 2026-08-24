export const MOBILE_SOUND_STORAGE_KEY = "rq-mobile-sound-v1";
export const MOBILE_EXPERIENCE_EVENT = "rq-mobile-experience-updated";

let audioContext: AudioContext | null = null;

export function mobileSoundEnabled(storage: Pick<Storage, "getItem"> = localStorage) {
  return storage.getItem(MOBILE_SOUND_STORAGE_KEY) === "on";
}

export function setMobileSoundEnabled(enabled: boolean, storage: Pick<Storage, "setItem"> = localStorage) {
  storage.setItem(MOBILE_SOUND_STORAGE_KEY, enabled ? "on" : "off");
  window.dispatchEvent(new Event(MOBILE_EXPERIENCE_EVENT));
}

export function playMobileTone(tone: "tap" | "confirm" | "alert" = "tap") {
  if (typeof window === "undefined" || !mobileSoundEnabled()) return;
  const AudioContextConstructor = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  audioContext ||= new AudioContextConstructor();
  if (audioContext.state === "suspended") void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  const frequencies = tone === "alert" ? [330, 660] : tone === "confirm" ? [520, 780] : [440, 520];

  oscillator.type = tone === "alert" ? "sawtooth" : "sine";
  oscillator.frequency.setValueAtTime(frequencies[0], now);
  oscillator.frequency.exponentialRampToValueAtTime(frequencies[1], now + (tone === "alert" ? 0.16 : 0.06));
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(tone === "alert" ? 0.055 : 0.026, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (tone === "alert" ? 0.22 : 0.085));
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + (tone === "alert" ? 0.23 : 0.09));
  if (tone !== "tap" && "vibrate" in navigator) navigator.vibrate(tone === "alert" ? [20, 35, 20] : 14);
}

export async function registerRedQueenServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/rq-sw.js", { scope: "/" });
}

export async function showRedQueenNotification(title: string, options: NotificationOptions = {}) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return false;
  const registration = await registerRedQueenServiceWorker();
  if (!registration) return false;
  await registration.showNotification(title, {
    icon: "/token-image.png",
    badge: "/token-image.png",
    ...options,
  });
  playMobileTone("alert");
  return true;
}
