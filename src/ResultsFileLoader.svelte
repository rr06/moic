<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let files;

  function openFile() {
    files[0].text().then((text) => {
      dispatch("loaded", {
        file: files[0].name,
        results: JSON.parse(text),
      });
    });
  }
</script>

<div class="notification is-info is-light has-text-centered">
  <p class="subtitle">Load results file &nbsp;</p>
  <input type="file" id="results-file-input" bind:files on:change={openFile} />
</div>
