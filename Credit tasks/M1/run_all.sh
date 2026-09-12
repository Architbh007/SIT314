#!/bin/bash

mkdir -p logs

areas=("Mallee" "Wimmera" "Northern Country" "North Central" "North East" "Central" "East Gippsland" "South West" "West and South Gippsland")

for area in "${areas[@]}"; do
    node temperature_node.js "$area" > "logs/temp_${area// /_}.log" 2>&1 &
    node rain_node.js "$area" > "logs/rain_${area// /_}.log" 2>&1 &
    node wind_node.js "$area" > "logs/wind_${area// /_}.log" 2>&1 &
    node fire_node.js "$area" > "logs/fire_${area// /_}.log" 2>&1 &
done

echo "Started sensor nodes for ${#areas[@]} areas."