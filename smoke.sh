#!/bin/bash

echo "Running Smoke Test..."

# test route /
if curl -s localhost:3000 | grep "API OK" > /dev/null; then
  echo "Root endpoint OK"
else
  echo "Root endpoint FAILED"
  exit 1
fi

# test weather API
if curl -s localhost:3000/weather | grep "temperature" > /dev/null; then
  echo "Weather endpoint OK"
else
  echo "Weather endpoint FAILED"
  exit 1
fi

echo "Smoke test passed"
exit 0
