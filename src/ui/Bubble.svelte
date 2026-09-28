<script lang="ts">
  import { onMount } from 'svelte';
  import { bus } from '../app/events';
  import { worldLink } from '../app/ui-state';

  let text = $state('');
  let shown = $state(false);
  let el = $state<HTMLParagraphElement>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let following = false;

  // めんだこの頭の左上に出し、画面の縦長の枠からはみ出さないようにする
  function place() {
    const head = worldLink.mendakoHead();
    if (!shown || !head || !el) {
      following = false;
      return;
    }
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const colLeft = Math.max(0, (window.innerWidth - 430) / 2) + 8;
    const colRight = Math.min(window.innerWidth, colLeft - 8 + 430) - 8;
    const left = Math.min(Math.max(colLeft, head.x - w * 0.88), colRight - w);
    const top = Math.max(8, head.y - h - 2);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    requestAnimationFrame(place);
  }

  onMount(() =>
    bus.on('say', ({ text: next, ms = 3200 }) => {
      text = next;
      shown = true;
      clearTimeout(timer);
      timer = setTimeout(() => (shown = false), ms);
      if (!following) {
        following = true;
        requestAnimationFrame(place);
      }
    }),
  );
</script>

<p class="bubble" class:is-shown={shown} bind:this={el} aria-live="polite">{text}</p>

<style>
  .bubble {
    position: fixed;
    z-index: 2;
    left: 0;
    top: 0;
    max-width: 210px;
    width: max-content;
    margin: 0;
    padding: 8px 14px;
    border-radius: 16px 16px 4px 16px;
    background: var(--pearl);
    color: var(--ink);
    font-weight: 700;
    font-size: 15px;
    line-height: 1.4;
    box-shadow: 0 6px 18px rgba(2, 8, 30, 0.35);
    opacity: 0;
    transform: translateY(6px) scale(0.92);
    transform-origin: 100% 100%;
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
    pointer-events: none;
  }

  .bubble.is-shown {
    opacity: 1;
    transform: none;
  }
</style>
