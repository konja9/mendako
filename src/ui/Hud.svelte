<script lang="ts">
  import { game, openSheet, toggleSleep } from '../app/actions';
  import { ICONS, PEARL } from '../art/icons';
  import { stageFor } from '../game/care';
  import { zukanProgress } from '../game/visitors';

  const stage = $derived(stageFor($game.exp));
  const zukan = $derived(zukanProgress($game));
  const waiting = $derived($game.visitors.some((v) => !v.met));
</script>

<header class="hud">
  <button class="hud-name" type="button" aria-label="名前と記録を見る" onclick={() => openSheet('settings')}>
    <span class="name">{$game.name}</span>
    <span class="sub"><span class="chip">{stage.label}</span><span class="depth">水深 400m</span></span>
  </button>
  <span class="pearls" role="img" aria-label="持っている真珠 {$game.pearls}個">
    {@html PEARL}<b>{$game.pearls}</b>
  </span>
  <button class="icon-btn has-badge" type="button" aria-label="深海図鑑（{zukan.found}/{zukan.total}）" onclick={() => openSheet('zukan')}>
    {@html ICONS.book}
    {#if waiting}<span class="dot" aria-hidden="true"></span>{/if}
  </button>
  <button class="icon-btn" type="button" aria-label={$game.sleeping ? '起こす' : '寝かせる'} aria-pressed={$game.sleeping} onclick={toggleSleep}>
    {@html $game.sleeping ? ICONS.sun : ICONS.moon}
  </button>
  <button class="icon-btn" type="button" aria-label="設定" onclick={() => openSheet('settings')}>{@html ICONS.menu}</button>
</header>

<style>
  .hud {
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
  }

  .hud-name {
    flex: 1;
    display: grid;
    justify-items: start;
    gap: 3px;
    min-width: 0;
    min-height: var(--tap);
    padding: 2px 6px 2px 0;
    background: none;
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
  }

  .name {
    max-width: 100%;
    font-family: var(--font-pop);
    font-size: 20px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sub {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chip {
    padding: 1px 9px;
    border-radius: 99px;
    background: var(--lilac);
    color: var(--ink);
    font-size: 12px;
    font-weight: 700;
  }

  .depth {
    white-space: nowrap;
    font-size: 12px;
    letter-spacing: 0.04em;
    color: var(--on-sea-soft);
    font-variant-numeric: tabular-nums;
  }

  .pearls {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 36px;
    padding: 0 12px 0 7px;
    border-radius: 99px;
    background: var(--pearl);
    color: var(--ink);
    font-family: var(--font-pop);
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }

  .pearls b {
    font-weight: 400;
  }

  .has-badge {
    position: relative;
  }

  /* 水槽にまだ会っていない生き物がいるときの印 */
  .dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--lantern);
    box-shadow: 0 0 0 2px var(--sea-mid);
  }

  /* スマホでは上のバーが混むので、水深の表示は省く（図鑑の水深の図に出ている） */
  @media (max-width: 420px) {
    .depth {
      display: none;
    }
  }

  @media (max-width: 370px) {
    .hud {
      gap: 5px;
    }
    .pearls {
      padding: 0 9px 0 5px;
      font-size: 15px;
    }
  }
</style>
