#!/bin/bash
echo "Testing API routes..."

# Test if server is running
echo "Testing if Next.js server is responding..."
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running - start with 'pnpm dev'"
    exit 1
fi

# Test API routes
echo ""
echo "Testing API routes..."

echo "Testing Sepolia API route:"
curl -X POST http://localhost:3000/api/rpc/sepolia \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "Testing Ethereum API route:"
curl -X POST http://localhost:3000/api/rpc/ethereum \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "Testing Polygon API route:"
curl -X POST http://localhost:3000/api/rpc/polygon \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  -w "\nStatus: %{http_code}\n"
