<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let state = "pending";
  let files;

  function openFile() {
    files[0].text().then((text) => {
      state = "fulfilled";
      dispatch("loaded", {
        file: files[0].name,
        results: JSON.parse(text),
      });
    });
  }
</script>

{#if state == 'pending'}
  Load results file &nbsp;
  <input type="file" id="results-file-input" bind:files on:change={openFile} />
{:else if state == 'fulfilled'}
  <p class="is-loading">Loading results</p>
{/if}
