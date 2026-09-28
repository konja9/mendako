import { FOODS, ITEMS, SLOTS, STATS, ITEM_BY_ID, STAGE_UP_BONUS } from './game/data.js';
import * as Game from './game/state.js';
import { loadSave, writeSave, clearSave } from './game/save.js';
import { mendakoSVG, expressionFor } from './view/mendako.js';
import { ICONS, FOOD_ICONS, PEARL, HEART, SPARKLE } from './view/icons.js';
import { createOcean } from './view/ocean.js';
import { runMinigame } from './view/minigame.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector, root = document) => root.querySelector(selector);

const LINES = {
  hungry: ['おなか すいたなぁ…', 'ヨコエビ たべたい…'],
  tired: ['ねむたい…', 'ふぁ〜あ'],
  sad: ['かまってほしいな', 'さみしいよ〜'],
  great: ['ぷかぷか〜♪', 'きょうも ごきげん！', 'マリンスノー きれいだね'],
  normal: ['ぷかぷか〜', 'ヒレを ぱたぱた', 'すいしん 400メートルは しずかだね', 'マリンスノーが ふってる'],
  sleep: [],
};

const FAIL_MESSAGES = {
  sleeping: 'ねてるよ。そっと しておこう',
  full: 'おなか いっぱいみたい',
  tired: 'つかれてるみたい。ねかせて あげよう',
  tickled: 'くすぐったい〜！',
};

let state = Game.normalizeState(loadSave());
const away = Game.tick(state);

const ui = {
  app: $('#app'),
  name: $('#name'),
  stageChip: $('#stageChip'),
  pearls: $('#pearlCount'),
  stage: $('#stage'),
  actor: $('#actor'),
  mendako: $('#mendako'),
  bubble: $('#bubble'),
  toast: $('#toast'),
  fx: $('#fx'),
  bondFill: $('#bondFill'),
  bondText: $('#bondText'),
  sleepBtn: $('[data-action="sleep"]'),
  backdrop: $('#backdrop'),
  sheet: $('#sheet'),
  sheetTitle: $('#sheetTitle'),
  sheetBody: $('#sheetBody'),
  sheetFoot: $('#sheetFoot'),
  celebrate: $('#celebrate'),
};

const ocean = createOcean($('#ocean'), { reducedMotion });

// ---------- 描画 ----------

let override = null; // { expression, until }
let tryOn = null; // きせかえで試着中のアイテム id
let lastSvgKey = '';

function currentLook() {
  const equipped = { ...state.equipped };
  if (tryOn) equipped[ITEM_BY_ID[tryOn].slot] = tryOn;
  const expression =
    override && override.until > Date.now() ? override.expression : expressionFor(Game.conditionOf(state));
  return { equipped, expression };
}

function renderMendako() {
  const look = currentLook();
  const key = JSON.stringify(look);
  if (key === lastSvgKey) return;
  lastSvgKey = key;
  ui.mendako.innerHTML = mendakoSVG({ ...look, label: `${escapeHtml(state.name)}（タップで なでる）` });
}

function render() {
  const stage = Game.stageFor(state.exp);
  ui.name.textContent = state.name;
  ui.stageChip.textContent = stage.label;
  ui.pearls.textContent = state.pearls;
  ui.actor.style.setProperty('--scale', stage.scale);
  ui.bondFill.style.width = `${Math.round(stage.progress * 100)}%`;
  ui.bondText.textContent = stage.next
    ? `つぎの せいちょうまで あと ${Math.ceil(stage.next.minExp - state.exp)}`
    : 'いちばん おおきく なったよ';

  for (const stat of STATS) {
    const value = state.stats[stat.id];
    const gauge = $(`[data-stat="${stat.id}"]`);
    $('.g-fill', gauge).style.width = `${value}%`;
    gauge.classList.toggle('is-low', value < Game.LOW_STAT);
    gauge.setAttribute('aria-valuenow', Math.round(value));
  }

  ui.app.classList.toggle('is-sleeping', state.sleeping);
  for (const action of ['food', 'pet', 'play']) {
    $(`[data-action="${action}"]`).setAttribute('aria-disabled', String(state.sleeping));
  }
  $('.a-icon', ui.sleepBtn).innerHTML = state.sleeping ? ICONS.sun : ICONS.moon;
  $('.a-label', ui.sleepBtn).textContent = state.sleeping ? 'おきる' : 'ねる';
  renderMendako();
}

