#!/usr/bin/env bash
# Cài Agent Meeting vào menu ứng dụng Linux (không cần quyền root).
set -e
command -v node >/dev/null || { echo "Cần Node.js 18+ (https://nodejs.org)"; exit 1; }
SRC="$(cd "$(dirname "$0")/.." && pwd)"
APP="$HOME/.local/share/agent-meeting"
mkdir -p "$APP" "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/scalable/apps"
cp -r "$SRC/bin" "$SRC/src" "$SRC/package.json" "$APP/"
cp "$SRC/assets/icon.svg" "$HOME/.local/share/icons/hicolor/scalable/apps/agent-meeting.svg"
cat > "$HOME/.local/share/applications/agent-meeting.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=Agent Meeting
Comment=Phòng họp cho nhiều AI agent
Exec=$(command -v node) $APP/bin/cli.js
Icon=agent-meeting
Terminal=true
Categories=Network;
DESK
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
echo "Đã cài. Tìm 'Agent Meeting' trong menu ứng dụng (có thể cần đăng xuất/đăng nhập lại nếu chưa thấy)."
