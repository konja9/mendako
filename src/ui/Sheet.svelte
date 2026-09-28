<script lang="ts">
  // 画面の下から出るシート。親指で届く位置に一覧やボタンを出す。
  import { onMount, type Snippet } from 'svelte';
  import { bottomInset } from '../app/ui-state';
  import { ICONS } from '../art/icons';

  let {
    title,
    kind,
    onclose,
    children,
    footer,
    modal = true,
  }: {
    title: string;
    kind: string;
    onclose: () => void;
    children: Snippet;
    footer?: Snippet;
    /** false のときは後ろを暗くせず、シートの外（水槽）も操作できる */
    modal?: boolean;
  } = $props();

  let height = $state(0);
  let section = $state<HTMLDivElement>();

  // シートの高さを水槽に伝えて、めんだこが隠れないようにする
  $effect(() => {
    bottomInset.set(height);
  });

  onMount(() => {
    const previous = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      // 入力欄には当てない（スマホでキーボードが勝手に出てしまうため）
      const first = section?.querySelector<HTMLElement>('.body button');
      (first ?? section?.querySelector<HTMLElement>('.close'))?.focus({ preventScroll: true });
    });
    return () => {
      bottomInset.set(0);
      previous?.focus?.({ preventScroll: true });
    };
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

{#if modal}
  <button class="backdrop" type="button" tabindex="-1" aria-label="閉じる" onclick={onclose}></button>
{/if}
<div class="sheet" data-kind={kind} role="dialog" aria-modal={modal} aria-labelledby="sheet-title" bind:this={section} bind:clientHeight={height}>
  <header>
    <h2 id="sheet-title">{title}</h2>
    <button class="icon-btn close" type="button" aria-label="閉じる" onclick={onclose}>{@html ICONS.close}</button>
  </header>
  <div class="body">
    {@render children()}
  </div>
  {#if footer}
    <footer>{@render footer()}</footer>
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
    padding: 0;
    border: 0;
    background: rgba(3, 10, 30, 0.3);
    pointer-events: auto;
    cursor: default;
  }

  .sheet {
    position: fixed;
    z-index: 11;
    left: 50%;
    bottom: 0;
    box-sizing: border-box;
    width: min(var(--column), 100%);
    max-height: 78%;
    display: flex;
    flex-direction: column;
    background: var(--pearl);
    color: var(--ink);
    border-radius: 26px 26px 0 0;
    box-shadow: 0 -10px 40px rgba(2, 8, 30, 0.45);
    transform: translateX(-50%);
    animation: sheet-in 0.28s ease-out;
    pointer-events: auto;
  }

  /* きせかえ中は上に水槽を広く見せるため、高さを固定 */
  .sheet[data-kind='dress'] {
    height: 54%;
  }

  /* 模様替え中は水槽を広く見せたいので低め */
  .sheet[data-kind='decor'] {
    height: min(46%, 360px);
  }

  .sheet[data-kind='zukan'] {
    height: 84%;
  }

  @keyframes sheet-in {
    from {
      transform: translate(-50%, 40px);
      opacity: 0;
    }
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 4px 20px;
  }

  h2 {
    margin: 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 19px;
  }

  .close {
    background: var(--pearl-2);
    border-color: transparent;
    color: var(--ink);
  }

  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 16px calc(18px + env(safe-area-inset-bottom, 0px));
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
    border-top: 2px solid var(--pearl-2);
  }

  .body:has(+ footer) {
    padding-bottom: 12px;
  }
</style>
