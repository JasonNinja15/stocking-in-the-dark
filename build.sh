#!/usr/bin/env bash
# Builds stocking-in-the-dark.html (the single file you play) from src/: shell.html plus the numbered JS parts.
cd "$(dirname "$0")"
{
  sed -n '1,/\/\*GAME\*\//p' src/shell.html | sed '$d'
  cat src/0*.js
  sed -n '/\/\*GAME\*\//,$p' src/shell.html | sed '1d'
} > stocking-in-the-dark.html
cp stocking-in-the-dark.html index.html  # GitHub Pages serves index.html
echo "built stocking-in-the-dark.html ($(wc -c < stocking-in-the-dark.html) bytes)"
