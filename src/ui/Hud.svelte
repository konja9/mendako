<script lang="ts">
  import { game } from '../app/actions';
  import { sheet } from '../app/ui-state';
  import { ICONS, PEARL } from '../art/icons';
  import { stageFor } from '../game/care';

  const stage = $derived(stageFor($game.exp));
</script>

<header class="hud">
  <button class="hud-name" type="button" aria-label="名前と記録を見る" onclick={() => sheet.set('settings')}>
    <span class="name">{$game.name}</span>
    <span class="sub"><span class="chip">{stage.label}</span><span class="depth">水深 400m</span></span>
  </button>
  <span class="pearls" role="img" aria-label="持っている真珠 {$game.pearls}個">
    {@html PEARL}<b>{$game.pearls}</b>
  </span>
  <button class="icon-btn" type="button" aria-label="設定" onclick={() => sheet.set('settings')}>{@html ICONS.menu}</button>
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
</style>
