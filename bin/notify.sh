#!/bin/bash
# Agent completion notification — macOS
# Usage: bin/notify.sh ["optional message"]

MESSAGE="${1:-Agent zakończył pracę}"
VOLUME="10"  # 1.0 = normal, 5.0 = loud, 10.0 = max

# macOS notification (visual)
osascript -e "display notification \"$MESSAGE\" with title \"🤖 Kiro\"" 2>/dev/null

# Sound (with volume control)
afplay -v "$VOLUME" /System/Library/Sounds/Ping.aiff 2>/dev/null &

# Terminal bell as fallback
printf '\a'
