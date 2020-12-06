<script>
  import classify from "./WebClassifier";

  export let manifest;

  function training_images_for(c) {
    return manifest.images.filter((img) => img.c == c).length;
  }

  async function doClassification() {
    console.log("Initiating classification");
    await classify(manifest, document.getElementById("imgHolder"));
  }
</script>

<div class="box">
  <div class="has-text-centered">
    <span class="title">{manifest.root_image_location}</span>
    <span class="tag is-primary">{manifest.images.length} images</span>
  </div>
  <div class="columns has-text-centered">
    {#each manifest.classifications as c}
      <div class="column">
        <div class="subtitle">
          {c}
          <span class="tag is-primary">{training_images_for(c)} images</span>
        </div>
      </div>
    {/each}
  </div>
  <div class="has-text-centered">
    <button
      type="button"
      class="button"
      on:click={doClassification}>Classify!</button>
  </div>
  <div class="has-text-centered">
    <!-- svelte-ignore a11y-img-redundant-alt -->
    <img
      id="imgHolder"
      crossorigin
      src="/favicon.png"
      width="100"
      height="100"
      alt="Image holder for training and classification" />
  </div>
</div>
