<script>
  import Match from "./Match.svelte";

  export let name;
  export let matches = [];

  let excludeFullConfidence = false;

  $: uncertainMatches = matches.filter((m) => m.confidences[name] < 1);
  $: matchesList = excludeFullConfidence ? uncertainMatches : matches;
</script>

<style>
  .match-list {
    height: 800px;
    overflow-y: auto;
  }
</style>

<div class="box">
  <p class="has-text-centered">
    <span class="title">{name}</span>
    <span class="tag is-info">{matches.length}</span>
    <span class="tag is-warning">{uncertainMatches.length}</span>
    <br/>
    <label class="checkbox">
      <input type="checkbox" bind:checked={excludeFullConfidence} />
      exclude full confidences
    </label>
  </p>
  <div class="match-list">
    {#each matchesList as m}
        <Match match={m} />
    {/each}
  </div>
</div>
