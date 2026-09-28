<script lang="ts">
  import { onMount } from 'svelte';
  import { bus } from '../app/events';

  let message = $state('');
  let shown = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  onMount(() =>
    bus.on('toast', (text) => {
      message = text;
      shown = true;
      clearTimeout(timer);
      timer = setTimeout(() => (shown = false), 2600);
    }),
  );
</script>

<p class="toast" class:is-shown={shown} role="status" aria-live="polite">{message}</p>

<style>
  .toast {
    position: absolute;
    z-index: 3;
    top: 4px;
    left: 50%;
    max-width: calc(100% - 8px);
    width: max-content;
    margin: 0;
    padding: 8px 16px;
    border-radius: 99px;
    background: var(--pearl);
    color: var(--ink);
    font-weight: 700;
    font-size: 15px;
    text-align: center;
    box-shadow: 0 6px 18px rgba(2, 8, 30, 0.35);
    opacity: 0;
    transform: translate(-50%, -8px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
    pointer-events: none;
  }

  .toast.is-shown {
    opacity: 1;
    transform: translate(-50%, 0);
  }
</style>
