<script lang="ts">
  // あそびかた。項目ごとに開いて読める。はじめの案内をもう一度見ることもできる。
  import { closeSheet } from '../../app/actions';
  import { restartGuide } from '../../app/onboarding';
  import { mode } from '../../app/ui-state';
  import { HELP_SECTIONS, TIPS } from '../../game/data/help';
  import { pickTip } from '../../game/help';
  import Sheet from '../Sheet.svelte';

  let tip = $state(pickTip(TIPS, null));

  function again() {
    closeSheet();
    restartGuide();
  }
</script>

<Sheet title="あそびかた" kind="help" onclose={closeSheet}>
  <div class="sections">
    {#each HELP_SECTIONS as section, i (section.id)}
      <details open={i === 0}>
        <summary>{section.title}</summary>
        <ul>
          {#each section.lines as line (line)}<li>{line}</li>{/each}
        </ul>
      </details>
    {/each}
  </div>

  <section class="tip" aria-live="polite">
    <h3>{tip.kind === 'sea' ? '深海の豆知識' : '遊びのコツ'}</h3>
    <p>{tip.text}</p>
    <button class="btn btn-small" type="button" onclick={() => (tip = pickTip(TIPS, tip.text))}>ほかのも見る</button>
  </section>

  {#if $mode === 'home'}
    <button class="btn btn-small again" type="button" onclick={again}>はじめの案内をもう一度見る</button>
  {/if}
</Sheet>

<style>
  .sections {
    display: grid;
    gap: 8px;
  }

  details {
    border-radius: 16px;
    background: #fff;
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--tap);
    padding: 0 14px;
    font-weight: 700;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '';
    width: 8px;
    height: 8px;
    border-right: 2.5px solid var(--ink-soft);
    border-bottom: 2.5px solid var(--ink-soft);
    transform: rotate(45deg) translateY(-2px);
    transition: transform 0.2s ease;
  }

  details[open] summary::after {
    transform: rotate(-135deg) translateY(-2px);
  }

  ul {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0 14px 14px 30px;
  }

  li {
    font-size: 14px;
    line-height: 1.6;
  }

  .tip {
    display: grid;
    gap: 6px;
    justify-items: start;
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 16px;
    background: linear-gradient(180deg, #16305c, #07173a);
    color: var(--on-sea);
  }

  h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--lantern);
  }

  .tip p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .again {
    margin-top: 14px;
  }

  @media (prefers-reduced-motion: reduce) {
    summary::after {
      transition: none;
    }
  }
</style>
