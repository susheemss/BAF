# Setup Guide For New System

This guide explains what to do after receiving the ZIP file of the project.

## 1. Extract the ZIP

1. Download the ZIP file.
2. Right-click the ZIP file.
3. Click `Extract All`.
4. Extract it to a normal folder such as:

```text
C:\Users\YourName\Desktop\BAF-unified-app
```

Do not run the project directly from inside the ZIP.

## 2. Install Required Software

Before opening the project, install these:

1. `VS Code`
2. `Node.js LTS`
3. `Python 3.11 or above`

Recommended download links:

- VS Code: `https://code.visualstudio.com/`
- Node.js: `https://nodejs.org/`
- Python: `https://www.python.org/downloads/`

## 3. If Node Is Not Recognized

If you see this error:

```text
'node' is not recognized as an internal or external command
```

Follow these steps:

1. Install `Node.js LTS` from `https://nodejs.org/`
2. During installation, keep default options.
3. Make sure the installer adds Node.js to `PATH`.
4. Close VS Code completely.
5. Reopen VS Code.
6. Open a new terminal and run:

```powershell
node -v
npm -v
```

If it still does not work:

1. Restart the computer.
2. Open VS Code again.
3. Run:

```powershell
node -v
npm -v
```

If it still fails, reinstall Node.js.

## 4. Open the Project in VS Code

1. Open `VS Code`
2. Click `File` -> `Open Folder`
3. Select the extracted folder:

```text
BAF-unified-app
```

4. Open terminal in VS Code:

```text
Terminal -> New Terminal
```

## 5. Verify Software Installation

Run these commands in the VS Code terminal:

```powershell
node -v
npm -v
python --version
```

If any command fails, install or reinstall that software before continuing.

## 6. Run the Planning App

In the VS Code terminal, run:

```powershell
cd planning
npm install
npm run dev
```

After it starts, open this URL in the browser:

```text
http://localhost:3002
```

## 7. Run the WDE App

This app requires 2 terminals.

### Terminal 1: Frontend

Open a new terminal in VS Code and run:

```powershell
cd wde\frontend
npm install
npm run dev
```

Open this URL in the browser:

```text
http://localhost:3000
```

### Terminal 2: Backend

Open another new terminal in VS Code and run:

```powershell
cd wde\backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

The backend should keep running in the terminal on port `8001`.

## 8. If Terminal Is Opened In the Wrong Folder

If commands fail because of folder path issues, first go to the main project folder:

```powershell
cd "C:\Users\YourName\Desktop\BAF-unified-app"
```

Then run the app commands again.

## 9. If PowerShell Blocks a Command

Run this once in the terminal:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Then run the required command again.

## 10. Important Notes

- Do not run the project from inside the ZIP file.
- `planning` runs separately.
- `wde` needs both frontend and backend running.
- Keep the terminal open while using the app.
- If `.env.local` files were shared in the ZIP, keep them in the same folders.

## 11. Final URLs

After everything starts correctly:

- Planning app: `http://localhost:3002`
- WDE frontend: `http://localhost:3000`
- WDE backend: runs on port `8001`

## 12. Quick Troubleshooting

### Node not recognized

Install Node.js and restart VS Code.

### Python not recognized

Install Python and make sure `Add Python to PATH` is selected.

### npm install fails

Check internet connection and make sure Node.js is installed properly.

### Port already in use

Close any old terminal running the same app and try again.
