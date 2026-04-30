---
name: pokemon-go-catcher
description: Automates the user's local Pokemon GO catch workflow through the connected scrcpy and adb device. This skill should be used when the user wants the assistant to tap into encounters, throw Pokeballs with the known working gesture, and clear post-catch dialogs back to the map on this Windows machine.
version: 1.0.0
---

# Pokemon GO Catcher

Automate the live catch loop for this machine's current Pokemon GO setup. Use the pinned adb serial, the known working throw gesture, and a cleanup sequence that starts with the bottom arrow so the game returns to the map reliably.

## When to Use

Use this skill when the user asks to catch Pokemon in the open scrcpy window, continue throwing balls, clear catch dialogs, or return the game to the map after a catch.

## Workflow

1. Confirm the phone is reachable on the pinned adb serial and do not switch devices unless the user says the target changed.
2. Capture the current state before acting. Prefer a desktop screenshot when the user asks what is on screen, and prefer `adb screencap` when the state of the phone display matters.
3. If the game is on the overworld map, tap the target spawn or the center of an active encounter before throwing.
4. Use the known working throw gesture from [ADB Catch Commands](references/adb-catch-commands.md). Prefer one bundled shell command with sleeps between throws instead of parallel adb launches.
5. After each catch, run cleanup starting with the bottom arrow, then continue through the rest of the dialog dismissal sequence until the game is back on the map.
6. Verify state with a fresh screenshot after cleanup or after a batch of throws. If the game is still in a menu, use the recovery notes in the reference file.
7. When the user says `proceed` or `again`, continue from the current state instead of restarting the whole setup.

## References

- [ADB Catch Commands](references/adb-catch-commands.md) - Exact commands, coordinates, throw batch, cleanup, and recovery sequence for this setup.
