#!/usr/bin/env sh

# check if data directory exists
if [ ! -d "data" ]; then
  mkdir data
else
  rm  data/rounds.json
  rm  data/squads.json
fi
curl 'https://fantasy.efl.com/json/fantasy/rounds.json' \
  -H 'accept: application/json' \
  -H 'user-agent: Joel wants football scores' --output data/rounds.json.gz && gunzip data/rounds.json.gz
curl 'https://fantasy.efl.com/json/fantasy/squads.json' \
  -H 'accept: application/json' \
  -H 'user-agent: Joel wants football scores' --output data/squads.json.gz && gunzip data/squads.json.gz