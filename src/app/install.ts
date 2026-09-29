// 「ホーム画面に置く」ための案内。GitHub Pages 版（PWA）だけがホーム画面に置けるので、
// どの版で、どの端末で開いているかによって、出す案内を変える。

import { get, writable } from 'svelte/store';

/** ホーム画面に置ける版の場所 */
export const PAGES_URL = 'https://konja9.github.io/mendako/';

/** この画面が GitHub Pages 版（PWA の仕組み入り）か */
export const IS_PAGES = import.meta.env.MODE === 'pages';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Android の Chrome などが「ホーム画面に追加できるよ」と知らせてきたときのイベント */
export const installPrompt = writable<InstallPromptEvent | null>(null);

export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS() {
  const ua = navigator.userAgent;
  // iPad は Mac のふりをするので、タッチできるかで見分ける
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export async function promptInstall() {
  const e = get(installPrompt);
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  // 一度使ったイベントはもう使えない
  installPrompt.set(null);
  return outcome === 'accepted';
}

export function startInstallWatch() {
  if (!IS_PAGES) return;
  window.addEventListener('beforeinstallprompt', (e) => {
    // ブラウザが勝手に出す案内は止め、設定画面のボタンから出す
    e.preventDefault();
    installPrompt.set(e as InstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => installPrompt.set(null));
  // ホーム画面から開いているときは、保存データを消されにくくしてもらう
  if (isStandalone()) navigator.storage?.persist?.().catch(() => {});
}
