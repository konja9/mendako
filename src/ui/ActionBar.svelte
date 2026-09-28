<script lang="ts">
  import { game, petMendako, startPlay, toggleSleep } from '../app/actions';
  import { bus } from '../app/events';
  import { sheet } from '../app/ui-state';
  import { ICONS, type IconName } from '../art/icons';

  type Action = { id: string; label: string; icon: IconName; tone: string; needsAwake: boolean; run: () => void };

  const sleeping = $derived($game.sleeping);
  const actions: Action[] = $derived([
    { id: 'food', label: 'ごはん', icon: 'food', tone: 'var(--coral)', needsAwake: true, run: () => sheet.set('food') },
    { id: 'pet', label: 'なでる', icon: 'pet', tone: 'var(--anemone)', needsAwake: true, run: () => petMendako() },
    { id: 'play', label: 'あそぶ', icon: 'play', tone: 'var(--mint)', needsAwake: true, run: startPlay },
    { id: 'dress', label: 'きせかえ', icon: 'dress', tone: 'var(--lilac)', needsAwake: false, run: () => sheet.set('dress') },
    {
      id: 'sleep',
      label: sleeping ? 'おきる' : 'ねる',
      icon: sleeping ? 'sun' : 'moon',
      tone: 'var(--lantern)',
      needsAwake: false,
      run: toggleSleep,
    },
  ]);

  function press(action: Action) {
    if (action.needsAwake && sleeping) {
      bus.emit('toast', '寝てるよ。そっとしておこう');
      return;
    }
    action.run();
  }
</script>

<nav class="actions" aria-label="おせわ">
  {#each actions as action (action.id)}
    <button
      class="action"
      type="button"
      data-action={action.id}
      style:--tone={action.tone}
      aria-disabled={action.needsAwake && sleeping}
      onclick={() => press(action)}
    >
      <span class="icon">{@html ICONS[action.icon]}</span>
      <span class="label">{action.label}</span>
    </button>
  {/each}
</nav>

<style>
  .actions {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    pointer-events: auto;
  }

  .action {
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }

  .icon {
    display: grid;
    place-items: center;
    width: min(58px, 15vw);
    min-width: var(--tap);
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--tone);
    color: var(--ink);
    box-shadow:
      0 5px 0 rgba(0, 0, 0, 0.22),
      inset 0 -4px 0 rgba(0, 0, 0, 0.08);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease;
  }

  .icon :global(svg) {
    width: 52%;
    height: 52%;
  }

  .action:active .icon {
    transform: translateY(3px);
    box-shadow:
      0 2px 0 rgba(0, 0, 0, 0.22),
      inset 0 -4px 0 rgba(0, 0, 0, 0.08);
  }

  .action[aria-disabled='true'] .icon {
    filter: saturate(0.35) brightness(0.75);
  }

  .label {
    font-family: var(--font-pop);
    font-size: 12px;
  }
</style>
