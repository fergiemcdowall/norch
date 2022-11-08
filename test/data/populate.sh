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
# curl -H "Content-Type: application/json" --data @data.json http://localhost:3030
