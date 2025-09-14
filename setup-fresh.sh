#!/bin/bash

echo "🔄 Fresh VS Code setup (clean + login)..."
echo "========================================"
echo ""

# Clean first
echo "Step 1: Cleaning existing state..."
./setup-clean.sh

echo ""
echo "Step 2: Setting up fresh login session..."
echo ""

# Then setup login
./setup-login.sh

echo ""
echo "Step 3: Verifying setup..."
echo ""

# Finally verify
./setup-verify.sh
