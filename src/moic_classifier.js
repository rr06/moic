const fs = require('fs')
const path = require('path')
const tf = require('@tensorflow/tfjs-node')
const mobilenet = require('@tensorflow-models/mobilenet')
const knnClassifier = require('@tensorflow-models/knn-classifier')

const myArgs = process.argv.slice(2)

const DIR_RAW_DATA_SET = myArgs[0]
console.log(`Image directory: ${DIR_RAW_DATA_SET}`)

console.log(`Training classification file: ${myArgs[1]}`)
const training_instructions = JSON.parse(fs.readFileSync(myArgs[1]))

const CLASSIFICATIONS = training_instructions.map(i => i["classification"]);
console.log(`Classifications: ${CLASSIFICATIONS}`)

const PHASE_INIT_TF = "INIT"
const PHASE_TRAIN = "TRAIN"
const PHASE_CLASSIFY = "CLASSIFY"

/*
* Step: Define some helpful functions to eliminate duplicate code 
*/
const readImage = path => {
    const imageBuffer = fs.readFileSync(path)
    const tfimage = tf.node.decodeImage(imageBuffer)
    return tfimage;
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
        training_instructions.forEach(ti => {
            let c = ti["classification"]
            classification_results[c] = {
                training_images: [],
                matches: []
            }
            
            ti["images"].forEach(f => {
                const imagePath = path.join(DIR_RAW_DATA_SET, f)
                classifier.addExample(
                    model.infer(readImage(imagePath)),
                    c
                )
                classification_results[c].training_images.push(f)
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
                classification_results[prediction.label].matches.push({
                    "image": i,
                    "confidences": prediction.confidences,
                    "isTrainingImage": classification_results[prediction.label].training_images.includes(i)
                })
            } catch (err) {
                console.timeLog(PHASE_CLASSIFY, `Error classifying ${i}: ${err}`)
            }
        }
        console.timeEnd(PHASE_CLASSIFY)

        /*
         * Step: Save the results
         */
        console.log(`Writing classification results`)
        fs.writeFileSync(myArgs[2], JSON.stringify(classification_results))

    } catch (err) {
        console.error(err)
    }
};

moic();