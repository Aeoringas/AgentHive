#!/bin/bash
trap 'kill 0' EXIT

cd "$(dirname "$0")/.."

npm run dev:server &
npm run dev:client &

wait
