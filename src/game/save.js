// localStorage への保存。使えない環境（プライベートモード等）でもゲームは動く。

const KEY = 'shinkai-pukapuka.save.v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 保存できない環境では消すものもない
  }
}
