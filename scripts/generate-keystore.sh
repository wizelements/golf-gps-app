#!/bin/bash
#
# Generate Android signing keystore for release builds
# Run this locally, then add the base64 output to GitHub Secrets
#

set -e

KEYSTORE_NAME="golf-gps-release.jks"
KEY_ALIAS="golf-gps-key"
VALIDITY_DAYS=10000

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Android Keystore Generator"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check for keytool
if ! command -v keytool &> /dev/null; then
    echo "Error: keytool not found. Install Java JDK first."
    exit 1
fi

# Generate keystore
echo "Generating keystore: $KEYSTORE_NAME"
echo ""

keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_NAME" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_DAYS \
    -alias "$KEY_ALIAS" \
    -dname "CN=Golf GPS, OU=Mobile, O=Developer, L=City, ST=State, C=US"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Keystore generated: $KEYSTORE_NAME"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "To use with GitHub Actions, add these secrets to your repo:"
echo ""
echo "1. KEYSTORE_BASE64:"
echo "   Run: base64 -w 0 $KEYSTORE_NAME"
echo "   Copy the output and add as secret"
echo ""
echo "2. KEYSTORE_PASSWORD: (password you entered above)"
echo ""
echo "3. KEY_ALIAS: $KEY_ALIAS"
echo ""
echo "4. KEY_PASSWORD: (password you entered above)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Show base64 for convenience
echo "Base64 encoded keystore (copy this for KEYSTORE_BASE64 secret):"
echo ""
base64 -w 0 "$KEYSTORE_NAME"
echo ""
echo ""