function persist() {
  writeSave(state);
}

// ---------- 演出 ----------

let toastTimer = 0;
function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove('is-shown'), 2600);
}

let bubbleTimer = 0;
let bubbleFollowing = false;
function say(message, ms = 3200) {
  if (!message) return;
  ui.bubble.textContent = message;
  ui.bubble.classList.add('is-shown');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => ui.bubble.classList.remove('is-shown'), ms);
  if (!bubbleFollowing) {
    bubbleFollowing = true;
    requestAnimationFrame(placeBubble);
  }
}

// ふきだしは めんだこの 左上に出し、画面からはみ出さないようにする
function placeBubble() {
  const svg = $('svg', ui.mendako);
  if (!ui.bubble.classList.contains('is-shown') || !svg) {
    bubbleFollowing = false;
    return;
  }
  const stageRect = ui.stage.getBoundingClientRect();
  const r = svg.getBoundingClientRect();
  const w = ui.bubble.offsetWidth;
  const h = ui.bubble.offsetHeight;
  const left = Math.min(Math.max(4, r.left + r.width * 0.5 - stageRect.left - w * 0.9), stageRect.width - w - 4);
  const top = Math.max(4, r.top + r.height * 0.2 - stageRect.top - h);
  ui.bubble.style.left = `${left}px`;
  ui.bubble.style.top = `${top}px`;
  requestAnimationFrame(placeBubble);
}

function express(expression, ms) {
  override = { expression, until: Date.now() + ms };
  renderMendako();
  setTimeout(renderMendako, ms + 20);
}

function squish() {
  const svg = $('svg', ui.mendako);
  if (!svg || reducedMotion) return;
  svg.classList.remove('is-squish');
  void svg.getBoundingClientRect();
  svg.classList.add('is-squish');
}

function stagePoint(clientX, clientY) {
  const rect = ui.stage.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function actorCenter() {
  const r = $('svg', ui.mendako).getBoundingClientRect();
  return stagePoint(r.left + r.width / 2, r.top + r.height * 0.55);
}

function burst(svg, { x, y }, count, spread = 60) {
  if (reducedMotion) count = 1;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'fx-float';
    el.innerHTML = svg;
    el.style.left = `${x + (Math.random() - 0.5) * spread}px`;
    el.style.top = `${y + (Math.random() - 0.5) * spread * 0.4}px`;
    el.style.animationDelay = `${i * 70}ms`;
    el.addEventListener('animationend', () => el.remove());
    ui.fx.append(el);
  }
}

function dropFood(food) {
  return new Promise((resolve) => {
    const target = actorCenter();
    const el = document.createElement('span');
    el.className = 'fx-food';
    el.innerHTML = FOOD_ICONS[food.id];
    ui.fx.append(el);
    const anim = el.animate(
      [
        { transform: `translate(${target.x - 22}px, -60px) rotate(-20deg)` },
        { transform: `translate(${target.x - 22}px, ${target.y - 22}px) rotate(10deg)` },
      ],
      { duration: reducedMotion ? 1 : 900, easing: 'cubic-bezier(.35,.1,.6,1)', fill: 'forwards' },
    );
    anim.onfinish = () => {
      el.remove();
      resolve();
    };
  });
}

function celebrate(stage) {
  ui.celebrate.innerHTML = `
    <div class="celebrate-card" role="dialog" aria-modal="true" aria-labelledby="celebrateTitle">
      <div class="celebrate-art">${mendakoSVG({ equipped: state.equipped, expression: 'happy' })}</div>
      <h2 id="celebrateTitle">おおきく なった！</h2>
      <p>${escapeHtml(state.name)}は <b>${stage.label}</b> に なったよ</p>
      <p class="celebrate-bonus">${PEARL} おいわいの しんじゅ +${STAGE_UP_BONUS}</p>
      <button class="btn btn-primary" type="button">やったね</button>
    </div>`;
  ui.celebrate.hidden = false;
  const btn = $('button', ui.celebrate);
  btn.focus();
  btn.addEventListener('click', () => {
    ui.celebrate.hidden = true;
  });
}

