<script>
  import Match from "./Match.svelte";
  export let name;
  export let matches = [];
</script>

<div class="box">
  <p class="title">{name} - {matches.length}</p>
  <div class="match-list">
    {#each matches as m}
      <Match match={m} />
    {/each}
  </div>
</div>

<style>
    .match-list {
        height: 800px;
        overflow-y: auto;
    }
</style>