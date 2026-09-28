<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { game } from '../app/actions';
  import { bus } from '../app/events';
  import { PEARL } from '../art/icons';
  import type { StageInfo } from '../game/care';
  import { STAGE_UP_BONUS } from '../game/data/care';
  import MendakoPreview from './MendakoPreview.svelte';

  let stage = $state<StageInfo | null>(null);
  let button = $state<HTMLButtonElement>();

  onMount(() =>
    bus.on('celebrate', async (next) => {
      stage = next;
      await tick();
      button?.focus();
    }),
  );
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (stage = null)} />

{#if stage}
  <div class="celebrate">
    <div class="card" role="dialog" aria-modal="true" aria-labelledby="celebrate-title">
      <MendakoPreview equipped={$game.equipped} expression="happy" size={150} />
      <h2 id="celebrate-title">大きくなった！</h2>
      <p>{$game.name}は<b>{stage.label}</b>になったよ</p>
      <p class="bonus">{@html PEARL}お祝いの真珠 +{STAGE_UP_BONUS}</p>
      <button class="btn btn-primary" type="button" bind:this={button} onclick={() => (stage = null)}>やったね</button>
    </div>
  </div>
{/if}

<style>
  .celebrate {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(3, 10, 30, 0.55);
    pointer-events: auto;
  }

  .card {
    display: grid;
    justify-items: center;
    gap: 6px;
    width: min(320px, 100%);
    padding: 20px 20px 22px;
    border-radius: 28px;
    background: var(--pearl);
    color: var(--ink);
    text-align: center;
    animation: pop-in 0.5s cubic-bezier(0.3, 1.5, 0.5, 1);
  }

  h2 {
    margin: 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 24px;
  }

  p {
    margin: 0;
  }

  .bonus {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 10px;
    font-weight: 700;
  }

  @keyframes pop-in {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
</style>
