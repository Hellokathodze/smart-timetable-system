# IntelliJ → VS Code Migration Guide

## Smart Timetable System

---

## Step 1: Install Required VS Code Extensions

Open VS Code → Extensions panel (`Ctrl+Shift+X`) → install these:

### Must-Have (Backend — Java/Spring Boot)

| Extension | ID (search this) | Why |
|-----------|-------------------|-----|
| Extension Pack for Java | `vscjava.vscode-java-pack` | Java language support, debugging, Maven, test runner — all in one |
| Spring Boot Extension Pack | `vmware.vscode-boot-dev-pack` | Spring Boot dashboard, run configs, live reload, application.properties autocomplete |
| Lombok Annotations Support | `vscjava.vscode-lombok` | Your models use `@Data`, `@Id` etc — without this you get fake errors everywhere |

### Must-Have (Frontend — React)

| Extension | ID | Why |
|-----------|-----|-----|
| ES7+ React Snippets | `dsznajder.es7-react-js-snippets` | Fast component scaffolding |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocomplete for your Tailwind classes |
| Prettier | `esbenp.prettier-vscode` | Code formatting |

### Must-Have (Python AI Engine)

| Extension | ID | Why |
|-----------|-----|-----|
| Python | `ms-python.python` | Python language support + debugging |
| Pylance | `ms-python.vscode-pylance` | Fast IntelliSense for Python |

### Must-Have (API Testing — replaces IntelliJ HTTP Client)

| Extension | ID | Why |
|-----------|-----|-----|
| REST Client | `humao.rest-client` | Runs `.http` files exactly like IntelliJ — your `api-test.http` will work with minor tweaks |
| Thunder Client | `rangav.vscode-thunder-client` | GUI alternative (like Postman built into VS Code) |

### Recommended

| Extension | ID | Why |
|-----------|-----|-----|
| MongoDB for VS Code | `mongodb.mongodb-vscode` | Browse your timetableDB collections directly |
| GitLens | `eamodio.gitlens` | Git blame, history, branch comparison |
| Error Lens | `usernamehue.errorlens` | Shows errors inline (very helpful) |

---

## Step 2: Open the Project Correctly

**Important:** VS Code needs each project opened at the right root level.

### Option A: VS Code Multi-Root Workspace (Recommended)

Create a file called `smart-timetable.code-workspace` in your parent folder:

```
📁 your-parent-folder/
├── smart-timetable.code-workspace    ← create this
├── 📁 smarttimetablesystem-main/     ← backend
└── 📁 smart-timetable-frontend-main/ ← frontend
```

Contents of `smart-timetable.code-workspace`:

```json
{
  "folders": [
    {
      "name": "Backend (Spring Boot)",
      "path": "smarttimetablesystem-main"
    },
    {
      "name": "Frontend (React)",
      "path": "smart-timetable-frontend-main"
    }
  ],
  "settings": {
    "java.configuration.updateBuildConfiguration": "automatic",
    "java.compile.nullAnalysis.mode": "automatic",
    "spring-boot.ls.java.home": "",
    "editor.formatOnSave": true,
    "editor.tabSize": 4,
    "files.exclude": {
      "**/.git": true,
      "**/.idea": true,
      "**/*.iml": true,
      "**/target": true,
      "**/__pycache__": true
    }
  }
}
```

Then open with: **File → Open Workspace from File → select `smart-timetable.code-workspace`**

### Option B: Open each project separately

Open two VS Code windows — one for backend, one for frontend.

---

## Step 3: Backend Configuration Files

### 3a. Create `.vscode/settings.json` inside `smarttimetablesystem-main/`

```json
{
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.project.sourcePaths": ["src/main/java", "src/test/java"],
  "java.project.outputPath": "target",
  "java.compile.nullAnalysis.mode": "automatic",
  "java.jdt.ls.lombokSupport.enabled": true,
  "spring-boot.ls.java.home": "",
  "editor.tabSize": 4,
  "files.exclude": {
    "**/.idea": true,
    "**/*.iml": true,
    "**/target": true,
    "**/__pycache__": true,
    "**/*.pyc": true
  }
}
```

