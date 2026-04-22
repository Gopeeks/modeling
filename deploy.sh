#!/bin/bash
# Push current changes to GitHub (live site)
# Usage: ./deploy.sh "your commit message"

MSG="${1:-Update site}"

git add -A
git commit -m "$MSG"
git push origin main

echo ""
echo "  Deployed! Live at https://gopeeks.github.io/modeling/"
echo "  (GitHub Pages may take 1-2 min to update)"
