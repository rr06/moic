const PHASE_INIT_TF = "INIT"
const PHASE_TRAIN = "TRAIN"
const PHASE_CLASSIFY = "CLASSIFY"

async function classify(manifest, imgHolder) {

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
                console.debug(`Training ${c} with ${imagePath}`)
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
                const prediction = await classifier.predictClass(
                    model.infer(tf.browser.fromPixels(imgHolder))
                )
                classification_results[prediction.label].matches.push({
                    "image": img.i,
                    "confidences": prediction.confidences,
                    "isTrainingImage": img.c && img.c.includes(prediction.label)
                })
                console.debug(`Classified ${imagePath} as ${prediction.label}`)
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

export default classify;