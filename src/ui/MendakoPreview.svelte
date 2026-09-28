<script lang="ts">
  import { mendakoSVG, type Expression } from '../art/mendako';
  import type { Equipped } from '../game/data/outfits';

  let {
    equipped,
    expression = 'normal',
    label = 'めんだこ',
    size = 78,
  }: { equipped: Partial<Equipped>; expression?: Expression; label?: string; size?: number } = $props();
</script>

<span class="preview" style:width="{size}px" style:height="{size}px">
  {@html mendakoSVG({ equipped, expression, label })}
</span>

<style>
  .preview {
    display: block;
  }

  .preview :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
