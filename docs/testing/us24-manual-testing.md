# Manual Testing Guide: US 24 - Native OS Menus

## Overview
This guide describes how to manually test the Native OS menus implemented in User Story 24.
It is important to run the test on the specific OS you are verifying because Electron's menu behaviors differ structurally between macOS and Windows/Linux.

## Prerequisites
1. Ensure you have the `feat/electron-shell/native-menus` branch checked out.
2. Ensure you have run `npm install`.
3. Start the app via `npm run start`.

## macOS Testing Steps
1. **App Name Menu**: 
   - Click the application name (e.g., "RisoTron Studio") in the top left corner of the menu bar.
   - Verify it contains `About RisoTron Studio`, a separator, `Preferences...`, `Services`, `Hide`, `Hide Others`, `Show All`, and `Quit`.
2. **Preferences Shortcut**:
   - Press `Cmd+,`.
   - Look at the renderer process Developer Tools console.
   - Verify you see the log: `[STUB] "Preferences" menu item clicked`.
3. **File Menu**:
   - Click `File`.
   - Verify it contains `New Project` and `Close Window`.
4. **New Project Shortcut**:
   - Press `Cmd+N`.
   - Look at the renderer console.
   - Verify you see the log: `[STUB] "New Project" menu item clicked`.

## Windows/Linux Testing Steps
1. **File Menu**:
   - Click `File`.
   - Verify it contains `New Project`, a separator, `Preferences...`, another separator, and `Quit`.
2. **Shortcuts**:
   - Press `Ctrl+N`.
   - Verify the renderer console logs: `[STUB] "New Project" menu item clicked`.
   - Press `Ctrl+,`.
   - Verify the renderer console logs: `[STUB] "Preferences" menu item clicked`.

## Verifying Standard Roles
On any OS, test the standard menu roles to ensure they work as expected:
1. **Edit Menu**: Select `Edit > Copy` on some text, then `Edit > Paste`. Ensure it works via the menu and via `Cmd/Ctrl+C` and `Cmd/Ctrl+V`.
2. **View Menu**: Select `View > Toggle Full Screen` to test fullscreen behavior. Use `View > Toggle Developer Tools` to show/hide the console where your IPC logs will appear.
3. **Window Menu**: Test `Window > Minimize` to ensure the app minimizes correctly.
