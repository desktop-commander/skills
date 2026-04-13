---
name: pc-ram-analyzer
description: Analyzes PC RAM usage, identifies unnecessary background programs causing high memory consumption, and provides cleanup recommendations. Use when user asks to check RAM usage, find memory-hogging programs, optimize PC performance, fix high RAM usage, or clean up background processes. Supports both analysis-only and cleanup modes.
version: 1.0.0
---

# PC RAM Analyzer

Analyzes Windows PC memory usage, identifies unnecessary background processes consuming RAM, and provides automated cleanup to free memory.

## When to Use

- User reports high RAM usage or slow PC performance
- User wants to see what programs are using memory
- User wants to close unnecessary applications to free RAM
- User asks to optimize PC performance or clean up memory
- User suspects memory leaks or problematic processes

## Workflow

### Step 1: Run RAM Analysis

Execute the analysis script to get a complete memory report:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\isaha\.desktop-commander\skills\pc-ram-analyzer\scripts\analyze-ram.ps1"
```

This shows:
- Total RAM usage percentage
- Top 30 processes by memory consumption
- Known resource-heavy applications
- Not responding (hung) processes
- Memory health information
- Recommendations

### Step 2: Review Results

Check the analysis output for:
- Processes using more than 500MB RAM (marked in red)
- Known unnecessary applications (Chrome, Discord, Steam, etc.)
- Not responding processes that should be closed
- Overall RAM usage percentage

### Step 3: Optional - Run Cleanup

If user wants to free RAM, run the cleanup script:

**Preview mode** (shows what would be closed without closing):
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\isaha\.desktop-commander\skills\pc-ram-analyzer\scripts\cleanup-ram.ps1" -ListOnly
```

**Execute cleanup** (closes safe-to-close applications):
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\isaha\.desktop-commander\skills\pc-ram-analyzer\scripts\cleanup-ram.ps1" -Force
```

Cleanup performs:
- Clears temporary files
- Stops unnecessary applications (browsers, gaming platforms, communication apps)
- Optimizes memory for non-critical processes
- Clears DNS cache
- Reports freed RAM

### Step 4: Report Results

Share with user:
- Current RAM usage before and after
- List of processes that were closed
- Amount of RAM freed
- Any recommendations for long-term improvement

## Scripts

- [analyze-ram.ps1](scripts/analyze-ram.ps1) - Full RAM analysis and reporting
- [cleanup-ram.ps1](scripts/cleanup-ram.ps1) - Automated cleanup and optimization

## References

- [Common High-Memory Processes](references/common-processes.md) - Reference for identifying problematic applications and their solutions

## Safety Notes

- The cleanup script NEVER closes critical Windows system processes
- Browser tabs and documents may be lost if not saved - warn user before force cleanup
- Always offer ListOnly mode first so user can see what will be closed
- User can exclude specific applications from cleanup by modifying the safeToClose array
