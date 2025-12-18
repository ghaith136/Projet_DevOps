#!/bin/bash
echo "🧪 Smoke test..."

# Test endpoint racine
if curl -s http://localhost:3000 | grep -q "API Météo"; then
  echo "✅ / : PASS"
else
  echo "❌ / : FAIL"
  exit 1
fi

# Test santé
if curl -s http://localhost:3000/health | grep -q "healthy"; then
  echo "✅ /health : PASS"
else
  echo "❌ /health : FAIL"
  exit 1
fi

echo "✅ Smoke test réussi"
