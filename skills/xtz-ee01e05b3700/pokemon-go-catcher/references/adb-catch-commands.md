# ADB Catch Commands

## Device

Use this pinned serial for all commands on this machine unless the user says it changed:

`adb-RFCW402J18M-11Za0Y._adb-tls-connect._tcp`

## Confirm Device

`adb -s adb-RFCW402J18M-11Za0Y._adb-tls-connect._tcp devices`

## Capture Phone Screen

`adb -s adb-RFCW402J18M-11Za0Y._adb-tls-connect._tcp exec-out screencap -p > C:\Users\CHANN0$\AppData\Local\Temp\pokemon-current.png`

## Encounter Focus Tap

Use this when the encounter is open but needs a center tap before the throw:

`adb -s adb-RFCW402J18M-11Za0Y._adb-tls-connect._tcp shell input tap 540 1180`

## Single Working Throw

This is the working throw path for this setup:

`adb -s adb-RFCW402J18M-11Za0Y._adb-tls-connect._tcp shell "input motionevent DOWN 540 1960; input motionevent MOVE 540 1450; input motionevent UP 540 980"`

## Fast Throw Batch

Use one bundled command with sleeps instead of launching multiple adb gestures in parallel:

`adb -s adb-RFCW402J18M-11Za0Y._adb-tls-connect._tcp shell "input tap 540 1180; input motionevent DOWN 540 1960; input motionevent MOVE 540 1450; input motionevent UP 540 980; sleep 2; input motionevent DOWN 540 1960; input motionevent MOVE 540 1450; input motionevent UP 540 980; sleep 2; input motionevent DOWN 540 1960; input motionevent MOVE 540 1450; input motionevent UP 540 980"`

## Post-Catch Cleanup

Always start with the bottom arrow because some result and menu screens stay open otherwise:

`adb -s adb-RFCW402J18M-11Za0Y._adb-tls-connect._tcp shell "input tap 540 2220; sleep 1; input tap 540 2220; sleep 1; input tap 540 1760; sleep 1; input tap 980 170; sleep 1; input keyevent 4; sleep 1; input tap 540 1760"`

## Recovery

- If a menu is still open after cleanup, repeat the bottom-arrow tap first.
- If the game is still not back on the map, send `input keyevent 4` once and recapture.
- Avoid parallel adb gesture launches because overlapping touches break the throw path.
- Prefer a fresh screenshot after each recovery attempt before sending more throws.