function afterAction(result) {
  persist();
  render();
  if (result?.stageUp) setTimeout(() => celebrate(result.stageUp), 700);
}

// ---------- うろうろ ----------

let wanderTimer = 0;
function wander() {
  clearTimeout(wanderTimer);
  if (reducedMotion) return;
  const stageWidth = ui.stage.clientWidth;
  if (state.sleeping) {
    ui.actor.style.setProperty('--dx', '0px');
    ui.actor.style.setProperty('--dy', '14px');
    ui.actor.style.setProperty('--tilt', '0deg');
  } else if (!ui.app.classList.contains('is-dressing')) {
    const prev = parseFloat(ui.actor.style.getPropertyValue('--dx')) || 0;
    const range = Math.max(0, (stageWidth - ui.actor.offsetWidth * 0.75) / 2);
    const dx = (Math.random() * 2 - 1) * range;
    const dy = -Math.random() * 36;
    ui.actor.style.setProperty('--dx', `${dx.toFixed(0)}px`);
    ui.actor.style.setProperty('--dy', `${dy.toFixed(0)}px`);
    ui.actor.style.setProperty('--tilt', `${dx > prev ? 6 : -6}deg`);
    setTimeout(() => ui.actor.style.setProperty('--tilt', '0deg'), 1800);
  }
  wanderTimer = setTimeout(wander, 4200 + Math.random() * 4000);
}

// ---------- 行動 ----------

function doPet(point) {
  const result = Game.pet(state);
  if (!result.ok) {
    if (result.reason === 'tickled') {
      express('tickled', 1400);
      say(FAIL_MESSAGES.tickled, 1800);
    } else {
      toast(FAIL_MESSAGES[result.reason]);
    }
    return;
  }
  squish();
  express('happy', 1200);
  burst(HEART, point ?? actorCenter(), 3);
  if (Math.random() < 0.3) say(['えへへ', 'もっと〜', 'ふにゃ'][Math.floor(Math.random() * 3)], 1600);
  afterAction(result);
}

async function doFeed(foodId) {
  const result = Game.feed(state, foodId);
  if (!result.ok) {
    toast(result.reason === 'pearls' ? `しんじゅが あと ${result.need}こ たりないよ` : FAIL_MESSAGES[result.reason]);
    return;
  }
  closeSheet();
  persist();
  ui.pearls.textContent = state.pearls;
  await dropFood(result.food);
  express('eat', 1300);
  const c = actorCenter();
  burst(SPARKLE, c, 3, 90);
  setTimeout(() => express('happy', 1200), 1300);
  toast(`${result.food.name}を たべた！ おなか +${result.food.hunger}`);
  if (result.food.id === 'amphipod') say('だいすき〜！', 2000);
  afterAction(result);
}

async function doPlay() {
  const check = Game.canPlay(state);
  if (!check.ok) {
    toast(FAIL_MESSAGES[check.reason]);
    return;
  }
  clearTimeout(wanderTimer);
  const outcome = await runMinigame({
    equipped: state.equipped,
    reducedMotion,
    onFinish: (res) => {
      const r = Game.finishPlay(state, res);
      persist();
      return r;
    },
  });
  render();
  wander();
  $('[data-action="play"]').focus();
  if (outcome.played) {
    express('happy', 1500);
    if (outcome.stageUp) setTimeout(() => celebrate(outcome.stageUp), 500);
  }
}

function doSleep() {
  Game.toggleSleep(state);
  toast(state.sleeping ? 'おやすみ… げんきが たまるよ' : 'おはよう！');
  afterAction();
  wander();
}

// ---------- シート（ごはん・きせかえ・せってい） ----------

