// `vite build` の結果（dist/）から、claude.ai の公開ページ用のファイル（dist-artifact/）を作る。
// 公開ページは <html> や <head> を自動で付けるので、それらのタグとスマホ余白の重複分を外す。

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const out = join(root, 'dist-artifact');

const html = await readFile(join(dist, 'index.html'), 'utf8');
const page = html
  .replace(/<!-- standalone-only[\s\S]*?\/standalone-only -->\n?/, '')
  .replace(/<!doctype html>\n?/i, '')
  .replace(/<\/?html[^>]*>\n?/g, '')
  .replace(/<\/?head>\n?/g, '')
  .replace(/<\/?body>\n?/g, '')
  .replace(/<meta (charset|name="viewport")[^>]*>\n?/g, '');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(dist, 'assets'), join(out, 'assets'), { recursive: true });
await writeFile(join(out, 'index.html'), page);
console.log('dist-artifact/index.html を作りました');
