<script lang="ts">
  import { buyTryOn, chooseOutfit, closeSheet, game } from '../../app/actions';
  import { tryOn } from '../../app/ui-state';
  import { PEARL } from '../../art/icons';
  import { ITEM_BY_ID, ITEMS, SLOTS, type SlotId } from '../../game/data/outfits';
  import MendakoPreview from '../MendakoPreview.svelte';
  import Sheet from '../Sheet.svelte';

  let slot = $state<SlotId>('head');
  const items = $derived(ITEMS.filter((item) => item.slot === slot));
  const removable = $derived(SLOTS.find((s) => s.id === slot)!.removable);
  const trying = $derived($tryOn ? ITEM_BY_ID[$tryOn] : null);
  const short = $derived(trying ? trying.price - $game.pearls : 0);

  function selectTab(id: SlotId) {
    slot = id;
    tryOn.set(null);
  }
</script>

{#snippet tryOnFooter()}
  {#if trying}
    <span class="foot-text">
      <b>{trying.name}</b>を試着中
      {#if short > 0}<br /><small>真珠があと{short}個たりないよ</small>{/if}
    </span>
    <button class="btn btn-primary" type="button" disabled={short > 0} onclick={buyTryOn}>{@html PEARL}{trying.price}で買う</button>
  {/if}
{/snippet}

<Sheet title="きせかえ" kind="dress" onclose={closeSheet} footer={trying ? tryOnFooter : undefined}>
  <div class="tabs" role="tablist">
    {#each SLOTS as s (s.id)}
      <button class="tab" type="button" role="tab" aria-selected={s.id === slot} onclick={() => selectTab(s.id)}>{s.label}</button>
    {/each}
  </div>
  <p class="sheet-hint">
    {removable ? 'もう一度押すと外せる・持っていないものは試着' : '持っていない色は試着できるよ'}
  </p>
  <div class="grid">
    {#each items as item (item.id)}
      {@const owned = $game.owned.includes(item.id)}
      {@const worn = $game.equipped[item.slot] === item.id}
      <button
        class="card"
        class:is-worn={worn}
        class:is-trying={$tryOn === item.id}
        type="button"
        aria-pressed={worn}
        onclick={() => chooseOutfit(item.id)}
      >
        <MendakoPreview equipped={{ ...$game.equipped, [item.slot]: item.id }} label={item.name} />
        <span class="card-name">{item.name}</span>
        {#if worn}
          <span class="badge">着てる</span>
        {:else if owned}
          <span class="badge is-owned">持ってる</span>
        {:else}
          <span class="price">{@html PEARL}{item.price}</span>
        {/if}
      </button>
    {/each}
  </div>
</Sheet>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .card.is-worn {
    border-color: var(--anemone);
    background: #fff3f8;
  }

  .card.is-trying {
    border-color: var(--lilac);
    border-style: dashed;
    background: #f6f2ff;
  }

  .foot-text {
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
  }

  small {
    color: var(--danger);
    font-weight: 700;
    font-size: 13px;
  }
</style>
