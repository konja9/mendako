<script lang="ts">
  import { tick } from 'svelte';
  import { leaveCatch, quitCatch } from '../app/actions';
  import { catchHud } from '../app/ui-state';
  import { PEARL } from '../art/icons';

  let back = $state<HTMLButtonElement>();

  $effect(() => {
    if ($catchHud.phase === 'result') tick().then(() => back?.focus());
  });
</script>

<!-- 画面の部品以外のところは、下の canvas（ゲーム）にタッチが届く -->
<div class="overlay" role="dialog" aria-modal="true" aria-label="マリンスノーキャッチ">
  <div class="hud">
    <span class="chip">残り <b>{$catchHud.time}</b>秒</span>
    <span class="chip">スコア <b>{$catchHud.score}</b></span>
    <span class="chip">{@html PEARL}<b>{$catchHud.pearls}</b></span>
    {#if $catchHud.phase !== 'result'}
      <button class="quit" type="button" onclick={quitCatch}>やめる</button>
    {/if}
  </div>

  {#if $catchHud.phase === 'intro'}
    <div class="intro">
      <p class="count">{$catchHud.count}</p>
      <p class="help">マリンスノーとカイアシを集めよう。<br />ビニール袋にはぶつからないでね。</p>
      <p class="keys">画面のどこでも指でなぞると動くよ（← → キーでも）</p>
    </div>
  {:else if $catchHud.phase === 'result' && $catchHud.result}
    <div class="result">
      <h2>おしまい！</h2>
      <p class="score">スコア <b>{$catchHud.result.score}</b></p>
      {#if $catchHud.result.isBest}<p class="best">ベスト記録！</p>{/if}
      <p class="reward">{@html PEARL}真珠 <b>+{$catchHud.result.reward}</b></p>
      <p class="note">ごきげん +15 / げんき -15</p>
      <button class="btn btn-primary" type="button" bind:this={back} onclick={leaveCatch}>もどる</button>
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

  .hud {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top, 0px));
    left: 50%;
    transform: translateX(-50%);
    box-sizing: border-box;
    width: min(var(--column), 100%);
    padding-inline: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 34px;
    padding: 0 11px;
    border-radius: 99px;
    background: var(--glass);
    border: 1px solid var(--glass-line);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .chip b {
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 17px;
  }

  .quit {
    margin-left: auto;
    min-height: var(--tap);
    padding: 0 16px;
    border-radius: 99px;
    border: 1px solid var(--glass-line);
    background: var(--glass);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    pointer-events: auto;
  }

  .intro,
  .result {
    position: absolute;
    left: 50%;
    top: 42%;
    transform: translate(-50%, -50%);
    width: min(320px, calc(100% - 32px));
    text-align: center;
  }

  .count {
    margin: 0;
    font-family: var(--font-pop);
    font-size: 56px;
    line-height: 1.1;
    color: var(--lantern);
  }

  .help {
    margin: 10px 0 6px;
    font-weight: 700;
    font-size: 16px;
  }

  .keys {
    margin: 0;
    font-size: 13px;
    color: var(--on-sea-soft);
  }

  .result {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 22px 18px;
    border-radius: 26px;
    background: var(--pearl);
    color: var(--ink);
    pointer-events: auto;
    animation: pop-in 0.4s cubic-bezier(0.3, 1.5, 0.5, 1);
  }

  h2 {
    margin: 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 24px;
  }

  .result p {
    margin: 0;
  }

  .score b {
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 30px;
  }

  .best {
    padding: 2px 12px;
    border-radius: 99px;
    background: var(--lantern);
    font-weight: 700;
    font-size: 13px;
  }

  .reward {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
  }

  .note {
    font-size: 13px;
    color: var(--ink-soft);
    margin-bottom: 8px !important;
  }

  @keyframes pop-in {
    from {
      transform: translate(-50%, -50%) scale(0.6);
      opacity: 0;
    }
  }
</style>
