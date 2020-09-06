const fs = require('fs')
const path = require('path')
const tf = require('@tensorflow/tfjs-node')
const mobilenet = require('@tensorflow-models/mobilenet');

async function moic() {

    try {

        // Load up the TensorflowJS mobile-net stuff

        // Initialize the trainer
        const model = await mobilenet.load();

        const classifications = ["smooth", "wrinkly", "inbetween"]

        const training_dir = "images/training_images/"
        console.log(`Looking for training images...`)

        classifications.forEach(c => {
            const classification_path = path.join(training_dir, c)
            const files = fs.readdirSync(classification_path)
            files.forEach((f) => console.log(path.join(classification_path, f)))

            // With the list of files, we need to read each one and make it part of the training set
        })

    } catch (err) {
        console.error(err)
    }
    // Then run the trainer against the raw data and see what it comes up with
};

moic();