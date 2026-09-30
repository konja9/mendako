<script lang="ts">
  import { tick } from 'svelte';
  import { leaveDive, zoneName } from '../app/actions';
  import { bus } from '../app/events';
  import { playSfx } from '../audio';
  import { diveHud } from '../app/ui-state';
  import { ICONS, PEARL } from '../art/icons';

  let back = $state<HTMLButtonElement>();
  let confirmSurface = $state(false);
  let metShown = $state(false);
  let metTimer: ReturnType<typeof setTimeout> | undefined;

  // HUD は潜っている間ずっと更新されるので、見たい値だけ取り出して、それが変わったときだけ動かす
  const isResult = $derived($diveHud.phase === 'result');
  const lastMetAt = $derived($diveHud.lastMet?.at ?? 0);

  $effect(() => {
    if (isResult) tick().then(() => back?.focus());
  });

  // 「であえた！」を少しのあいだ出す
  $effect(() => {
    if (!lastMetAt) return;
    metShown = true;
    clearTimeout(metTimer);
    metTimer = setTimeout(() => (metShown = false), 1800);
  });

  function toggleLight() {
    const next = !$diveHud.light;
    diveHud.update((h) => ({ ...h, light: next }));
    playSfx('light');
    bus.emit('diveLight', next);
  }

  // 途中で浮上すると素材の換金が半分になるので、もう一度押してもらう
  function pressSurface() {
    if (!confirmSurface) {
      confirmSurface = true;
      setTimeout(() => (confirmSurface = false), 3000);
      return;
    }
    bus.emit('diveSurface');
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="深海探索">
  {#if $diveHud.phase !== 'result'}
    <div class="top">
      <span class="chip depth">水深 <b>{$diveHud.depth}</b>m</span>
      <span class="gauge" role="meter" aria-label="探検ゲージ" aria-valuemin="0" aria-valuemax="100" aria-valuenow={$diveHud.gauge}>
        <span class="fill" class:is-low={$diveHud.gauge < 25} style:width="{$diveHud.gauge}%"></span>
      </span>
      <button class="chip surface" type="button" onclick={pressSurface}>
        {@html ICONS.up}{confirmSurface ? '本当に？（素材は半分）' : '浮上'}
      </button>
    </div>
    <div class="counts">
      <span class="chip">出会い <b>{$diveHud.met}</b></span>
      <span class="chip">拾った <b>{$diveHud.items}</b></span>
    </div>

    {#if $diveHud.phase === 'intro'}
      <div class="intro">
        <p class="zone">{zoneName($diveHud.zoneId)}</p>
        <p class="help">上にスワイプすると深く潜れるよ。<br />左右は、めんだこが指についてくる。</p>
        <p class="sub">光の輪に生き物を入れ続けると出会える。<br />ぶつかると探検ゲージが減るので気をつけて。</p>
      </div>
    {/if}

    {#if metShown && $diveHud.lastMet}
      <p class="met" role="status">{$diveHud.lastMet.name}にであえた！</p>
    {/if}

    <button class="light" class:is-off={!$diveHud.light} type="button" aria-pressed={!$diveHud.light} onclick={toggleLight}>
      {@html ICONS.light}<span>{$diveHud.light ? 'ライトを消す' : 'ライトをつける'}</span>
    </button>
  {:else if $diveHud.result}
    {@const r = $diveHud.result}
    <div class="result">
      <h2>{r.reachedBottom ? '底までたどり着いた！' : '浮上した'}</h2>
      <p class="reached">たどり着いた深さ <b>{r.maxDepth}m</b>{#if r.newBest}<span class="best">記録更新</span>{/if}</p>
      <section>
        <h3>出会った生き物</h3>
        {#if r.met.length}
          <ul class="met-list">
            {#each r.met as m (m.id)}<li>{m.name}{#if m.isNew}<span class="new">図鑑に追加</span>{/if}</li>{/each}
          </ul>
        {:else}
          <p class="empty">今回は出会えなかった</p>
        {/if}
      </section>
      <section>
        <h3>拾ったもの</h3>
        {#if r.materials.length}
          <ul class="items">
            {#each r.materials as m (m.name)}<li>{m.name} ×{m.count}</li>{/each}
          </ul>
        {:else}
          <p class="empty">なし</p>
        {/if}
      </section>
      <dl class="pearls">
        <div><dt>素材{r.halved ? '（途中で浮上したので半分）' : ''}</dt><dd>{r.materialPearls}</dd></div>
        <div><dt>ゴミ拾いのお礼</dt><dd>{r.trashPearls}</dd></div>
        <div><dt>底までのボーナス</dt><dd>{r.bonus}</dd></div>
        <div class="total"><dt>{@html PEARL}合計</dt><dd>+{r.pearls}</dd></div>
      </dl>
      <button class="btn btn-primary" type="button" bind:this={back} onclick={leaveDive}>水槽にもどる</button>
    </div>
  {/if}
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 20;
    pointer-events: none;
  }

  .top,
  .counts {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    box-sizing: border-box;
    width: min(var(--column), 100%);
    padding-inline: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .top {
    top: calc(12px + env(safe-area-inset-top, 0px));
  }

  .counts {
    top: calc(62px + env(safe-area-inset-top, 0px));
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 34px;
    padding: 0 11px;
    border-radius: 99px;
    background: rgba(5, 18, 48, 0.6);
    border: 1px solid var(--glass-line);
    color: var(--on-sea);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .chip b {
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 17px;
  }

  .depth b {
    min-width: 3.2em;
    text-align: right;
  }

  .gauge {
    flex: 1;
    height: 12px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.16);
    overflow: hidden;
  }

  .fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--mint), var(--glow));
    transition: width 0.3s ease;
  }

  .fill.is-low {
    background: var(--coral);
  }

  .surface {
    min-height: var(--tap);
    cursor: pointer;
    pointer-events: auto;
    font-weight: 700;
  }

  .surface :global(svg),
  .light :global(svg) {
    width: 20px;
    height: 20px;
  }

  /* めんだこ（画面の上から4割あたり）に重ならないよう、下のほうに出す */
  .intro {
    position: absolute;
    left: 50%;
    top: 56%;
    transform: translateX(-50%);
    box-sizing: border-box;
    width: min(340px, calc(100% - 32px));
    padding: 14px 16px;
    border-radius: 22px;
    background: rgba(5, 18, 48, 0.72);
    border: 1px solid var(--glass-line);
    text-align: center;
    color: var(--on-sea);
  }

  .zone {
    margin: 0;
    font-family: var(--font-pop);
    font-size: 26px;
    color: var(--lantern);
  }

  .help {
    margin: 8px 0 4px;
    font-weight: 700;
    font-size: 16px;
  }

  .sub {
    margin: 0;
    font-size: 13px;
    color: var(--on-sea-soft);
  }

  .met {
    position: absolute;
    left: 50%;
    top: 22%;
    transform: translateX(-50%);
    margin: 0;
    padding: 8px 16px;
    border-radius: 99px;
    background: var(--lantern);
    color: var(--ink);
    font-family: var(--font-pop);
    font-size: 16px;
    white-space: nowrap;
    animation: pop 0.4s cubic-bezier(0.3, 1.5, 0.5, 1);
  }

  .light {
    position: absolute;
    right: max(16px, calc(50% - var(--column) / 2 + 16px));
    bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 76px;
    min-height: 64px;
    padding: 8px 10px;
    border: 0;
    border-radius: 20px;
    background: var(--lantern);
    color: var(--ink);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
  }

  .light.is-off {
    background: #2b3354;
    color: var(--on-sea);
  }

  .light :global(svg) {
    width: 26px;
    height: 26px;
  }

  .result {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-sizing: border-box;
    width: min(360px, calc(100% - 32px));
    max-height: calc(100% - 40px);
    overflow-y: auto;
    display: grid;
    gap: 10px;
    padding: 20px 18px;
    border-radius: 26px;
    background: var(--pearl);
    color: var(--ink);
    pointer-events: auto;
  }

  h2 {
    margin: 0;
    text-align: center;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 22px;
  }

  h3 {
    margin: 0 0 4px;
    font-size: 13px;
    color: var(--ink-soft);
  }

  .reached {
    margin: 0;
    text-align: center;
  }

  .best {
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--lantern);
    font-size: 12px;
    font-weight: 700;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  li {
    padding: 4px 10px;
    border-radius: 99px;
    background: #fff;
    font-size: 14px;
    font-weight: 700;
  }

  .new {
    margin-left: 4px;
    color: #c2416f;
    font-size: 12px;
  }

  .empty {
    margin: 0;
    font-size: 13px;
    color: var(--ink-soft);
  }

  .pearls {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 10px 12px;
    border-radius: 16px;
    background: #fff;
  }

  .pearls div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  .total {
    padding-top: 4px;
    border-top: 1px solid var(--pearl-2);
    font-size: 16px !important;
  }

  .total dt {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
  }

  @keyframes pop {
    from {
      transform: translateX(-50%) scale(0.6);
      opacity: 0;
    }
  }
</style>
