#!/bin/bash
# macOS: 이 파일을 더블클릭하면 KluZTD 가 브라우저로 열립니다.
cd "$(dirname "$0")"

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:$PATH"

if ! command -v pnpm >/dev/null 2>&1 && ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "KluZTD" message "Node.js / pnpm 이 필요합니다.\n터미널에서 pnpm install 후 다시 실행하세요."'
  exit 1
fi

PKG=pnpm
command -v pnpm >/dev/null 2>&1 || PKG=npm

if [ ! -d node_modules ]; then
  echo "의존성 설치 중…"
  $PKG install || exit 1
fi

if [ ! -f dist/index.html ]; then
  echo "빌드 중…"
  $PKG run build || exit 1
fi

echo "KluZTD 실행 → http://localhost:4273"
$PKG run preview