let sheetReturnFocus = null;
let sheetKind = null;

function openSheet(kind, title) {
  sheetReturnFocus = document.activeElement;
  sheetKind = kind;
  ui.sheetTitle.textContent = title;
  ui.sheet.dataset.kind = kind;
  ui.sheet.hidden = false;
  ui.backdrop.hidden = false;
  ui.app.classList.toggle('is-dressing', kind === 'dress');
  if (kind === 'dress') {
    ui.actor.style.setProperty('--dx', '0px');
    ui.actor.style.setProperty('--dy', '0px');
  }
  requestAnimationFrame(() => {
    liftActor();
    const first = $('button, input', ui.sheetBody);
    (first ?? $('.sheet-close', ui.sheet)).focus();
  });
}

// シートで隠れないよう、めんだこを持ち上げる
function liftActor() {
  if (ui.sheet.hidden) {
    ui.stage.style.setProperty('--lift', '0px');
    return;
  }
  // 表示アニメーション中でも最終位置で計算する（シートは画面下に固定）
  const sheetTop = window.innerHeight - ui.sheet.offsetHeight;
  const overlap = ui.stage.getBoundingClientRect().bottom - sheetTop;
  ui.stage.style.setProperty('--lift', `${Math.max(0, overlap)}px`);
}

function closeSheet() {
  if (ui.sheet.hidden) return;
  ui.sheet.hidden = true;
  ui.backdrop.hidden = true;
  ui.sheetFoot.hidden = true;
  ui.app.classList.remove('is-dressing');
  sheetKind = null;
  tryOn = null;
  liftActor();
  renderMendako();
  sheetReturnFocus?.focus?.();
}

function priceTag(price) {
  return price === 0 ? '<span class="price is-free">むりょう</span>' : `<span class="price">${PEARL}${price}</span>`;
}

function openFood() {
  ui.sheetBody.innerHTML = `<div class="food-grid">${FOODS.map(
    (food) => `
      <button class="card food-card" type="button" data-food="${food.id}" ${state.pearls < food.price ? 'aria-disabled="true"' : ''}>
        <span class="food-art">${FOOD_ICONS[food.id]}</span>
        <span class="card-name">${food.name}</span>
        <span class="card-note">${food.note}</span>
        <span class="food-effect">おなか +${food.hunger}<br>ごきげん +${food.mood}</span>
        ${priceTag(food.price)}
      </button>`,
  ).join('')}</div>`;
  openSheet('food', 'ごはん');
}

let dressSlot = 'head';

function renderDress() {
  const tabs = SLOTS.map(
    (slot) =>
      `<button class="tab" type="button" role="tab" data-slot="${slot.id}" aria-selected="${slot.id === dressSlot}">${slot.label}</button>`,
  ).join('');
  const cards = ITEMS.filter((item) => item.slot === dressSlot)
    .map((item) => {
      const owned = state.owned.includes(item.id);
      const worn = state.equipped[item.slot] === item.id;
      const trying = tryOn === item.id;
      const look = { ...state.equipped, [item.slot]: item.id };
      const status = worn ? '<span class="badge">きてる</span>' : owned ? '<span class="badge is-owned">もってる</span>' : priceTag(item.price);
      return `
        <button class="card dress-card${worn ? ' is-worn' : ''}${trying ? ' is-trying' : ''}" type="button" data-item="${item.id}" aria-pressed="${worn}">
          <span class="dress-art">${mendakoSVG({ equipped: look, expression: 'normal', label: item.name })}</span>
          <span class="card-name">${item.name}</span>
          ${status}
        </button>`;
    })
    .join('');
  const hint = SLOTS.find((s) => s.id === dressSlot).removable
    ? 'きている ものを もういちど おすと はずせるよ'
    : 'もっていない ものは おして ためしぎ できるよ';
  ui.sheetBody.innerHTML = `<div class="tabs" role="tablist">${tabs}</div><p class="sheet-hint">${hint}</p><div class="dress-grid">${cards}</div>`;
  renderTryOnFoot();
  requestAnimationFrame(liftActor);
}

