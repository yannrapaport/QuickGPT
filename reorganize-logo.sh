#!/usr/bin/env bash
# reorganize-logo.sh
set -euo pipefail

DRY_RUN=false
VERBOSE=false
LOGO="quickgpt-logo-transparent.png"
DEST="assets/images"
HTML="index.html"

usage() {
  echo "Usage : $(basename "$0") [-n|--dry-run] [-v|--verbose] [-h|--help]"
  echo "  -n, --dry-run   Affiche les opérations sans les exécuter"
  echo "  -v, --verbose   Affiche les étapes en détail"
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

# Vérifications
if [[ ! -f "$LOGO" ]]; then
  echo "[ERROR] Fichier logo introuvable : $LOGO"
  exit 1
fi
if [[ ! -f "$HTML" ]]; then
  echo "[ERROR] Fichier HTML introuvable : $HTML"
  exit 1
fi

# 1) dry-run : affichage
if $DRY_RUN; then
  log "Mode dry-run :"
  echo "  • Créer le dossier : $DEST"
  echo "  • Déplacer $LOGO → $DEST/$LOGO"
  echo "  • Mettre à jour les références dans $HTML :"
  echo "      src=\"$LOGO\" → src=\"$DEST/$LOGO\""
  exit 0
fi

# 2) exécution réelle
log "Création du dossier $DEST (s’il n’existe pas)…"
mkdir -p "$DEST"

log "Déplacement de $LOGO → $DEST/$LOGO…"
mv "$LOGO" "$DEST/"

log "Mise à jour des références dans $HTML…"
# On crée un backup temporaire, puis on le supprime
sed -i.bak 's|src="'"$LOGO"'"|src="'"$DEST/$LOGO"'"|g' "$HTML"
rm "${HTML}.bak"

echo "→ Logo centralisé dans $DEST et chemins mis à jour."
