<script lang="ts">
  // はじめての人に、めんだこの名前をつけてもらう。そのままでも進める。
  // iPhone ではキーボードが画面の下半分を覆うので、カードは上のほうに置く
  // （真ん中に置くと、入力欄を見せるために画面全体がずらされ、ボタンの位置とタップの位置が食い違う）。
  import { onMount } from 'svelte';
  import { game } from '../app/actions';
  import { confirmName } from '../app/onboarding';
  import { NAME_MAX } from '../game/state';
  import MendakoPreview from './MendakoPreview.svelte';

  const initial = game.get().name;
  let name = $state(initial);
  let button = $state<HTMLButtonElement>();
  /** 今見えている範囲の上端（キーボードで画面がずらされたときに追いかける） */
  let viewTop = $state(0);

  onMount(() => {
    // 入力欄には当てない（スマホでキーボードが勝手に出てしまうため）
    button?.focus({ preventScroll: true });
    const vv = window.visualViewport;
    if (!vv) return;
    const follow = () => (viewTop = Math.max(0, vv.offsetTop));
    vv.addEventListener('resize', follow);
    vv.addEventListener('scroll', follow);
    return () => {
      vv.removeEventListener('resize', follow);
      vv.removeEventListener('scroll', follow);
    };
  });

  function submit(e: SubmitEvent) {
    e.preventDefault();
    (document.activeElement as HTMLElement | null)?.blur?.();
    confirmName(name);
  }
</script>

<div class="scrim"></div>
<div class="card" role="dialog" aria-modal="true" aria-labelledby="name-title" style:--view-top="{viewTop}px">
  <div class="head">
    <MendakoPreview equipped={$game.equipped} expression="happy" size={56} />
    <div>
      <h2 id="name-title">めんだこに名前をつけよう</h2>
      <p>あとから設定画面で変えられるよ。</p>
    </div>
  </div>
  <form onsubmit={submit}>
    <input
      name="name"
      maxlength={NAME_MAX}
      autocomplete="off"
      enterkeyhint="done"
      aria-label="名前"
      bind:value={name}
      placeholder="めんちゃん"
    />
    <button class="btn btn-primary" type="submit" bind:this={button}>
      {name.trim() === initial || !name.trim() ? 'この名前ではじめる' : 'この名前にする'}
    </button>
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
    top: calc(var(--view-top, 0px) + 16px + env(safe-area-inset-top, 0px));
    transform: translateX(-50%);
    box-sizing: border-box;
    width: min(360px, calc(100% - 32px));
    display: grid;
    gap: 12px;
    padding: 16px 16px 16px;
    border-radius: 24px;
    background: var(--pearl);
    color: var(--ink);
    pointer-events: auto;
    animation: fade 0.3s ease-out;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .head :global(.preview) {
    flex: none;
  }

  h2 {
    margin: 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 18px;
    line-height: 1.3;
  }

  p {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--ink-soft);
  }

  form {
    display: grid;
    gap: 10px;
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
    min-height: 48px;
  }

  /* 縦には動かさない（キーボードの開け閉めと重なると、ボタンが逃げて見えるため） */
  @keyframes fade {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      animation: none;
    }
  }
</style>
