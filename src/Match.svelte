<script>
  export let match;
</script>

<div class="card">
  <div class="card-header">
    <div class="card-header-title">{match.image}</div>
  </div>
  <div class="card-image">
    <img src="images/{match.image}" alt={match.image} />
  </div>
  <div class="card-footer has-text-centered">
    {#each Object.keys(match.confidences) as c}
      <p class="card-footer-item">{c}<br/>{match.confidences[c].toFixed(3)}</p>
    {/each}
  </div>
</div>