### 3b. Create `.vscode/launch.json` inside `smarttimetablesystem-main/`

This replaces IntelliJ's run configurations:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Spring Boot - Backend",
      "request": "launch",
      "mainClass": "com.smarttimetablesystem.SmarttimetablesystemApplication",
      "projectName": "smarttimetablesystem",
      "args": "",
      "envFile": "${workspaceFolder}/.env"
    },
    {
      "type": "debugpy",
      "name": "Python AI Engine",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "api.main:app",
        "--reload",
        "--port",
        "5000"
      ],
      "cwd": "${workspaceFolder}/ai-engine",
      "jinja": true
    }
  ],
  "compounds": [
    {
      "name": "Full Stack (Backend + AI)",
      "configurations": [
        "Spring Boot - Backend",
        "Python AI Engine"
      ]
    }
  ]
}
```

### 3c. Create `.vscode/tasks.json` inside `smarttimetablesystem-main/`

This replaces IntelliJ's Maven tool window:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Maven: Clean & Build",
      "type": "shell",
      "command": "./mvnw clean compile -DskipTests",
      "windows": {
        "command": ".\\mvnw.cmd clean compile -DskipTests"
      },
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Maven: Run Spring Boot",
      "type": "shell",
      "command": "./mvnw spring-boot:run",
      "windows": {
        "command": ".\\mvnw.cmd spring-boot:run"
      },
      "group": "build",
      "problemMatcher": [],
      "isBackground": true
    },
    {
      "label": "Maven: Run Tests",
      "type": "shell",
      "command": "./mvnw test",
      "windows": {
        "command": ".\\mvnw.cmd test"
      },
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "Python: Start AI Engine",
      "type": "shell",
      "command": "cd ai-engine && ../.venv/Scripts/activate && uvicorn api.main:app --reload --port 5000",
      "windows": {
        "command": "cd ai-engine && ..\\.venv\\Scripts\\activate && uvicorn api.main:app --reload --port 5000"
      },
      "group": "build",
      "problemMatcher": [],
      "isBackground": true
    },
    {
      "label": "Maven: Package JAR",
      "type": "shell",
      "command": "./mvnw clean package -DskipTests",
      "windows": {
        "command": ".\\mvnw.cmd clean package -DskipTests"
      },
      "group": "build",
      "problemMatcher": []
    }
  ]
}
```

---

## Step 4: Convert IntelliJ HTTP Client → VS Code REST Client

Your `api-test.http` file uses IntelliJ's `{% %}` scripting syntax which VS Code's REST Client doesn't support. Here's how to adapt it:

### Create `api-test.http` (VS Code format) — replace the existing one

The key differences:
- **Variables:** Use `@variable = value` instead of IntelliJ's `client.global.set()`
- **No scripting:** You manually copy tokens after login responses
- **Separators:** Use `###` the same way (this already works)

In the file, change the login response handler blocks from:

```
> {%
    const token = response.body.token;
    client.global.set("admin_token", token);
%}
```

To just a comment:

```
# ⚠️ Copy the "token" value from the response below and paste it into @admin_token above
```

And at the top of the file, add a manual token variable:

```
@admin_token = PASTE_YOUR_TOKEN_HERE
@faculty_token = PASTE_YOUR_TOKEN_HERE
@student_token = PASTE_YOUR_TOKEN_HERE
```

> **Tip:** After running a login request, click "Copy Response Body" → grab the token → paste it into the variable at the top. This is the only workflow change vs IntelliJ.

---

## Step 5: Files to Delete (IntelliJ Artifacts)

These files are IntelliJ-specific and serve no purpose in VS Code:

```
smarttimetablesystem-main/
├── src/main/java/com/smarttimetablesystem/
│   ├── http-client.env.json     ← DELETE (IntelliJ HTTP Client env)
│   └── api-test.http            ← MOVE to project root (wrong location for source code)
```

### Commands to run:

```bash
# Delete IntelliJ HTTP client env file
del src\main\java\com\smarttimetablesystem\http-client.env.json

# Move api-test.http to project root (better location)
move src\main\java\com\smarttimetablesystem\api-test.http .\api-test.http
```

Also delete these if they exist locally (they might be gitignored):

