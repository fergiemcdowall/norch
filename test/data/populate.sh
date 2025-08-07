#!/bin/zsh

while getopts d:s: flag
do
    case "${flag}" in
        d) datafile=${OPTARG};;
        s) serverroot=${OPTARG};;
    esac
done

curl -H "Content-Type: application/json" --data @$datafile $serverroot/PUT

# for example:
# ./populate.sh -d "./MOCK_DATA_1.json" -s "http://localhost:3030"
