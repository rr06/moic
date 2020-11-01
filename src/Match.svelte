<script>
  import lazyLoad from "./lazyLoad";

  export let match;
</script>

<div class="card">
  <div class="card-header">
    <div class="card-header-title">{match.image}</div>
  </div>
  <div class="card-image">
    <figure class="image is-square">
      <img use:lazyLoad={'images/' + match.image} alt={match.image} />
    </figure>
  </div>
  <div class="card-footer has-text-centered">
    {#each Object.keys(match.confidences) as c}
      <p class="card-footer-item">{c}<br />{match.confidences[c].toFixed(3)}</p>
    {/each}
  </div>
</div>
