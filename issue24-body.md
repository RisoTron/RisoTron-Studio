## Acceptance Criteria

### For macOS
- **Given** the app is running on macOS
- **Then** I see the App Name menu (About, Hide, Quit) followed by File, Edit, View, Window, Help menus.
- **And** the App Name menu contains a "Preferences" item (`Cmd+,`).
- **And** the File menu contains a "New Project" item (`Cmd+N`).

### For Windows/Linux
- **Given** the app is running on Windows/Linux
- **Then** I see File, Edit, View, Window, Help menus.
- **And** the File menu contains a "New Project" item (`Ctrl+N`) and "Preferences" item (`Ctrl+,`).

### Standard Actions & Stubs
- **Given** I interact with the menus
- **When** I click standard roles (Cut, Copy, Paste, Undo, Redo, Zoom, Fullscreen, Reload, DevTools, Minimize, Close)
- **Then** they perform their default OS/Electron behaviors.
- **When** I click "New Project" or "Preferences"
- **Then** the main process sends an IPC event (`menu:new-project` or `menu:preferences`) to the renderer, which logs it to the console (stub for future US).

## Manual Testing Guide Requirement
- The implementation MUST include a Manual Testing Guide instructing the DEV on how to manually verify the menu renders correctly on the target OS, and that `Cmd/Ctrl+N` and `Cmd/Ctrl+,` trigger the expected console logs.

## Notes
- Must define IPC channels `menu:new-project` and `menu:preferences` in preload.
- Implementation should use Electron's built-in `role` system where possible to avoid accelerator conflicts.

**Parent Feature**: #8 [FEAT] App Lifecycle
