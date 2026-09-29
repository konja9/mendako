<script lang="ts">
  // 機能を初めて使うときの説明カード。
  import { onMount } from 'svelte';
  import { closeIntro } from '../app/onboarding';
  import { introCard } from '../app/ui-state';
  import { INTROS } from '../game/data/help';

  const card = $derived($introCard);
  const intro = $derived(card ? INTROS[card.key] : null);
  let button = $state<HTMLButtonElement>();

  onMount(() => {
    requestAnimationFrame(() => button?.focus({ preventScroll: true }));
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && closeIntro()} />

{#if intro && card}
  <div class="scrim"></div>
  <div class="card" role="dialog" aria-modal="true" aria-labelledby="intro-title">
    <p class="kicker">かんたん説明</p>
    <h2 id="intro-title">{intro.title}</h2>
    <ul>
      {#each intro.lines as line (line)}<li>{line}</li>{/each}
    </ul>
    <button class="btn btn-primary" type="button" bind:this={button} onclick={closeIntro}>
      {card.key === 'play' ? 'はじめる' : 'わかった'}
    </button>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 25;
    background: rgba(3, 10, 30, 0.45);
    pointer-events: auto;
  }

  .card {
    position: fixed;
    z-index: 26;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-sizing: border-box;
    width: min(360px, calc(100% - 32px));
    max-height: calc(100% - 48px);
    overflow-y: auto;
    display: grid;
    gap: 10px;
    padding: 20px 20px 18px;
    border-radius: 26px;
    background: var(--pearl);
    color: var(--ink);
    pointer-events: auto;
    animation: pop 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  .kicker {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--anemone);
  }

  h2 {
    margin: -6px 0 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 21px;
  }

  ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: left;
  }

  li {
    position: relative;
    padding-left: 18px;
    font-size: 15px;
    line-height: 1.6;
  }

  li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0.62em;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--glow);
  }

  @keyframes pop {
    from {
      transform: translate(-50%, -46%) scale(0.92);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      animation: none;
    }
  }
</style>
