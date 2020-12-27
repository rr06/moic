<script>
  export let manifest
  let classificationStatus = "ready and waiting"

  function training_images_for(c) {
    return manifest.images.filter((img) => img.c == c).length
  }

  function doClassification() {
    classificationStatus = "Initiating classification"
    const worker = new Worker('./WebClassifier.js')

    worker.addEventListener("message", e => {
      switch(e.data.action) {
        case 'TFINIT':
          worker.postMessage(
            {
              action: "CLASSIFY",
              manifest: manifest
            })
          break
        default: 
          classificationStatus = e.data.message
      }
    })
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
    <p>{classificationStatus}</p>
  </div>
  <div class="has-text-centered">
    <!-- svelte-ignore a11y-img-redundant-alt -->
    <img class="is-hidden"
      id="imgHolder"
      crossorigin
      src="/favicon.png"
      width="100"
      height="100"
      alt="Image holder for training and classification" />
  </div>
</div>