function renderTryOnFoot() {
  if (!tryOn) {
    ui.sheetFoot.hidden = true;
    return;
  }
  const item = ITEM_BY_ID[tryOn];
  const short = item.price - state.pearls;
  ui.sheetFoot.innerHTML = `
    <span class="foot-text"><b>${item.name}</b>を ためしちゅう${short > 0 ? `<br><small>しんじゅが あと ${short}こ たりないよ</small>` : ''}</span>
    <button class="btn btn-primary js-buy" type="button" ${short > 0 ? 'disabled' : ''}>${PEARL}${item.price}で かう</button>`;
  ui.sheetFoot.hidden = false;
}

function openDress() {
  tryOn = null;
  renderDress();
  openSheet('dress', 'きせかえ');
}

function onDressClick(e) {
  const tab = e.target.closest('[data-slot]');
  if (tab) {
    dressSlot = tab.dataset.slot;
    tryOn = null;
    renderDress();
    renderMendako();
    $(`[data-slot="${dressSlot}"]`, ui.sheetBody).focus();
    return;
  }
  const card = e.target.closest('[data-item]');
  if (!card) return;
  const id = card.dataset.item;
  if (state.owned.includes(id)) {
    tryOn = null;
    Game.equip(state, id);
    squish();
    afterAction();
  } else {
    tryOn = tryOn === id ? null : id;
    squish();
    renderMendako();
  }
  renderDress();
  $(`[data-item="${id}"]`, ui.sheetBody)?.focus();
}

function onBuy() {
  if (!tryOn) return;
  const id = tryOn;
  const result = Game.buy(state, id);
  if (!result.ok) {
    toast(result.reason === 'pearls' ? `しんじゅが あと ${result.need}こ たりないよ` : 'かえなかったよ');
    return;
  }
  Game.equip(state, id);
  tryOn = null;
  toast(`${result.item.name}を かったよ！`);
  express('happy', 1400);
  burst(SPARKLE, actorCenter(), 4, 110);
  afterAction();
  renderDress();
}

function openSettings() {
  const days = Math.floor((Date.now() - state.bornAt) / 86400000) + 1;
  ui.sheetBody.innerHTML = `
    <form class="rename" id="renameForm">
      <label for="nameInput">なまえ</label>
      <div class="rename-row">
        <input id="nameInput" name="name" maxlength="${Game.NAME_MAX}" value="${escapeHtml(state.name)}" autocomplete="off">
        <button class="btn" type="submit">かえる</button>
      </div>
    </form>
    <dl class="record">
      <div><dt>いっしょに すごして</dt><dd>${days}にちめ</dd></div>
      <div><dt>ごはん</dt><dd>${state.counts.fed}かい</dd></div>
      <div><dt>なでた</dt><dd>${state.counts.petted}かい</dd></div>
      <div><dt>あそんだ</dt><dd>${state.counts.played}かい</dd></div>
      <div><dt>ベストスコア</dt><dd>${state.bestScore}</dd></div>
    </dl>
    <div class="dev">
      <p class="dev-title">テストよう（プロトタイプ）</p>
      <div class="dev-row">
        <button class="btn btn-small" type="button" data-dev="hour">じかんを 1じかん すすめる</button>
        <button class="btn btn-small" type="button" data-dev="pearls">しんじゅ +100</button>
        <button class="btn btn-small" type="button" data-dev="exp">なかよし +100</button>
      </div>
      <button class="btn btn-small btn-danger" type="button" data-dev="reset">データを さいしょから</button>
    </div>`;
  openSheet('settings', 'せってい');
}

