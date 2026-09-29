<script lang="ts">
  // はじめての人に、めんだこの名前をつけてもらう。そのままでも進める。
  import { onMount } from 'svelte';
  import { game } from '../app/actions';
  import { confirmName } from '../app/onboarding';
  import { NAME_MAX } from '../game/state';
  import MendakoPreview from './MendakoPreview.svelte';

  let name = $state(game.get().name);
  let button = $state<HTMLButtonElement>();

  onMount(() => {
    // 入力欄には当てない（スマホでキーボードが勝手に出てしまうため）
    button?.focus({ preventScroll: true });
  });

  function submit(e: SubmitEvent) {
    e.preventDefault();
    confirmName(name);
  }
</script>

<div class="scrim"></div>
<div class="card" role="dialog" aria-modal="true" aria-labelledby="name-title">
  <MendakoPreview equipped={$game.equipped} expression="happy" size={96} />
  <h2 id="name-title">めんだこに名前をつけよう</h2>
  <p>あとから設定画面で変えられるよ。</p>
  <form onsubmit={submit}>
    <input name="name" maxlength={NAME_MAX} autocomplete="off" aria-label="名前" bind:value={name} placeholder="めんちゃん" />
    <button class="btn btn-primary" type="submit" bind:this={button}>この名前にする</button>
  </form>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 25;
    background: rgba(3, 10, 30, 0.55);
    pointer-events: auto;
  }

  .card {
    position: fixed;
    z-index: 26;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-sizing: border-box;
    width: min(340px, calc(100% - 32px));
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: 22px 20px 20px;
    border-radius: 26px;
    background: var(--pearl);
    color: var(--ink);
    pointer-events: auto;
    animation: pop 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);
  }

  h2 {
    margin: 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 20px;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--ink-soft);
  }

  form {
    display: grid;
    gap: 10px;
    width: 100%;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    min-height: 48px;
    padding: 0 14px;
    border: 2px solid var(--pearl-2);
    border-radius: 14px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    /* iOS で入力時に拡大されないよう 16px 以上 */
    font-size: 18px;
    font-weight: 700;
    text-align: center;
  }

  .btn {
    width: 100%;
  }

  @keyframes pop {
    from {
      transform: translate(-50%, -46%) scale(0.92);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      animation: none;
    }
  }
</style>
