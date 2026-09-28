<script lang="ts">
  import { sheet } from '../app/ui-state';
  import DecorSheet from './sheets/DecorSheet.svelte';
  import DiveSelectSheet from './sheets/DiveSelectSheet.svelte';
  import DressSheet from './sheets/DressSheet.svelte';
  import FoodSheet from './sheets/FoodSheet.svelte';
  import SettingsSheet from './sheets/SettingsSheet.svelte';
  import ZukanSheet from './sheets/ZukanSheet.svelte';
</script>

{#if $sheet === 'food'}
  <FoodSheet />
{:else if $sheet === 'dress'}
  <DressSheet />
{:else if $sheet === 'settings'}
  <SettingsSheet />
{:else if $sheet === 'decor'}
  <DecorSheet />
{:else if $sheet === 'zukan'}
  <ZukanSheet />
{:else if $sheet === 'dive'}
  <DiveSelectSheet />
{/if}
