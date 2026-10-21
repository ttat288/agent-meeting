#!/usr/bin/env bash
# Compatibility entry point; the Node installer owns the cross-platform workflow.
set -euo pipefail
command -v node >/dev/null || { echo "Cần Node.js 18+ (https://nodejs.org)"; exit 1; }
AM_INSTALL_SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$AM_INSTALL_SOURCE/bin/cli.js" install "$@"
