/*
 * Step: Load all the node modules we'll need for the program
 */
const fs = require('fs')
const path = require('path')
const tf = require('@tensorflow/tfjs-node')
const mobilenet = require('@tensorflow-models/mobilenet')
const knnClassifier = require('@tensorflow-models/knn-classifier')

/* 
 * Step: Define constants we'll use throughout the program
 */
const CLASSIFICATIONS = ["smooth", "wrinkly", "inbetween"]
const DIR_TRAIN_IMAGES = "images/training_images/"
const DIR_RAW_DATA_SET = "images/raw_data_set"
const PHASE_INIT_TF = "INIT"
const PHASE_TRAIN = "TRAIN"
const PHASE_CLASSIFY = "CLASSIFY"

/*
* Step: Define some helpful functions to elimnate duplicate code 
*/
const readImage = path => {
    const imageBuffer = fs.readFileSync(path)
    const tfimage = tf.node.decodeImage(imageBuffer)
    return tfimage;
}

const printReportFor = (c, results) => {
    const m = results.matches
    const num_classified = m.length
    const avg_confidence = (num_classified > 0) ?
        m.reduce((start, i) => {return start + i.confidences[c]}, 0) / num_classified :
        0
    console.log(`${c} => ${results.training_images} training images => ${num_classified} [${avg_confidence * 100}% confident]`)
}

/*
 * Step: Define the main moic algorithm
 */
async function moic() {

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
        CLASSIFICATIONS.forEach(c => {
            classification_results[c] = {
                training_images: 0,
                matches: []
            }
            const classification_path = path.join(DIR_TRAIN_IMAGES, c)
            const training_files = fs.readdirSync(classification_path)
            training_files.forEach((f) => {
                const imagePath = path.join(classification_path, f)
                classifier.addExample(
                    model.infer(readImage(imagePath)),
                    c
                )
                classification_results[c].training_images++
            })
        })
        console.timeEnd(PHASE_TRAIN)

        /*
         * Step: Classification phase
         */
        console.time(PHASE_CLASSIFY)
        console.timeLog(PHASE_CLASSIFY, `Classifying images`)
        for (const i of fs.readdirSync(DIR_RAW_DATA_SET)) {
            try {
                const prediction = await classifier.predictClass(
                    model.infer(readImage(path.join(DIR_RAW_DATA_SET, i)))
                )
                console.log(`${i}\t${prediction.label}\t${JSON.stringify(prediction.confidences)}`)
                classification_results[prediction.label].matches.push({
                    "image": i,
                    "confidences": prediction.confidences
                })
            } catch (err) {
                console.timeLog(PHASE_CLASSIFY, `Error classifying ${i}: ${err}`)
            }
        }
        console.timeEnd(PHASE_CLASSIFY)

        /*
         * Step: Report the results
         */
        console.log(`Classification summary`)
        for(const c of CLASSIFICATIONS) {
            printReportFor(c, classification_results[c])
        }

    } catch (err) {
        console.error(err)
    }
};

moic();