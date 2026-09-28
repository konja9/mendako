<script lang="ts">
  import { closeSheet, game } from '../../app/actions';
  import { CREATURE_ART } from '../../art/creatures';
  import { ICONS } from '../../art/icons';
  import { mendakoSVG } from '../../art/mendako';
  import { CREATURE_BY_ID, CREATURES } from '../../game/data/creatures';
  import { TAG_LABEL } from '../../game/data/decor';
  import { zukanProgress } from '../../game/visitors';
  import Sheet from '../Sheet.svelte';

  // 探索でしか会えない生き物（Phase 3）は、まだ図鑑に並べない
  const list = CREATURES.filter((c) => c.meet !== 'dive');
  const DEPTH_MAX = 2500;
  const HOME_DEPTH = 400;

  let detail = $state<string | null>(null);
  const progress = $derived(zukanProgress($game));
  const def = $derived(detail ? CREATURE_BY_ID[detail] : null);
  const entry = $derived(detail ? $game.zukan[detail] : null);

  const artOf = (id: string) => (id === 'mendako' ? mendakoSVG({ equipped: { color: 'color-coral' }, label: 'メンダコ' }) : CREATURE_ART[id].svg);
  const date = (t: number) => {
    const d = new Date(t);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };
  const pct = (m: number) => `${Math.min(100, (m / DEPTH_MAX) * 100)}%`;
</script>

<Sheet title="深海図鑑" kind="zukan" onclose={closeSheet}>
  {#if def && entry}
    <div class="detail">
      <button class="back" type="button" onclick={() => (detail = null)}>{@html ICONS.back}一覧へ</button>
      <div class="big-art">{@html artOf(def.id)}</div>
      <h3>{def.name}</h3>
      <p class="sci">{def.sci}</p>
      <p class="text">{def.text}</p>
      <dl>
        <div>
          <dt>水深</dt>
          <dd>
            {def.depth[0]}〜{def.depth[1]}m
            <span class="depth" aria-hidden="true">
              <span class="range" style:left={pct(def.depth[0])} style:width="calc({pct(def.depth[1])} - {pct(def.depth[0])})"></span>
              <span class="home" style:left={pct(HOME_DEPTH)}></span>
            </span>
            <span class="scale" aria-hidden="true">
              {#each [0, 1000, 2000] as m (m)}<span style:left={pct(m)}>{m === 2000 ? '2000m' : m}</span>{/each}
            </span>
            <span class="legend">縦の線は、めんだこの水槽の深さ（{HOME_DEPTH}m）</span>
          </dd>
        </div>
        <div><dt>大きさ</dt><dd>{def.size}</dd></div>
        {#if def.likes.length}
          <div><dt>好きな飾り</dt><dd>{def.likes.map((t) => TAG_LABEL[t]).join('・')}</dd></div>
        {/if}
        <div><dt>出会った回数</dt><dd>{entry.count}回</dd></div>
        <div><dt>初めて会った日</dt><dd>{date(entry.firstAt)}</dd></div>
      </dl>
    </div>
  {:else}
    <p class="progress">
      <span>見つけた生き物 <b>{progress.found}</b> / {progress.total}</span>
      <span class="bar"><span style:width="{(progress.found / progress.total) * 100}%"></span></span>
    </p>
    <div class="grid">
      {#each list as c (c.id)}
        {@const found = !!$game.zukan[c.id]}
        {#if found}
          <button class="card" type="button" onclick={() => (detail = c.id)}>
            <span class="art">{@html artOf(c.id)}</span>
            <span class="card-name">{c.name}</span>
            <span class="card-note">{$game.zukan[c.id].count}回 会った</span>
          </button>
        {:else}
          <div class="card is-unknown">
            <span class="art">{@html artOf(c.id)}</span>
            <span class="card-name">？？？</span>
            <span class="card-note">{c.hint}</span>
          </div>
        {/if}
      {/each}
    </div>
    <p class="sheet-hint">水槽に飾りを置くと、好きな生き物が遊びに来るよ。来たらタップしてね。</p>
  {/if}
</Sheet>

<style>
  .progress {
    display: grid;
    gap: 6px;
    margin: 4px 2px 10px;
    font-size: 14px;
  }

  .progress b {
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 18px;
  }

  .bar {
    display: block;
    height: 8px;
    border-radius: 99px;
    background: var(--pearl-2);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--mint), var(--glow));
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .art {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
  }

  .art :global(svg) {
    max-width: 76px;
    max-height: 76px;
    width: auto;
    height: auto;
  }

  .is-unknown {
    cursor: default;
  }

  .is-unknown .art {
    filter: brightness(0);
    opacity: 0.22;
  }

  .detail {
    display: grid;
    gap: 6px;
  }

  .back {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: var(--tap);
    padding: 0 14px 0 8px;
    border: 0;
    border-radius: 99px;
    background: var(--pearl-2);
    color: var(--ink);
    font-weight: 700;
    cursor: pointer;
  }

  .back :global(svg) {
    width: 20px;
    height: 20px;
  }

  .big-art {
    display: grid;
    place-items: center;
    height: 150px;
    border-radius: 20px;
    background: linear-gradient(180deg, #16305c, #0b2248);
  }

  .big-art :global(svg) {
    max-width: 180px;
    max-height: 130px;
    width: auto;
    height: auto;
  }

  h3 {
    margin: 6px 0 0;
    font-family: var(--font-pop);
    font-weight: 400;
    font-size: 22px;
  }

  .sci {
    margin: 0;
    font-size: 13px;
    font-style: italic;
    color: var(--ink-soft);
  }

  .text {
    margin: 4px 0;
    line-height: 1.7;
  }

  dl {
    display: grid;
    gap: 8px;
    margin: 4px 0 0;
  }

  dl div {
    display: grid;
    grid-template-columns: 7.5em 1fr;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 14px;
    background: #fff;
  }

  dt {
    font-size: 13px;
    color: var(--ink-soft);
  }

  dd {
    margin: 0;
    font-weight: 700;
  }

  .depth {
    position: relative;
    display: block;
    height: 10px;
    margin-top: 6px;
    border-radius: 99px;
    background: linear-gradient(90deg, #cfe3ff, #0b2248);
  }

  .range {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 99px;
    background: var(--anemone);
    box-shadow: 0 0 0 2px #fff;
  }

  .home {
    position: absolute;
    top: -4px;
    width: 3px;
    height: 18px;
    border-radius: 2px;
    background: var(--ink);
  }

  .scale {
    position: relative;
    display: block;
    height: 16px;
    margin-top: 2px;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-soft);
  }

  .scale span {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    font-variant-numeric: tabular-nums;
  }

  .scale span:first-child {
    transform: none;
  }

  .legend {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-soft);
  }
</style>
