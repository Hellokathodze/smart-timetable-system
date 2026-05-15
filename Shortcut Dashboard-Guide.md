# Service Dashboard Guide

## Smart Timetable System

---

## What Is The Dashboard?

The Service Dashboard is a one-click tool to **start, stop, and monitor** all three services in your project:

| # | Service | Tech | Port | What It Does |
|---|---------|------|------|-------------|
| 1 | AI Engine | FastAPI + Uvicorn | `localhost:5000` | Genetic algorithm timetable generation |
| 2 | React Frontend | Vite + React | `localhost:5173` | The web UI you see in the browser |
| 3 | Spring Boot | Java + Maven | `localhost:8081` | Backend API, auth, MongoDB |

---

## How To Launch The Dashboard

### Option A: From File Explorer (Recommended)

1. Open **File Explorer**
2. Navigate to: `C:\Users\mange\Desktop\Mini Project\smart-timetable-system`
3. **Double-click `Dashboard.bat`**

> **Tip:** Right-click `Dashboard.bat` → **Send to → Desktop (create shortcut)** for one-click access from your desktop.

### Option B: From VS Code Terminal

```powershell
cd "C:\Users\mange\Desktop\Mini Project\smart-timetable-system"
.\Dashboard.bat
```

---

## Dashboard Controls

When the dashboard opens, you'll see:

```
  =======================================================
      SMART TIMETABLE SYSTEM  -  Service Dashboard
  =======================================================

   [1]  [*] AI Engine           ON   http://localhost:5000
   [2]  [*] React Frontend      ON   http://localhost:5173
   [3]  [ ] Spring Boot         OFF  ---

  -------------------------------------------------------
   [A] Start ALL          [S] Stop ALL
   [R] Refresh            [Q] Quit
  -------------------------------------------------------
```

### Controls Reference

| Key | Action | Description |
|-----|--------|-------------|
| `1` | Toggle AI Engine | Starts it if OFF, stops it if ON |
| `2` | Toggle React Frontend | Starts it if OFF, stops it if ON |
| `3` | Toggle Spring Boot | Starts it if OFF, stops it if ON |
| `A` | Start ALL | Launches all three services at once |
| `S` | Stop ALL | Kills all three services at once |
| `R` | Refresh | Re-checks which services are running |
| `Q` | Quit | Closes the dashboard (services keep running) |

---

## Typical Workflow

### Starting Your Day

1. Double-click `Dashboard.bat`
2. Press `A` to start all services
3. Wait ~15 seconds for everything to boot
4. Press `R` to refresh — all three should show `ON`
5. Open `http://localhost:5173` in your browser
6. Start coding!

### Stopping Everything

1. In the dashboard, press `S`
2. All three services will stop
3. Press `Q` to close the dashboard

### Restarting A Single Service

If the AI Engine is acting up:
1. Press `1` to stop it
2. Press `R` to confirm it's `OFF`
3. Press `1` again to start it fresh
4. Press `R` to confirm it's `ON`

---

## How It Works Behind The Scenes

When you press a number to start a service, the dashboard opens a **new terminal window** (cmd.exe) for that service. Each window has a title:

| Service | Window Title |
|---------|-------------|
| AI Engine | `AI-ENGINE` |
| React Frontend | `REACT-FRONTEND` |
| Spring Boot | `SPRING-BOOT` |

These windows run independently. You can minimize them but **don't close them** — that would kill the service.

When you stop a service, the dashboard finds the process by its port number and kills it along with all child processes.

---

## Important Notes

### Quitting The Dashboard Doesn't Stop Services

Pressing `Q` only closes the dashboard UI. Your services **keep running** in their terminal windows. To stop services, press `S` first, then `Q`.

### Services Started Outside The Dashboard

The dashboard detects services by **port**, not by how they were started. So if you start Spring Boot from VS Code's debug button, the dashboard will still detect it as `ON` and can stop it.

### Port Conflicts

If a service won't start, something else might be using its port. Check with:

```powershell
netstat -ano | Select-String ":5000\s" | Select-String "LISTENING"
netstat -ano | Select-String ":5173\s" | Select-String "LISTENING"
netstat -ano | Select-String ":8081\s" | Select-String "LISTENING"
```

Kill a stuck process with (run as Admin if needed):

```powershell
taskkill /PID <PID_NUMBER> /T /F
```

### Spring Boot Shows 401 In Browser

This is **normal**. `localhost:8081` is a secured API — it returns "Unauthorized" without a JWT token. The React frontend at `localhost:5173` handles authentication and talks to Spring Boot behind the scenes.

---

## Files

| File | Purpose | Location |
|------|---------|----------|
| `Dashboard.bat` | Double-click launcher | Project root |
| `dashboard.ps1` | The actual dashboard script | Project root |

Both files must stay in the **project root** (`smart-timetable-system/`) next to the `smarttimetablesystem` and `smart-timetable-frontend` folders.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Dashboard shows `OFF` but service is running | Press `R` to refresh. Service may have started on a different port. |
| "Access denied" when stopping a service | Open PowerShell as **Administrator** and run: `taskkill /PID <number> /T /F` |
| Service won't start — port busy | Run `netstat -ano \| Select-String ":<port>\s"` to find the PID, then kill it |
| React opens on 5174 instead of 5173 | Something is on 5173. Stop all services (`S`), wait 5 seconds, start again (`A`). |
| Spring Boot takes too long | Normal — Java/Maven cold start takes 15-30 seconds. Press `R` to check. |
| Dashboard.bat does nothing | Make sure `dashboard.ps1` is in the **same folder** as `Dashboard.bat` |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│         SERVICE DASHBOARD CHEAT SHEET       │
├─────────────────────────────────────────────┤
│  Launch:  Double-click Dashboard.bat        │
│                                             │
│  1 = Toggle AI Engine      (port 5000)      │
│  2 = Toggle React Frontend (port 5173)      │
│  3 = Toggle Spring Boot    (port 8081)      │
│  A = Start ALL                              │
│  S = Stop ALL                               │
│  R = Refresh status                         │
│  Q = Quit dashboard                         │
│                                             │
│  Your app: http://localhost:5173            │
└─────────────────────────────────────────────┘
```
