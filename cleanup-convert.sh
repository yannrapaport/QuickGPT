#!/usr/bin/env bash
# cleanup-convert.sh

set -e

DRY_RUN=false
VERBOSE=false
SCRIPTS_PATTERN="convert-*.js"
DEPS=("sharp" "svg-to-png")

usage(){
  echo "Usage: $(basename "$0") [-n|--dry-run] [-v|--verbose] [-h|--help]"
  echo "  -n, --dry-run   Liste ce qui serait supprimé sans rien toucher"
  echo "  -v, --verbose   Affiche les étapes en détail"
  echo "  -h, --help      Affiche cette aide"
  exit 1
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run)   DRY_RUN=true; shift ;;
    -v|--verbose)   VERBOSE=true; shift ;;
    -h|--help)      usage ;;
    *)              echo "Argument inconnu : $1"; usage ;;
  esac
done

log(){ $VERBOSE && echo "[INFO] $*"; }

# 1) Liste ou suppression des fichiers
FILES=( $SCRIPTS_PATTERN )
if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "[WARN] Aucun fichier '$SCRIPTS_PATTERN' trouvé."
else
  if $DRY_RUN; then
    log "Mode dry-run : fichiers qui seraient supprimés :"
    for f in "${FILES[@]}"; do echo "  $f"; done
  else
    log "Suppression des fichiers :"
    rm -v ${VERBOSE:+-v} "${FILES[@]}"
  fi
fi

# 2) Liste ou désinstallation des dépendances
if $DRY_RUN; then
  log "Mode dry-run : les dépendances suivantes seraient désinstallées :"
  for pkg in "${DEPS[@]}"; do echo "  $pkg"; done
else
  log "Désinstallation des dépendances : ${DEPS[*]}"
  npm uninstall ${DEPS[*]}
fi

log "Terminé."
