<script lang="ts">
  import { sheet } from '../app/ui-state';
  import DressSheet from './sheets/DressSheet.svelte';
  import FoodSheet from './sheets/FoodSheet.svelte';
  import SettingsSheet from './sheets/SettingsSheet.svelte';
</script>

{#if $sheet === 'food'}
  <FoodSheet />
{:else if $sheet === 'dress'}
  <DressSheet />
{:else if $sheet === 'settings'}
  <SettingsSheet />
{/if}
