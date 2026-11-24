#!/bin/bash
# Assemble the single-page guide from its parts.
set -e
cd "$(dirname "$0")"
out=../index.html
{
  cat head.html
  echo "<style>"; cat style.css; echo "</style>"
  cat shell-top.html
  cat content/m1.html content/m2.html content/m3.html content/m4.html content/cheatsheet.html content/mocktest.html
  cat shell-bottom.html
  echo "<script>"; cat js/core.js js/m1.js js/m2.js js/m3.js js/m4.js; echo "</script>"
} > "$out"
echo "built $out ($(wc -c < "$out") bytes)"
