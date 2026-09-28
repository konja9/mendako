<script lang="ts">
  import { closeSheet, game, startDive } from '../../app/actions';
  import { CREATURE_ART } from '../../art/creatures';
  import { ICONS } from '../../art/icons';
  import { DIVE_ENERGY, isUnlocked } from '../../game/dive';
  import { ZONES } from '../../game/data/zones';
  import Sheet from '../Sheet.svelte';

  const found = $derived(Object.keys($game.zukan).length);
</script>

<Sheet title="どこへもぐる？" kind="dive" onclose={closeSheet}>
  <p class="sheet-hint">
    げんきを{DIVE_ENERGY}使うよ。指でなぞって泳ぎ、光の輪に生き物を入れると出会える。いちばん深い記録 {$game.dive.bestDepth}m
  </p>
  <div class="zones">
    {#each ZONES as zone (zone.id)}
      {@const open = isUnlocked($game, zone)}
      {@const ids = [...new Set(zone.creatures.map((c) => c.id))]}
      <section class="zone" class:is-locked={!open}>
        <header>
          <h3>{zone.name}</h3>
          <span class="depth">{zone.top}〜{zone.bottom}m</span>
        </header>
        <p class="note">{zone.note}</p>
        <div class="faces" aria-label="会える生き物">
          {#each ids as id (id)}
            <span class="face" class:is-unknown={!$game.zukan[id]}>{@html CREATURE_ART[id].svg}</span>
          {/each}
        </div>
        <p class="count">見つけた生き物 {ids.filter((id) => $game.zukan[id]).length} / {ids.length}</p>
        {#if open}
          <button class="btn btn-primary" type="button" onclick={() => startDive(zone.id)}>{@html ICONS.dive}{zone.name}へもぐる</button>
        {:else}
          <p class="lock">図鑑の生き物を{zone.unlockFound}種見つけると行ける（いま{found}種）</p>
        {/if}
      </section>
    {/each}
  </div>
</Sheet>

<style>
  .zones {
    display: grid;
    gap: 12px;
  }

  .zone {
    display: grid;
    gap: 6px;
    padding: 14px;
    border-radius: 20px;
    background: linear-gradient(180deg, #16305c, #07173a);
    color: var(--on-sea);
  }

  .zone.is-locked {
    background: linear-gradient(180deg, #2a2f45, #15182a);
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  h3 {
    margin: 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 19px;
  }

  .depth {
    font-size: 13px;
    color: var(--on-sea-soft);
    font-variant-numeric: tabular-nums;
  }

  .note,
  .count,
  .lock {
    margin: 0;
    font-size: 13px;
    color: var(--on-sea-soft);
  }

  .lock {
    color: var(--lantern);
    font-weight: 700;
  }

  /* 7種まで1行に並べる（狭い画面では少し小さくする） */
  .faces {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 44px));
    gap: 5px;
  }

  .face {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
  }

  .face :global(svg) {
    max-width: 80%;
    max-height: 80%;
    width: auto;
    height: auto;
  }

  .face.is-unknown :global(svg) {
    filter: brightness(0) invert(1);
    opacity: 0.25;
  }

  .btn {
    justify-self: stretch;
  }

  .btn :global(svg) {
    width: 20px;
    height: 20px;
  }
</style>
