<script>
  import Classification from "./Classification.svelte";
  import ResultsFileLoader from "./ResultsFileLoader.svelte";
  let file = "";
  let results;
  function resultsLoaded(event) {
    file = event.detail.file;
    results = event.detail.results;
  }
</script>

<nav class="navbar is-fixed-top">
  <div class="navbar-brand">
    <p class="navbar-item title">MOIC - Biofilm image classifier</p>
    <p class="navbar-item subtitle">{file}</p>
  </div>
  <div class="navbar-menu">
    <div class="navbar-end">
      <p class="navbar-item">
        <span class="tag is-info">matches</span>
      </p>
      <p class="navbar-item">
        <span class="tag is-warning">uncertain matches</span>
      </p>
    </div>
  </div>
</nav>

<section class="section">
  {#if results}
    <div class="columns">
      {#each Object.keys(results) as c}
        <div class="column">
          <Classification name={c} matches={results[c].matches} />
        </div>
      {/each}
    </div>
  {:else}
    <ResultsFileLoader on:loaded={resultsLoaded} />
  {/if}
</section>

<footer class="footer">
  <div class="content has-text-centered">
    Built by Paul J. Cullen and Robert M. Romito
  </div>
</footer>
