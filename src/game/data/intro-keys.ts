// 初めて使うときに説明を出す機能の一覧（保存データの読み込みでも使うので、ほかに依存しない小さなファイルにしておく）

export type IntroKey = 'play' | 'dive' | 'dress' | 'decor' | 'zukan' | 'visitor' | 'sleep';

export const INTRO_KEYS: IntroKey[] = ['play', 'dive', 'dress', 'decor', 'zukan', 'visitor', 'sleep'];
