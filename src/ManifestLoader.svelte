<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    let files;
  
    function openFile() {
      files[0].text().then((text) => {
        dispatch("manifestLoaded", {
          file: files[0].name,
          manifest: JSON.parse(text),
        });
      });
    }
  </script>
  
  <div class="notification is-info is-light has-text-centered">
    <p class="subtitle">Load manifest file &nbsp;</p>
    <input type="file" id="results-file-input" bind:files on:change={openFile} />
  </div>
  