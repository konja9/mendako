<script lang="ts">
  import { closeSheet, feedFood, game } from '../../app/actions';
  import { FOOD_ICONS, PEARL } from '../../art/icons';
  import { FOODS } from '../../game/data/care';
  import Sheet from '../Sheet.svelte';
</script>

<Sheet title="ごはん" kind="food" onclose={closeSheet}>
  <div class="grid">
    {#each FOODS as food (food.id)}
      <button class="card" type="button" aria-disabled={$game.pearls < food.price} onclick={() => feedFood(food.id)}>
        <span class="art">{@html FOOD_ICONS[food.id]}</span>
        <span class="card-name">{food.name}</span>
        <span class="card-note">{food.note}</span>
        <span class="effect">おなか +{food.hunger}<br />ごきげん +{food.mood}</span>
        {#if food.price === 0}
          <span class="price is-free">無料</span>
        {:else}
          <span class="price">{@html PEARL}{food.price}</span>
        {/if}
      </button>
    {/each}
  </div>
</Sheet>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding-top: 4px;
  }

  .art :global(svg) {
    width: 52px;
    height: 52px;
  }

  .effect {
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.45;
    color: var(--ink-soft);
  }
</style>
