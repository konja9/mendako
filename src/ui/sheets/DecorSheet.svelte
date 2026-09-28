<script lang="ts">
  import {
    buyPending,
    chooseDecor,
    chooseFloor,
    closeSheet,
    flipSelectedDecor,
    game,
    storeSelectedDecor,
  } from '../../app/actions';
  import { bottomInset, decorSelected, pendingBuy, worldLink } from '../../app/ui-state';
  import { DECOR_ART } from '../../art/decor';
  import { ICONS, PEARL } from '../../art/icons';
  import { DECOR, DECOR_BY_ID, FLOOR_BY_ID, FLOORS, MAX_PLACED, TAG_LABEL, type DecorTag } from '../../game/data/decor';
  import { availableCount } from '../../game/decor';
  import Sheet from '../Sheet.svelte';

  let tab = $state<'decor' | 'floor'>('decor');
  let toolbar = $state<HTMLDivElement>();

  const pending = $derived($pendingBuy ? ($pendingBuy.kind === 'decor' ? DECOR_BY_ID[$pendingBuy.id] : FLOOR_BY_ID[$pendingBuy.id]) : null);
  const short = $derived(pending ? pending.price - $game.pearls : 0);
  const tagText = (tags: DecorTag[]) => tags.map((t) => TAG_LABEL[t]).join('・');
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

  function selectTab(next: 'decor' | 'floor') {
    tab = next;
    pendingBuy.set(null);
    decorSelected.set(null);
  }

  // 選んだ飾りのすぐ下（シートに隠れるときは上）にボタンを出し続ける
  $effect(() => {
    const uid = $decorSelected;
    if (!uid) return;
    let raf = 0;
    const follow = () => {
      const rect = worldLink.decorRect(uid);
      if (rect && toolbar) {
        const w = toolbar.offsetWidth;
        const h = toolbar.offsetHeight;
        const colLeft = Math.max(0, (window.innerWidth - 430) / 2) + 8;
        const colRight = Math.min(window.innerWidth, colLeft - 8 + 430) - 8;
        const left = Math.min(Math.max(colLeft, rect.x + rect.width / 2 - w / 2), colRight - w);
        const limit = window.innerHeight - $bottomInset - h - 8;
        let top = rect.y + rect.height + 10;
        if (top > limit) top = Math.max(8, rect.y - h - 10);
        toolbar.style.left = `${left}px`;
        toolbar.style.top = `${top}px`;
      }
      raf = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(raf);
  });
</script>

{#snippet buyFooter()}
  {#if pending}
    <span class="foot-text">
      <b>{pending.name}</b>を買う？
      <br /><small class="tags">{tagText(pending.tags)}</small>
      {#if short > 0}<br /><small class="short">真珠があと{short}個たりないよ</small>{/if}
    </span>
    <button class="btn btn-primary" type="button" disabled={short > 0} onclick={buyPending}>{@html PEARL}{pending.price}で買う</button>
  {/if}
{/snippet}

<Sheet title="もようがえ" kind="decor" modal={false} onclose={closeSheet} footer={pending ? buyFooter : undefined}>
  <div class="head">
    <div class="tabs" role="tablist">
      <button class="tab" type="button" role="tab" aria-selected={tab === 'decor'} onclick={() => selectTab('decor')}>飾り</button>
      <button class="tab" type="button" role="tab" aria-selected={tab === 'floor'} onclick={() => selectTab('floor')}>海底</button>
    </div>
    {#if tab === 'decor'}
      <span class="count">置いている飾り {$game.decor.placed.length}/{MAX_PLACED}</span>
    {/if}
  </div>
  <p class="sheet-hint">
    {tab === 'decor' ? '指で動かせるよ。押して選ぶと反転やしまうができる' : '海底の種類で、遊びに来る生き物が変わるかも'}
  </p>

  {#if tab === 'decor'}
    <div class="row">
      {#each DECOR as def (def.id)}
        {@const owned = $game.decor.owned[def.id] ?? 0}
        {@const left = availableCount($game, def.id)}
        <button
          class="card"
          class:is-pending={$pendingBuy?.id === def.id}
          type="button"
          aria-label="{def.name}（{tagText(def.tags)}）"
          onclick={() => chooseDecor(def.id)}
        >
          <span class="art">{@html DECOR_ART[def.id]}</span>
          <span class="card-name">{def.name}</span>
          <span class="card-note">{tagText(def.tags)}</span>
          {#if owned === 0}
            <span class="price">{@html PEARL}{def.price}</span>
          {:else if left > 0}
            <span class="badge is-owned">置ける {left}</span>
          {:else}
            <span class="badge is-placed">配置中</span>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <div class="row">
      {#each FLOORS as floor (floor.id)}
        {@const owned = $game.decor.floors.includes(floor.id)}
        {@const using = $game.decor.floor === floor.id}
        <button
          class="card"
          class:is-using={using}
          class:is-pending={$pendingBuy?.id === floor.id}
          type="button"
          aria-pressed={using}
          onclick={() => chooseFloor(floor.id)}
        >
          <span class="swatch" style:--back={hex(floor.colors.back)} style:--front={hex(floor.colors.front)} style:--speck={hex(floor.colors.speck)}></span>
          <span class="card-name">{floor.name}</span>
          <span class="card-note">{tagText(floor.tags)}</span>
          {#if using}
            <span class="badge">使っている</span>
          {:else if owned}
            <span class="badge is-owned">持ってる</span>
          {:else}
            <span class="price">{@html PEARL}{floor.price}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</Sheet>

{#if $decorSelected}
  <div class="toolbar" bind:this={toolbar} role="toolbar" aria-label="選んでいる飾り">
    <button type="button" onclick={flipSelectedDecor}>{@html ICONS.flip}<span>反転</span></button>
    <button type="button" onclick={storeSelectedDecor}>{@html ICONS.store}<span>しまう</span></button>
    <button type="button" onclick={() => decorSelected.set(null)}>{@html ICONS.check}<span>決定</span></button>
  </div>
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .count {
    flex: none;
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }

  .row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 2px 6px;
    scroll-snap-type: x proximity;
    overscroll-behavior-x: contain;
  }

  .card {
    flex: none;
    width: 100px;
    scroll-snap-align: start;
  }

  .card.is-pending {
    border-color: var(--lilac);
    border-style: dashed;
    background: #f6f2ff;
  }

  .card.is-using {
    border-color: var(--anemone);
    background: #fff3f8;
  }

  .art {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 12px;
    background: #16305c;
  }

  .art :global(svg) {
    max-width: 56px;
    max-height: 56px;
    width: auto;
    height: auto;
  }

  .swatch {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    background:
      radial-gradient(circle at 30% 70%, var(--speck) 0 2px, transparent 3px),
      radial-gradient(circle at 70% 80%, var(--speck) 0 2px, transparent 3px),
      linear-gradient(180deg, #16305c 0 38%, var(--back) 38% 66%, var(--front) 66%);
  }

  .badge.is-placed {
    background: var(--pearl-2);
  }

  .foot-text {
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
  }

  .tags {
    color: var(--ink-soft);
    font-size: 12px;
  }

  .short {
    color: var(--danger);
    font-weight: 700;
    font-size: 13px;
  }

  /* 背の低いスマホでは、カードを小さくして一覧が隠れないようにする */
  @media (max-height: 700px) {
    .sheet-hint {
      display: none;
    }
    .card {
      width: 92px;
      padding-block: 6px 8px;
    }
    .art,
    .swatch {
      width: 50px;
      height: 50px;
    }
    .art :global(svg) {
      max-width: 44px;
      max-height: 44px;
    }
  }

  .toolbar {
    position: fixed;
    z-index: 12;
    left: 0;
    top: 0;
    display: flex;
    gap: 6px;
    padding: 6px;
    border-radius: 18px;
    background: var(--pearl);
    box-shadow: 0 6px 20px rgba(2, 8, 30, 0.45);
    pointer-events: auto;
  }

  .toolbar button {
    display: grid;
    justify-items: center;
    gap: 1px;
    min-width: var(--tap);
    min-height: var(--tap);
    padding: 4px 8px;
    border: 0;
    border-radius: 12px;
    background: var(--pearl-2);
    color: var(--ink);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .toolbar button :global(svg) {
    width: 20px;
    height: 20px;
  }
</style>
