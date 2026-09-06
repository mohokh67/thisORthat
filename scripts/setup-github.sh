#!/usr/bin/env bash
#
# One-time GitHub setup for deploys:
#   1. stores the Supabase URL + anon key as repository secrets
#   2. points GitHub Pages at the Actions workflow
#
# Requires an authenticated `gh` CLI, run from inside the repo.
set -euo pipefail

if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

read -rp "Supabase project URL (https://xxxx.supabase.co): " SUPABASE_URL
read -rsp "Supabase anon key: " SUPABASE_ANON_KEY
echo

gh secret set VITE_SUPABASE_URL --body "$SUPABASE_URL"
gh secret set VITE_SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY"
echo "Secrets set."

if gh api repos/{owner}/{repo}/pages >/dev/null 2>&1; then
  gh api --method PUT repos/{owner}/{repo}/pages -f build_type=workflow >/dev/null
  echo "Pages build source set to GitHub Actions."
else
  gh api --method POST repos/{owner}/{repo}/pages -f build_type=workflow >/dev/null
  echo "Pages enabled with GitHub Actions as the build source."
fi

echo "Done. Push to main or re-run the \"Deploy to GitHub Pages\" workflow to publish."
