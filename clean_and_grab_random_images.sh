#!/usr/bin/env bash

rm images/training_images/*
rm images/training_images/{smooth,wrinkly,inbetween}/*

for i in $(find ./images/raw_data_set/* | sort -R | tail -n $1)
do
    cp $i ./images/training_images/
done
