# moic
Micro Organism Image Classifer experiment

## Collaboration

moic provides a system to iteratively classify a set of biofilm images at different stages of wrinkling.

The classification process is a partnership between a bioligst and a software developer. 

#### Biologist

* Get the full set of images to classify
* Manually classifies a subset of images for model training
* Reviews classification produced by model
* Further manual classification of images classified prior

#### Developer

* Comes up with data strucutures and file formats for manual classification
* Develops way to easily share images, training classifications, and final results
* Writes code to execute model
* Executes model to produce classification
* Builds tools for Biologist to easily review output of model
