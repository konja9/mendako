<script lang="ts">
  import { mode } from '../app/ui-state';
  import ActionBar from './ActionBar.svelte';
  import Bubble from './Bubble.svelte';
  import CatchOverlay from './CatchOverlay.svelte';
  import Celebrate from './Celebrate.svelte';
  import DiveOverlay from './DiveOverlay.svelte';
  import Hud from './Hud.svelte';
  import SheetHost from './SheetHost.svelte';
  import Status from './Status.svelte';
  import Toast from './Toast.svelte';
</script>

<!-- 水槽（Pixi の canvas）が後ろにあり、その上に画面の部品を重ねている。
     部品のない場所のタップは canvas（めんだこ）に届く。 -->
<div class="app" class:is-away={$mode !== 'home'}>
  <Hud />
  <Status />
  <div class="stage">
    <Toast />
  </div>
  <ActionBar />
</div>

<Bubble />
<SheetHost />
<Celebrate />
{#if $mode === 'catch'}
  <CatchOverlay />
{:else if $mode === 'dive'}
  <DiveOverlay />
{/if}

<style>
  .app {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    max-width: var(--column);
    margin: 0 auto;
    padding-inline: 16px;
    padding-block: 10px 12px;
  }

  .app.is-away {
    visibility: hidden;
  }

  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  @media (max-height: 680px) {
    .app {
      gap: 8px;
      padding-block: 6px 8px;
    }
  }
</style>
