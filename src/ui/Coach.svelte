<script lang="ts">
  // はじめの案内。めんだこが話しかけながら、触ってほしい場所を光の輪で示す。
  // 実際に「なでる」「ごはん」をやってもらい、できたら次へ進む。
  import { onMount } from 'svelte';
  import { game } from '../app/actions';
  import { nextTutorial, skipTutorial } from '../app/onboarding';
  import { introCard, sheet, tutorialStep, worldLink, type TutorialStep } from '../app/ui-state';
  import MendakoPreview from './MendakoPreview.svelte';

  const STEPS: Record<TutorialStep, { text: (name: string) => string; target: string; action?: string }> = {
    pet: {
      text: (name) => `はじめまして、${name}だよ！ ぼくをタップして、なでてみて。`,
      target: 'mendako',
    },
    food: {
      text: () => 'えへへ、ありがとう！ 下の「ごはん」から、カイアシをあげてみて。カイアシは真珠がいらないよ。',
      target: '[data-action="food"]',
    },
    status: {
      text: () => '上のゲージは、おなか・ごきげん・げんき。お世話すると「なかよし度」がたまって、ぼくが大きくなるよ。',
      target: '.status',
      action: 'つぎへ',
    },
    actions: {
      text: () => '下のボタンで、あそぶ・もぐる・きせかえ・もようがえもできるよ。困ったら右上のメニューの「あそびかた」を見てね。',
      target: '.actions',
      action: 'はじめる',
    },
  };

  const step = $derived($tutorialStep ? STEPS[$tutorialStep] : null);
  // シートや説明カードが開いている間は、じゃまをしない
  const hidden = $derived(!!$sheet || !!$introCard);

  let hole = $state<{ x: number; y: number; w: number; h: number; round: boolean } | null>(null);
  let cardTop = $state(120);

  function measure() {
    const target = step?.target;
    if (!target) {
      hole = null;
    } else if (target === 'mendako') {
      const head = worldLink.mendakoHead();
      hole = head ? { x: head.x - 70, y: head.y - 30, w: 140, h: 140, round: true } : null;
    } else {
      const el = document.querySelector(target);
      if (el) {
        const r = el.getBoundingClientRect();
        const pad = 8;
        hole = { x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2, round: false };
      } else {
        hole = null;
      }
    }
    const status = document.querySelector('.status');
    cardTop = status ? status.getBoundingClientRect().bottom + (target === '.status' ? 18 : 12) : 120;
  }

  onMount(() => {
    let frame = 0;
    // めんだこは泳ぎ回るので、毎フレーム追いかける
    const loop = () => {
      measure();
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  });
</script>

{#if step && !hidden}
  {#if hole}
    <div
      class="spot"
      class:is-round={hole.round}
      style:left="{hole.x}px"
      style:top="{hole.y}px"
      style:width="{hole.w}px"
      style:height="{hole.h}px"
      aria-hidden="true"
    ></div>
  {/if}
  <div class="card" role="dialog" aria-live="polite" aria-label="はじめの案内" style:top="{cardTop}px">
    <MendakoPreview equipped={$game.equipped} expression="happy" size={52} />
    <div class="talk">
      <p>{step.text($game.name)}</p>
      <div class="row">
        <button class="skip" type="button" onclick={skipTutorial}>案内をとばす</button>
        {#if step.action}
          <button class="btn btn-small btn-primary" type="button" onclick={nextTutorial}>{step.action}</button>
        {:else}
          <button class="later" type="button" onclick={nextTutorial}>あとで</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .spot {
    position: fixed;
    z-index: 9;
    border-radius: 18px;
    /* まわりを暗くして、ここだけ見せる。タップはそのまま下に届く */
    box-shadow:
      0 0 0 4px rgba(255, 214, 107, 0.9),
      0 0 0 9999px rgba(3, 10, 30, 0.5);
    pointer-events: none;
    animation: glow 1.6s ease-in-out infinite;
  }

  .spot.is-round {
    border-radius: 50%;
  }

  .card {
    position: fixed;
    z-index: 9;
    left: 50%;
    transform: translateX(-50%);
    box-sizing: border-box;
    width: min(calc(var(--column) - 32px), calc(100% - 32px));
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 20px;
    background: var(--pearl);
    color: var(--ink);
    box-shadow: 0 8px 24px rgba(2, 8, 30, 0.45);
    pointer-events: auto;
  }

  .card :global(.preview) {
    flex: none;
  }

  .talk {
    display: grid;
    gap: 8px;
    flex: 1;
  }

  p {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.55;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .skip,
  .later {
    min-height: 36px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-soft);
    font: inherit;
    font-size: 13px;
    text-decoration: underline;
    cursor: pointer;
  }

  @keyframes glow {
    50% {
      box-shadow:
        0 0 0 7px rgba(255, 214, 107, 0.6),
        0 0 0 9999px rgba(3, 10, 30, 0.5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spot {
      animation: none;
    }
  }
</style>
