#!/usr/bin/env bash
# cleanup-attached-assets.sh

# Variables par défaut
DRY_RUN=false
VERBOSE=false
TARGET="attached_assets"

# Affiche l’usage
usage() {
  echo "Usage : $(basename "$0") [-n|--dry-run] [-v|--verbose] [-h|--help]"
  echo "  -n, --dry-run   Affiche ce qui serait supprimé, sans rien toucher"
  echo "  -v, --verbose   Affiche les étapes détaillées"
  echo "  -h, --help      Affiche cette aide"
  exit 1
}

# Parse des arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run)   DRY_RUN=true; shift ;;
    -v|--verbose)   VERBOSE=true; shift ;;
    -h|--help)      usage ;;
    *)              echo "Argument inconnu : $1"; usage ;;
  esac
done

log() {
  $VERBOSE && echo "[INFO] $*"
}

# Vérification de l’existence
if [[ ! -d "$TARGET" ]]; then
  echo "[ERROR] Répertoire '$TARGET' introuvable."
  exit 1
fi

# Action
if $DRY_RUN; then
  log "Mode dry-run : voici le contenu de '$TARGET' qui serait supprimé :"
  find "$TARGET" -maxdepth 1 | sed 's|^|  |'
  log "(Aucune suppression effectuée)"
else
  log "Suppression de '$TARGET'…"
  rm -rf "$TARGET"
  log "Terminé : '$TARGET' a été supprimé."
fi

