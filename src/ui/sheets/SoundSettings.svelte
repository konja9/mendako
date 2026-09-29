<script lang="ts">
  import { playSfx } from '../../audio';
  import { settings } from '../../app/settings';

  function toggle(key: 'sfx' | 'bgm') {
    settings.update((s) => ({ ...s, [key]: !s[key] }));
    // オンにした効果音が鳴ることを、その場で確かめられるように
    if (key === 'sfx') playSfx('tap');
  }

  function setVolume(e: Event) {
    const value = Number((e.currentTarget as HTMLInputElement).value) / 100;
    settings.update((s) => ({ ...s, volume: value }));
  }
</script>

<section class="sound" aria-labelledby="sound-title">
  <h3 id="sound-title">音</h3>
  <div class="switches">
    {#each [{ key: 'sfx', label: '効果音' }, { key: 'bgm', label: 'BGM' }] as const as item (item.key)}
      <button class="switch" type="button" role="switch" aria-checked={$settings[item.key]} onclick={() => toggle(item.key)}>
        <span class="label">{item.label}</span>
        <span class="track" aria-hidden="true"><span class="knob"></span></span>
      </button>
    {/each}
  </div>
  <label class="volume">
    <span>音量</span>
    <input
      type="range"
      min="0"
      max="100"
      step="5"
      value={Math.round($settings.volume * 100)}
      oninput={setVolume}
      onchange={() => playSfx('tap')}
      disabled={!$settings.sfx && !$settings.bgm}
    />
  </label>
  <p class="note">音は画面を一度タップしてから鳴ります。iPhone はマナーモードのときは鳴りません。</p>
</section>

<style>
  .sound {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .switches {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: var(--tap);
    padding: 0 12px 0 14px;
    border: 0;
    border-radius: 14px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .track {
    position: relative;
    flex: none;
    width: 42px;
    height: 24px;
    border-radius: 99px;
    background: var(--pearl-2);
    transition: background 0.2s ease;
  }

  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(43, 35, 82, 0.3);
    transition: transform 0.2s ease;
  }

  .switch[aria-checked='true'] .track {
    background: var(--anemone);
  }

  .switch[aria-checked='true'] .knob {
    transform: translateX(18px);
  }

  .volume {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--tap);
    padding: 0 14px;
    border-radius: 14px;
    background: #fff;
    font-weight: 700;
  }

  .volume span {
    flex: none;
  }

  input[type='range'] {
    flex: 1;
    min-width: 0;
    height: var(--tap);
    margin: 0;
    accent-color: var(--anemone);
  }

  .note {
    margin: 0;
    font-size: 12px;
    color: var(--ink-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    .track,
    .knob {
      transition: none;
    }
  }
</style>