```bash
# Delete IntelliJ project files (if present)
rmdir /s /q .idea
del /s *.iml
```

---

## Step 6: Update `.gitignore` (Backend)

Your backend `.gitignore` already excludes `.vscode/` — **remove that line** since you now WANT to commit VS Code configs for your team:

Change this:

```gitignore
### VS Code ###
.vscode/
```

To this:

```gitignore
### VS Code ###
# Keep .vscode/ tracked for shared team configs
# Only ignore personal settings
.vscode/settings.local.json
```

---

## Step 7: Daily Workflow in VS Code

### Running the Backend (3 options):

| Method | How |
|--------|-----|
| **Press F5** | Select "Spring Boot - Backend" from the dropdown → runs with debugger attached |
| **Spring Boot Dashboard** | Bottom-left panel → click ▶ on the app (from Spring Boot extension) |
| **Terminal** | `./mvnw spring-boot:run` or `mvnw.cmd spring-boot:run` on Windows |

### Running the AI Engine:

| Method | How |
|--------|-----|
| **Press F5** | Select "Python AI Engine" from dropdown |
| **Terminal** | `cd ai-engine` → `..\.venv\Scripts\activate` → `uvicorn api.main:app --reload --port 5000` |

### Running the Frontend:

```bash
cd smart-timetable-frontend
npm run dev
```

### Running All Three Together:

Open 3 terminals in VS Code (`Ctrl+`` → click + icon):
1. Terminal 1: Spring Boot backend
2. Terminal 2: Python AI engine
3. Terminal 3: React frontend (`npm run dev`)

Or use the **"Full Stack (Backend + AI)"** compound launch config (F5) and run frontend in a terminal.

---

## Step 8: Keyboard Shortcuts (IntelliJ → VS Code)

| Action | IntelliJ | VS Code |
|--------|----------|---------|
| Run/Debug | Shift+F10 / Shift+F9 | F5 |
| Find file | Ctrl+Shift+N | Ctrl+P |
| Find in project | Ctrl+Shift+F | Ctrl+Shift+F |
| Go to definition | Ctrl+Click | Ctrl+Click (same) |
| Refactor/Rename | Shift+F6 | F2 |
| Format code | Ctrl+Alt+L | Shift+Alt+F |
| Terminal | Alt+F12 | Ctrl+` |
| Project Structure | Ctrl+Alt+Shift+S | N/A (automatic with Maven) |
| Quick fix | Alt+Enter | Ctrl+. |
| Search everywhere | Double Shift | Ctrl+P |
| Recent files | Ctrl+E | Ctrl+Tab |
| Build | Ctrl+F9 | Ctrl+Shift+B (runs default build task) |

> **Pro tip:** Install the **"IntelliJ IDEA Keybindings"** extension (`k--kato.intellij-idea-keybindings`) if you want to keep your muscle memory while transitioning.

---

## Step 9: Things That "Just Work" (No Changes Needed)

- **Maven builds** — `mvnw` wrapper is already in the project, VS Code Java extension auto-detects `pom.xml`
- **MongoDB connection** — `application.properties` is unchanged
- **Lombok** — works with the Lombok extension installed
- **Frontend** — Vite/React/Tailwind have zero IDE dependency
- **Python venv** — VS Code auto-detects `.venv` in the project
- **Git** — VS Code has built-in Git support

---

## Quick Checklist

- [ ] Install all VS Code extensions from Step 1
- [ ] Create `.vscode/settings.json` in backend folder
- [ ] Create `.vscode/launch.json` in backend folder
- [ ] Create `.vscode/tasks.json` in backend folder
- [ ] Move `api-test.http` to project root
- [ ] Delete `http-client.env.json`
- [ ] Delete `.idea/` folder and `*.iml` files (if present locally)
- [ ] Update `.gitignore` to allow `.vscode/`
- [ ] (Optional) Create workspace file for multi-root setup
- [ ] Open project → wait for Java extension to index (first time takes 1-2 min)
- [ ] Test: F5 → Spring Boot runs → check `localhost:8081`
- [ ] Test: Python AI engine starts on port 5000
- [ ] Test: `npm run dev` → frontend on `localhost:5173`
