#!/usr/bin/env bash
# CI-only dependencies from authenticated Ubuntu archives. Unrelated preloaded
# vendor feeds must not prevent installing the project's Linux test tools.
set -euo pipefail
if [[ ${GITHUB_ACTIONS:-} != true ]]; then
  echo 'This installer is for ephemeral GitHub Actions runners only.' >&2
  exit 2
fi
. /etc/os-release
if [[ $ID != ubuntu || $VERSION_ID != 22.04 || $# == 0 ]]; then
  echo 'Ubuntu 22.04 and explicit test-tool packages are required.' >&2
  exit 2
fi
for package in "$@"; do
  case "$package" in bubblewrap|desktop-file-utils|libglib2.0-bin) ;; *) echo 'Unsupported test-tool package.' >&2; exit 2 ;; esac
done
keyring=/usr/share/keyrings/ubuntu-archive-keyring.gpg
[[ -r $keyring ]]
apt_dir=$(mktemp -d)
trap 'rm -rf -- "$apt_dir"' EXIT
mkdir "$apt_dir/parts"
printf '%s\n' \
  "deb [signed-by=$keyring] https://archive.ubuntu.com/ubuntu jammy main universe" \
  "deb [signed-by=$keyring] https://archive.ubuntu.com/ubuntu jammy-updates main universe" \
  "deb [signed-by=$keyring] https://security.ubuntu.com/ubuntu jammy-security main universe" > "$apt_dir/sources.list"
apt_options=(-o "Dir::Etc::sourcelist=$apt_dir/sources.list" -o "Dir::Etc::sourceparts=$apt_dir/parts")
sudo apt-get "${apt_options[@]}" update -qq
sudo apt-get "${apt_options[@]}" install -y --no-install-recommends "$@"
