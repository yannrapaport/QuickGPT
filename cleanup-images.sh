#!/usr/bin/env bash
# cleanup-images.sh
set -euo pipefail

DRY_RUN=false
VERBOSE=false

usage() {
  echo "Usage : $(basename "$0") [-n|--dry-run] [-v|--verbose] [-h|--help]"
  echo "  -n, --dry-run   Liste les images inutilisées sans les supprimer"
  echo "  -v, --verbose   Affiche les images utilisées et inutilisées"
  echo "  -h, --help      Affiche cette aide"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run)   DRY_RUN=true; shift ;;
    -v|--verbose)   VERBOSE=true; shift ;;
    -h|--help)      usage ;;
    *)              echo "Argument inconnu : $1"; usage ;;
  esac
done

log() { $VERBOSE && echo "[INFO] $*"; }

# 1) Récupérer toutes les images (png/jpg/jpeg/svg), en excluant .git et node_modules
mapfile -t images < <(
  find . \
    \( -path './.git' -o -path './node_modules' \) -prune \
    -o \( -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.svg' \) -print \)
)

if [[ ${#images[@]} -eq 0 ]]; then
  echo "[WARN] Aucune image trouvée."
  exit 0
fi

unused=()
for img in "${images[@]}"; do
  name=$(basename "$img")
  if grep -R --exclude-dir={.git,node_modules} -q "$name" .; then
    log "Utilisée  : $img"
  else
    log "Inutilisée: $img"
    unused+=("$img")
  fi
done

if [[ ${#unused[@]} -eq 0 ]]; then
  echo "Aucune image inutile détectée."
  exit 0
fi

# 2) Dry-run ou suppression réelle
if $DRY_RUN; then
  echo "[DRY-RUN] Images inutilisées :"
  for f in "${unused[@]}"; do echo "  $f"; done
  echo "(Aucune suppression effectuée)"
else
  echo "Suppression des images inutilisées :"
  for f in "${unused[@]}"; do
    rm -v ${VERBOSE:+-v} "$f"
  done
  echo "Terminé."
fi
