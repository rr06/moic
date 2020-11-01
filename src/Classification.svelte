<script>
  import Match from "./Match.svelte";
  export let name;
  export let matches = [];
</script>

<style>
  .match-list {
    height: 800px;
    overflow-y: auto;
  }
</style>

<div class="box">
  <p class="title has-text-centered">
    {name}
    <span class="tag is-primary">{matches.length}</span>
  </p>
  <div class="match-list">
    {#each matches as m}
      <Match match={m} />
    {/each}
  </div>
</div>
