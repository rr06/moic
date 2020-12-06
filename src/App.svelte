<script>
  import Classification from "./Classification.svelte";
  import ResultsFileLoader from "./ResultsFileLoader.svelte";
  import ManifestLoader from "./ManifestLoader.svelte";
  import Manifest from "./Manifest.svelte";

  let manifestFile = "";
  let manifest;
  function manifestLoaded(event) {
    manifestFile = event.detail.file;
    manifest = event.detail.manifest;
  }

  let resultsFile = "";
  let results;
  function resultsLoaded(event) {
    resultsFile = event.detail.file;
    results = event.detail.results;
  }
</script>

<nav class="navbar is-fixed-top">
  <div class="navbar-brand">
    <p class="navbar-item title">MOIC - Biofilm image classifier</p>
    <p class="navbar-item subtitle">{manifestFile}</p>
    <p class="navbar-item subtitle">{resultsFile}</p>
  </div>
  <div class="navbar-menu">
    <div class="navbar-end">
      <p class="navbar-item"><span class="tag is-info">matches</span></p>
      <p class="navbar-item">
        <span class="tag is-warning">uncertain matches</span>
      </p>
    </div>
  </div>
</nav>

<section class="section">
  {#if manifest}
    <Manifest manifest={manifest} />
  {/if}
  {#if results}
    <div class="columns">
      {#each Object.keys(results) as c}
        <div class="column">
          <Classification name={c} matches={results[c].matches} />
        </div>
      {/each}
    </div>
  {/if}
  <ManifestLoader on:manifestLoaded={manifestLoaded} />
  <ResultsFileLoader on:resultsLoaded={resultsLoaded} />
</section>

<footer class="footer">
  <div class="content has-text-centered">
    Built by Paul J. Cullen and Robert M. Romito
  </div>
</footer>
