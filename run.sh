#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env if present
if [[ -f .env ]]; then
	set -o allexport
	source .env
	set +o allexport
fi

if [[ "${1:-}" == "--prod" ]]; then
	if [[ ! -d build ]]; then
		echo "No build/ directory found. Run: npm run build" >&2
		exit 1
	fi
	exec node build/index.js
else
	exec npm run dev
fi
