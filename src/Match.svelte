<script>
  import lazyLoad from "./lazyLoad";
  export let match;

  function format(confidence) {
    if (confidence == 1 || confidence == 0) return confidence;
    return confidence.toFixed(3);
  }

  function background(confidence) {
    if (confidence == 1) return "has-background-success";
    return "";
  }
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
      <p class="card-footer-item {background(match.confidences[c])}">
        {c}<br />{format(match.confidences[c])}
      </p>
    {/each}
  </div>
</div>
