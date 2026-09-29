<script lang="ts">
  import { closeSheet, dev, game, openSheet, rename, resetAll } from '../../app/actions';
  import { ICONS } from '../../art/icons';
  import { NAME_MAX } from '../../game/state';
  import Sheet from '../Sheet.svelte';
  import InstallGuide from './InstallGuide.svelte';
  import SoundSettings from './SoundSettings.svelte';

  let name = $state(game.get().name);
  let resetArmed = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const days = $derived(Math.floor((Date.now() - $game.bornAt) / 86_400_000) + 1);

  function submit(e: SubmitEvent) {
    e.preventDefault();
    rename(name);
  }

  // 消す前に、もう一度押してもらう
  function pressReset() {
    if (!resetArmed) {
      resetArmed = true;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => (resetArmed = false), 4000);
      return;
    }
    resetAll();
  }
</script>

<Sheet title="設定と記録" kind="settings" onclose={closeSheet}>
  <button class="help-link" type="button" onclick={() => openSheet('help')}>
    {@html ICONS.book}<span>あそびかた</span><span class="arrow" aria-hidden="true"></span>
  </button>
  <SoundSettings />
  <InstallGuide />

  <form class="rename" onsubmit={submit}>
    <label for="name-input">名前</label>
    <div class="row">
      <input id="name-input" name="name" maxlength={NAME_MAX} autocomplete="off" bind:value={name} />
      <button class="btn" type="submit">変える</button>
    </div>
  </form>

  <dl class="record">
    <div><dt>いっしょに過ごして</dt><dd>{days}日目</dd></div>
    <div><dt>ごはん</dt><dd>{$game.counts.fed}回</dd></div>
    <div><dt>なでた</dt><dd>{$game.counts.petted}回</dd></div>
    <div><dt>あそんだ</dt><dd>{$game.counts.played}回</dd></div>
    <div><dt>ベストスコア</dt><dd>{$game.bestScore}</dd></div>
  </dl>

  <div class="dev">
    <p class="dev-title">テスト用（プロトタイプ）</p>
    <div class="dev-row">
      <button class="btn btn-small" type="button" onclick={dev.advanceHour}>時間を1時間進める</button>
      <button class="btn btn-small" type="button" onclick={dev.addPearls}>真珠 +100</button>
      <button class="btn btn-small" type="button" onclick={dev.addExp}>なかよし +100</button>
      <button class="btn btn-small" type="button" onclick={dev.callVisitor}>生き物を呼ぶ</button>
    </div>
    <button class="btn btn-small btn-danger" type="button" onclick={pressReset}>
      {resetArmed ? '本当に消す？ もう一度押してね' : 'データを最初から'}
    </button>
  </div>
</Sheet>

<style>
  .help-link {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    margin-bottom: 16px;
    padding: 0 16px;
    border: 0;
    border-radius: 16px;
    background: linear-gradient(180deg, #16305c, #07173a);
    color: var(--on-sea);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .help-link :global(svg) {
    width: 22px;
    height: 22px;
  }

  .help-link span:not(.arrow) {
    flex: 1;
    text-align: left;
  }

  .arrow {
    width: 8px;
    height: 8px;
    border-top: 2.5px solid currentColor;
    border-right: 2.5px solid currentColor;
    transform: rotate(45deg);
  }

  .rename {
    display: grid;
    gap: 6px;
    padding-top: 4px;
  }

  label {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .row {
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1;
    min-width: 0;
    min-height: var(--tap);
    box-sizing: border-box;
    padding: 0 14px;
    border: 2px solid var(--pearl-2);
    border-radius: 14px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    /* iOS で入力時に拡大されないよう 16px 以上 */
    font-size: 16px;
    font-weight: 700;
  }

  .record {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin: 16px 0;
  }

  .record div {
    padding: 8px 12px;
    border-radius: 14px;
    background: #fff;
  }

  dt {
    font-size: 12px;
    color: var(--ink-soft);
  }

  dd {
    margin: 0;
    font-family: var(--font-pop);
    font-size: 17px;
    font-variant-numeric: tabular-nums;
  }

  .dev {
    display: grid;
    gap: 10px;
    justify-items: start;
    padding: 12px;
    border: 2px dashed var(--pearl-2);
    border-radius: 16px;
  }

  .dev-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .dev-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
