<script lang="ts">
  import { game } from '../app/actions';
  import { LOW_STAT, stageFor } from '../game/care';
  import { STATS } from '../game/data/care';

  const stage = $derived(stageFor($game.exp));
</script>

<section class="status" aria-label="ようす">
  <div class="gauges">
    {#each STATS as stat (stat.id)}
      {@const value = $game.stats[stat.id]}
      <div
        class="gauge {stat.id}"
        class:is-low={value < LOW_STAT}
        role="meter"
        aria-label={stat.label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(value)}
      >
        <span class="label">{stat.label}{value < LOW_STAT ? ' !' : ''}</span>
        <span class="track"><span class="fill" style:width="{value}%"></span></span>
      </div>
    {/each}
  </div>
  <div class="bond">
    <span class="label">なかよし</span>
    <span class="bond-text">
      {stage.next ? `次の成長まであと ${Math.ceil(stage.next.minExp - $game.exp)}` : 'いちばん大きくなったよ'}
    </span>
    <span class="track thin"><span class="fill" style:width="{Math.round(stage.progress * 100)}%"></span></span>
  </div>
</section>

<style>
  .status {
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 18px;
    background: rgba(5, 18, 48, 0.5);
    border: 1px solid var(--glass-line);
  }

  .gauges {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .gauge {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .is-low .label {
    color: var(--lantern);
  }

  .track {
    display: block;
    height: 10px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.14);
    overflow: hidden;
  }

  .track.thin {
    grid-column: 1 / -1;
    height: 6px;
  }

  .fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--tone, linear-gradient(90deg, var(--mint), var(--glow)));
    transition: width 0.6s ease;
  }

  .hunger {
    --tone: var(--coral);
  }
  .mood {
    --tone: var(--anemone);
  }
  .energy {
    --tone: var(--lantern);
  }

  .is-low .fill {
    animation: low-pulse 1.2s ease-in-out infinite;
  }

  @keyframes low-pulse {
    50% {
      opacity: 0.45;
    }
  }

  .bond {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 10px;
    row-gap: 4px;
  }

  .bond-text {
    justify-self: end;
    font-size: 12px;
    color: var(--on-sea-soft);
    font-variant-numeric: tabular-nums;
  }

  @media (max-height: 680px) {
    .bond {
      display: none;
    }
  }
</style>
