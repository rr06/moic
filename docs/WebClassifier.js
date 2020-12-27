const PHASE_INIT_TF = "INIT"
const PHASE_TRAIN = "TRAIN"
const PHASE_CLASSIFY = "CLASSIFY"

importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs")
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js")
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet")
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier")

/* 
 * Step 1: Initialize TFJS. Send message when done
 */
tf.setBackend('wasm').then(() => {
    postMessage({ action: "TFINIT", message: "TFJS is ready" })
});

/*
 * Step 2: Wait for message to being classification
 */
onmessage = e => {
    switch (e.data.action) {
        case 'CLASSIFY':
            classify(e.data.manifest)
            break
        default:
            console.error("I don't know what to do with this message")
            console.error(e.data)
    }
}

/*
 * Step 3: Classify, sending messages along the way
 */

async function classify(manifest) {

    const imgHolder = document.getElementById("imgHolder")

    try {
        /*
         * Initialize the results object
         */
        const classification_results = {}

        /*
         * Initialize the TF model and trainer
         */
        console.time(PHASE_INIT_TF)
        const classifier = knnClassifier.create();
        const model = await mobilenet.load();
        console.timeEnd(PHASE_INIT_TF)

        /*
         * Step: Training phase
         */
        console.time(PHASE_TRAIN)
        console.timeLog(PHASE_TRAIN, `Looking for training images...`)

        manifest.classifications.forEach(c => {

            classification_results[c] = {
                training_images: [],
                matches: []
            }

            manifest.images.filter((img) => img.c == c).forEach(img => {
                const imagePath = `${manifest.root_image_location}${img.i}`
                postMessage({ message: `Training ${c} with ${imagePath}` })
                imgHolder.src = imagePath
                classifier.addExample(
                    model.infer(tf.browser.fromPixels(imgHolder)),
                    c
                )
                classification_results[c].training_images.push(img)
            })
        })
        console.timeEnd(PHASE_TRAIN)

        /*
        * Step: Classification phase
        */
        console.time(PHASE_CLASSIFY)
        console.timeLog(PHASE_CLASSIFY, `Classifying images`)
        for (const img of manifest.images) {
            const imagePath = `${manifest.root_image_location}${img.i}`
            imgHolder.src = imagePath
            try {
                postMessage({ message: `Classifying ${imagePath}` })
                const prediction = await classifier.predictClass(
                    model.infer(tf.browser.fromPixels(imgHolder))
                )
                classification_results[prediction.label].matches.push({
                    "image": img.i,
                    "confidences": prediction.confidences,
                    "isTrainingImage": img.c && img.c.includes(prediction.label)
                })
                postMessage({ message: `Classified ${imagePath} as ${prediction.label}` })
            } catch (err) {
                console.timeLog(PHASE_CLASSIFY, `Error classifying ${img.i}: ${err}`)
            }
        }
        console.timeEnd(PHASE_CLASSIFY)

        /*
         * Step: Save the results
         */
        console.log(`Classification done`)
        return classification_results;

    } catch (err) {
        console.error(err)
    }
};

