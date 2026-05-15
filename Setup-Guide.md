# New Collaborator Setup Guide

## Smart Timetable System

---

## Prerequisites — Install These First

You need these installed on your **computer** before anything else:

| Program | Version | Download | Verify With |
|---------|---------|----------|-------------|
| Java JDK | **17** | [adoptium.net](https://adoptium.net) | `java -version` |
| Python | **3.12+** | [python.org](https://python.org) | `python --version` |
| Node.js | **18+** | [nodejs.org](https://nodejs.org) | `node --version` |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com) | — |

> **Important:** When installing Python, check **"Add Python to PATH"** during installation.

---

## Step 1: Install VS Code Extensions

Open VS Code → Extensions panel (`Ctrl+Shift+X`) → search and install these:

### Backend (Java / Spring Boot)

| Extension | Search ID |
|-----------|-----------|
| Extension Pack for Java | `vscjava.vscode-java-pack` |
| Spring Boot Extension Pack | `vmware.vscode-boot-dev-pack` |
| Lombok Annotations Support | `vscjava.vscode-lombok` |

### Frontend (React)

| Extension | Search ID |
|-----------|-----------|
| ES7+ React Snippets | `dsznajder.es7-react-js-snippets` |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` |
| Prettier | `esbenp.prettier-vscode` |

### AI Engine (Python)

| Extension | Search ID |
|-----------|-----------|
| Python | `ms-python.python` |
| Pylance | `ms-python.vscode-pylance` |

### Recommended (Optional but Helpful)

| Extension | Search ID | Why |
|-----------|-----------|-----|
| MongoDB for VS Code | `mongodb.mongodb-vscode` | Browse database collections |
| GitLens | `eamodio.gitlens` | Git blame, history |
| Error Lens | `usernamehue.errorlens` | Shows errors inline |
| REST Client | `humao.rest-client` | Test API endpoints |

---

## Step 2: Clone / Download The Project

Clone or download the project. Your folder structure should look like:

```
smart-timetable-system/
├── .vscode/
├── smart-timetable-frontend/     ← React app
├── smarttimetablesystem/         ← Spring Boot + AI Engine
│   ├── ai-engine/                ← Python AI Engine
│   ├── src/                      ← Java source code
│   ├── pom.xml
│   └── mvnw.cmd
├── Dashboard.bat                 ← Service launcher
├── dashboard.ps1
├── Shortcut Dashboard-Guide.md
└── VSCode-Migration-Guide.md
```

---

## Step 3: Open The Project In VS Code

**File → Open Folder → select `smart-timetable-system`** (the root folder)

Wait 1–2 minutes for Java extension to finish indexing (you'll see a loading indicator in the bottom status bar).

---

## Step 4: Install Dependencies (One-Time Setup)

Open VS Code terminal (`Ctrl + backtick`) and run these commands:

### 4a. Install React Frontend Dependencies

```powershell
cd smart-timetable-frontend
npm install
cd ..
```

### 4b. Create Python Virtual Environment & Install Packages

```powershell
cd smarttimetablesystem
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn scikit-learn pandas joblib matplotlib numpy scipy pydantic
cd ..
```

> If `.venv\Scripts\Activate.ps1` gives an error, run this first:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
> ```
> Then try the activate command again.

### 4c. Spring Boot (No Setup Needed)

Maven wrapper (`mvnw.cmd`) handles everything automatically. Java dependencies download on first run.

---

## Step 5: Configure MongoDB Connection

The project uses **MongoDB Atlas**. Ask the team lead for the connection string.

Open `smarttimetablesystem/src/main/resources/application.properties` and update:

```properties
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
```

> Your team lead will provide the actual connection string with credentials.

---

## Step 6: Run The Project

### Using The Dashboard (Recommended)

1. Double-click **`Dashboard.bat`** in the project root
2. Press **`A`** to start all three services
3. Wait ~15 seconds, press **`R`** to refresh
4. Open **http://localhost:5173** in your browser

### What Each Service Does

| Service | Port | Purpose |
|---------|------|---------|
| AI Engine | `localhost:5000` | Genetic algorithm timetable generation |
| React Frontend | `localhost:5173` | The web app UI |
| Spring Boot | `localhost:8081` | Backend API, authentication, MongoDB |

See **`Shortcut Dashboard-Guide.md`** for full dashboard instructions.

---

## Step 7: Verify Everything Works

After starting all services:

1. Open `http://localhost:5173` in your browser
2. You should see the **Login page**
3. Log in with test credentials (ask team lead)
4. Navigate to **Full Schedule** → click **Generate**
5. If a timetable generates, all three services are working correctly

---

## Troubleshooting

### "JAVA_HOME not set" or Java errors

Make sure `JAVA_HOME` points to your JDK 17 installation:

```powershell
# Check current value
echo $env:JAVA_HOME

# Set it (adjust path to your JDK location)
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17", "User")
```

Restart VS Code after setting this.

### Python "module not found" errors

Make sure the virtual environment is activated. The dashboard handles this automatically, but if running manually:

```powershell
cd smarttimetablesystem
.\.venv\Scripts\Activate.ps1
cd ai-engine
uvicorn api.main:app --reload --port 5000
```

### "npm: command not found"

Node.js isn't installed or not in PATH. Reinstall Node.js from [nodejs.org](https://nodejs.org) and make sure "Add to PATH" is checked.

### Port already in use

```powershell
# Find what's using a port (e.g. 5173)
netstat -ano | Select-String ":5173\s" | Select-String "LISTENING"

# Kill it (replace 12345 with the PID from above)
taskkill /PID 12345 /T /F
```

### Lombok errors (red squiggly lines on @Data, @Id)

Install the **Lombok Annotations Support** extension and restart VS Code.

### VS Code can't find Java

Open VS Code settings (`Ctrl+,`) → search `java.jdt.ls.java.home` → set it to your JDK 17 path.

---

## Daily Workflow

1. Open VS Code → open the `smart-timetable-system` folder
2. Double-click `Dashboard.bat` → press `A` to start services
3. Open `http://localhost:5173` → start working
4. When done → press `S` in dashboard to stop everything → press `Q` to quit

---

## Quick Reference

```
┌──────────────────────────────────────────────┐
│           QUICK REFERENCE                    │
├──────────────────────────────────────────────┤
│  Java: 17          Python: 3.12+             │
│  Node: 18+         Package Mgr: npm          │
│                                              │
│  Frontend:   http://localhost:5173           │
│  Backend:    http://localhost:8081           │
│  AI Engine:  http://localhost:5000           │
│                                              │
│  Start all:  Dashboard.bat → press A         │
│  Stop all:   press S in dashboard            │
│                                              │
│  Guides:                                     │
│   - Shortcut Dashboard-Guide.md              │
│   - VSCode-Migration-Guide.md                │
└──────────────────────────────────────────────┘
```
