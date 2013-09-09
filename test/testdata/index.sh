#!/bin/bash

FILTERFLAG=" --form filterOn=places,topics,organisations"

for OUTPUT in $(ls *.json)
do
    curl --form document=@$OUTPUT http://localhost:3000/indexer $FILTERFLAG
done