let resetArmed = 0;
function onSettingsClick(e) {
  const btn = e.target.closest('[data-dev]');
  if (!btn) return;
  const kind = btn.dataset.dev;
  if (kind === 'hour') {
    state.lastTick -= 60 * 60000;
    const r = Game.tick(state);
    toast(r.wokeUp ? '1じかん たった。おきたよ！' : '1じかん たったよ');
  } else if (kind === 'pearls') {
    state.pearls += 100;
    toast('しんじゅ +100');
  } else if (kind === 'exp') {
    const before = Game.stageFor(state.exp).index;
    state.exp += 100;
    const after = Game.stageFor(state.exp);
    if (after.index > before) {
      state.pearls += STAGE_UP_BONUS;
      closeSheet();
      afterAction({ stageUp: after });
      return;
    }
    toast('なかよし +100');
  } else if (kind === 'reset') {
    if (Date.now() > resetArmed) {
      resetArmed = Date.now() + 4000;
      btn.textContent = 'ほんとうに けす？ もういちど おしてね';
      return;
    }
    clearSave();
    state = Game.createState();
    closeSheet();
    toast('さいしょから はじめるよ');
  }
  afterAction();
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// ---------- イベント ----------

ui.mendako.addEventListener('click', (e) => {
  const point = e.detail > 0 ? stagePoint(e.clientX, e.clientY) : null;
  doPet(point);
});

$('.actions').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (btn.getAttribute('aria-disabled') === 'true') {
    toast(FAIL_MESSAGES.sleeping);
    return;
  }
  if (action === 'food') openFood();
  if (action === 'pet') doPet();
  if (action === 'play') doPlay();
  if (action === 'dress') openDress();
  if (action === 'sleep') doSleep();
});

$('#menuBtn').addEventListener('click', openSettings);
$('#nameBtn').addEventListener('click', openSettings);
ui.backdrop.addEventListener('click', closeSheet);
$('.sheet-close', ui.sheet).addEventListener('click', closeSheet);
ui.sheetFoot.addEventListener('click', (e) => {
  if (e.target.closest('.js-buy')) onBuy();
});

ui.sheetBody.addEventListener('click', (e) => {
  if (sheetKind === 'food') {
    const card = e.target.closest('[data-food]');
    if (!card) return;
    doFeed(card.dataset.food);
  } else if (sheetKind === 'dress') {
    onDressClick(e);
  } else if (sheetKind === 'settings') {
    onSettingsClick(e);
  }
});

ui.sheetBody.addEventListener('submit', (e) => {
  e.preventDefault();
  const result = Game.rename(state, $('#nameInput').value);
  toast(result.ok ? `なまえを「${result.name}」に したよ` : 'なまえを いれてね');
  afterAction();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!ui.celebrate.hidden) ui.celebrate.hidden = true;
  else closeSheet();
});

window.addEventListener('resize', liftActor);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    persist();
  } else {
    Game.tick(state);
    afterAction();
  }
});

// ---------- 開始 ----------

// 日本語の文節で改行させるため（word-break: auto-phrase は lang="ja" が必要）
document.documentElement.lang = 'ja';

for (const el of document.querySelectorAll('[data-icon]')) {
  el.innerHTML = el.dataset.icon === 'pearl' ? PEARL : ICONS[el.dataset.icon];
}

setInterval(() => {
  const r = Game.tick(state);
  if (r.wokeUp) {
    toast('ぐっすり ねて、げんき いっぱい！');
    wander();
  }
  persist();
  render();
}, 3000);

// ときどき ひとりごと
function chatter() {
  const condition = Game.conditionOf(state);
  const lines = LINES[condition];
  if (lines.length && ui.sheet.hidden && !document.hidden) {
    say(lines[Math.floor(Math.random() * lines.length)]);
    const c = actorCenter();
    const rect = ui.stage.getBoundingClientRect();
    ocean.bubblesAt(rect.left + c.x, rect.top + c.y - 40, 3);
  }
  const urgent = condition === 'hungry' || condition === 'tired' || condition === 'sad';
  setTimeout(chatter, (urgent ? 9000 : 16000) + Math.random() * 8000);
}

render();
persist();
wander();
setTimeout(chatter, 6000);
if (away.minutes > 20) {
  toast(away.wokeUp ? 'おかえり！ ぐっすり ねて げんきだよ' : 'おかえり！');
} else if (state.counts.fed + state.counts.petted === 0) {
  setTimeout(() => say(`はじめまして、${state.name}だよ`, 3600), 600);
}
