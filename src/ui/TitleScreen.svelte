<script lang="ts">
  // スタート画面。後ろでは水槽がそのまま動いている。どこをタップしても始まる。
  import { onMount } from 'svelte';
  import { game, openSheet } from '../app/actions';
  import { startFromTitle } from '../app/onboarding';
  import { sheet } from '../app/ui-state';
  import { ICONS } from '../art/icons';
  import { TIPS } from '../game/data/help';
  import { pickTip } from '../game/help';

  const LAST_TIP_KEY = 'shinkai-pukapuka.lastTip';

  function lastTip() {
    try {
      return localStorage.getItem(LAST_TIP_KEY);
    } catch {
      return null;
    }
  }

  const tip = pickTip(TIPS, lastTip());
  const isNew = !game.get().help.tutorialDone;
  let startButton = $state<HTMLButtonElement>();

  onMount(() => {
    try {
      localStorage.setItem(LAST_TIP_KEY, tip.text);
    } catch {
      // 覚えておけなくても困らない
    }
    startButton?.focus({ preventScroll: true });
  });

  function start() {
    // あそびかたを開いている間は始めない
    if ($sheet) return;
    startFromTitle();
  }

  function openHelp(e: Event) {
    e.stopPropagation();
    openSheet('help');
  }
</script>

<div class="title" role="presentation" onclick={start}>
  <div class="logo">
    <p class="small">めんだこと深海の水槽</p>
    <h1><span>しんかい</span><span class="big">ぷかぷか</span></h1>
  </div>

  <div class="bottom">
    <aside class="tip" aria-label={tip.kind === 'sea' ? '深海の豆知識' : '遊びのコツ'}>
      <span class="tip-label">{@html ICONS.light}{tip.kind === 'sea' ? '深海の豆知識' : '遊びのコツ'}</span>
      <p>{tip.text}</p>
    </aside>
    {#if !isNew}
      <p class="waiting">{$game.name}が待ってるよ</p>
    {/if}
    <button class="start" type="button" bind:this={startButton} onclick={(e) => (e.stopPropagation(), start())}>
      {isNew ? 'タップしてはじめる' : 'つづきから'}
    </button>
    <button class="help" type="button" onclick={openHelp}>{@html ICONS.book}あそびかた</button>
  </div>
</div>

<style>
  .title {
    position: fixed;
    inset: 0;
    z-index: 8;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    padding: calc(56px + env(safe-area-inset-top, 0px)) 16px calc(28px + env(safe-area-inset-bottom, 0px));
    /* 上と下だけ暗くして、真ん中の水槽（めんだこ）は見せる */
    background: linear-gradient(180deg, rgba(5, 15, 41, 0.85) 0%, rgba(5, 15, 41, 0.15) 34%, rgba(5, 15, 41, 0) 52%, rgba(5, 15, 41, 0.75) 78%, rgba(5, 15, 41, 0.92) 100%);
    color: var(--on-sea);
    cursor: pointer;
    pointer-events: auto;
    animation: fade-in 0.6s ease-out;
  }

  .logo {
    text-align: center;
  }

  .small {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--on-sea-soft);
  }

  h1 {
    display: grid;
    margin: 0;
    font-family: var(--font-pop);
    font-weight: 400;
    line-height: 1.05;
    text-shadow:
      0 0 18px rgba(143, 227, 255, 0.55),
      0 3px 0 rgba(3, 10, 30, 0.6);
  }

  h1 span {
    font-size: 26px;
    letter-spacing: 0.3em;
    color: var(--glow);
  }

  h1 .big {
    font-size: clamp(46px, 15vw, 64px);
    letter-spacing: 0.04em;
    color: #fff;
  }

  .bottom {
    display: grid;
    justify-items: center;
    gap: 14px;
    width: min(var(--column), 100%);
  }

  .tip {
    box-sizing: border-box;
    width: 100%;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(5, 18, 48, 0.72);
    border: 1px solid var(--glass-line);
    cursor: default;
  }

  .tip-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--lantern);
  }

  .tip-label :global(svg) {
    width: 16px;
    height: 16px;
  }

  .tip p {
    margin: 4px 0 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .waiting {
    margin: 0 0 -6px;
    font-size: 14px;
    font-weight: 700;
    color: var(--on-sea-soft);
  }

  .start {
    min-width: 200px;
    min-height: 56px;
    padding: 0 28px;
    border: 0;
    border-radius: 99px;
    background: var(--anemone);
    color: #fff;
    font-family: var(--font-pop);
    font-size: 18px;
    box-shadow: 0 5px 0 #c2527f;
    cursor: pointer;
    animation: breathe 2.4s ease-in-out infinite;
  }

  .help {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: var(--tap);
    padding: 0 16px;
    border: 1px solid var(--glass-line);
    border-radius: 99px;
    background: rgba(5, 18, 48, 0.6);
    color: var(--on-sea);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .help :global(svg) {
    width: 20px;
    height: 20px;
  }

  @keyframes breathe {
    50% {
      transform: scale(1.04);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }

  @media (max-height: 640px) {
    .title {
      padding-top: calc(28px + env(safe-area-inset-top, 0px));
    }

    .tip p {
      font-size: 13px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .title,
    .start {
      animation: none;
    }
  }
</style>
