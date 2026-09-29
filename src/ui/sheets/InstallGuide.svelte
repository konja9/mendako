<script lang="ts">
  import { installPrompt, IS_PAGES, isIOS, isStandalone, PAGES_URL, promptInstall } from '../../app/install';

  const standalone = isStandalone();
  const ios = isIOS();
</script>

{#if !standalone}
  <section class="install" aria-labelledby="install-title">
    <h3 id="install-title">ホーム画面に置く</h3>
    {#if !IS_PAGES}
      <p>ホーム画面に置けて、電波がなくても遊べる版があります。記録は別々なので、はじめからになります。</p>
      <a class="btn btn-small" href={PAGES_URL} target="_blank" rel="noopener">ホーム画面に置ける版を開く</a>
    {:else if $installPrompt}
      <p>アプリのように、ホーム画面からすぐ開けます。電波がなくても遊べます。</p>
      <button class="btn btn-small btn-primary" type="button" onclick={promptInstall}>ホーム画面に追加</button>
    {:else if ios}
      <p>Safari の <b>共有ボタン</b>（四角から矢印が出ているマーク）を押して、<b>「ホーム画面に追加」</b>を選んでね。電波がなくても遊べます。</p>
    {:else}
      <p>ブラウザのメニューから<b>「ホーム画面に追加」</b>（または「アプリをインストール」）を選んでね。電波がなくても遊べます。</p>
    {/if}
  </section>
{/if}

<style>
  .install {
    display: grid;
    gap: 8px;
    justify-items: start;
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 16px;
    background: #fff;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  a.btn {
    text-decoration: none;
  }
</style>
