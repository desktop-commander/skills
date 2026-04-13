# Common High-Memory Processes Reference

## Web Browsers

### Google Chrome (chrome.exe)
- **Typical RAM**: 500MB - 2GB+
- **Why high**: Each tab runs as separate process
- **Solutions**:
  - Enable Memory Saver: Settings → Performance → Memory Saver
  - Use tab suspenders like "Auto Tab Discard"
  - Close unused tabs
  - Remove unnecessary extensions

### Microsoft Edge (msedge.exe)
- **Typical RAM**: 300MB - 1.5GB
- **Why high**: Similar to Chrome architecture
- **Solutions**:
  - Enable Sleeping Tabs: Settings → System → Sleeping tabs
  - Set tabs to sleep after 5-10 minutes of inactivity

### Firefox (firefox.exe)
- **Typical RAM**: 400MB - 1.2GB
- **Why high**: Content processes
- **Solutions**:
  - about:memory → "Minimize memory usage"
  - Reduce content process count in settings

## Communication Apps

### Discord (Discord.exe)
- **Typical RAM**: 200MB - 600MB
- **Why high**: Electron-based, runs multiple processes
- **Solutions**: Close when not actively using

### Microsoft Teams (Teams.exe)
- **Typical RAM**: 300MB - 800MB
- **Why high**: Electron-based, heavy background sync
- **Solutions**: 
  - Use web version occasionally
  - Disable "auto-start application"

### Zoom (Zoom.exe)
- **Typical RAM**: 150MB - 400MB
- **Why high**: Video processing
- **Solutions**: Close when not in meetings

## Gaming Platforms

### Steam (Steam.exe)
- **Typical RAM**: 100MB - 400MB
- **Why high**: Background updates, library sync
- **Solutions**: Close when not gaming

### Epic Games Launcher (EpicGamesLauncher.exe)
- **Typical RAM**: 150MB - 500MB
- **Why high**: Background services
- **Solutions**: Close when not gaming

## Cloud Storage

### OneDrive (OneDrive.exe)
- **Typical RAM**: 100MB - 300MB
- **Why high**: File syncing, thumbnail generation
- **Solutions**:
  - Pause sync when not needed
  - Selective sync for large folders

### Dropbox (Dropbox.exe)
- **Typical RAM**: 80MB - 250MB
- **Why high**: File monitoring and sync
- **Solutions**: Pause sync when not needed

## Development Tools

### Node.js (node.exe)
- **Typical RAM**: 50MB - 500MB+
- **Why high**: Running servers, build processes
- **Solutions**: Stop dev servers when not coding

### Java (java.exe / javaw.exe)
- **Typical RAM**: 100MB - 1GB+
- **Why high**: JVM memory allocation
- **Solutions**: Close if no Java app running

## Adobe Applications

### Photoshop (Photoshop.exe)
- **Typical RAM**: 500MB - 2GB+
- **Why high**: Image processing, cache
- **Solutions**: Close when done editing

### Illustrator (Illustrator.exe)
- **Typical RAM**: 300MB - 1GB+
- **Why high**: Vector processing
- **Solutions**: Close when done designing

## Memory Leak Indicators

Signs a process has a memory leak:
1. RAM usage constantly increases over time
2. Process uses more RAM than expected for its function
3. Restarting the process significantly reduces RAM

Common memory leak culprits:
- Browser extensions
- Third-party utilities
- Antivirus software
- Driver utilities

## Windows System Processes

### svchost.exe
- **Normal**: Multiple instances, 50MB-200MB each
- **Warning**: Single instance over 500MB
- **Action**: Check services.msc for problematic services

### RuntimeBroker.exe
- **Normal**: 10MB-50MB
- **Warning**: Over 200MB
- **Action**: Usually related to Microsoft Store apps

### SearchIndexer.exe
- **Normal**: 50MB-150MB
- **Warning**: Over 300MB
- **Action**: Rebuild search index if excessive
