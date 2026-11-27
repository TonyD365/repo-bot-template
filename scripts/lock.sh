#!/bin/sh
# Regenerate the hash-pinned requirement files CI installs from (needs uv). Run it after
# changing requirements/*.in; Dependabot keeps the .txt files up to date afterwards.
set -eu
cd "$(dirname "$0")/../requirements"
for name in dev audit; do
  uv pip compile --quiet --universal --python-version 3.10 --generate-hashes "$name.in" -o "$name.txt"
done
