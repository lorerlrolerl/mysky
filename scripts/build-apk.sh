#!/bin/bash

# Backward-compatible script: default to release build
DIR="$(dirname "$0")"
exec "$DIR/build-apk-release.sh"
