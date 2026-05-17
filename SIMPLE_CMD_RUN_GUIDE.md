# Simple CMD Run Guide

Use this guide after extracting the project ZIP and opening the folder in VS Code.

## Important

- Use `Command Prompt (cmd)` in VS Code terminal
- Do not use PowerShell
- Do not run `wde` backend

## Step 1: Open the project

1. Extract the ZIP file.
2. Open `VS Code`.
3. Click `File` -> `Open Folder`.
4. Select the extracted `BAF-unified-app` folder.

## Step 2: Open CMD terminal in VS Code

1. In VS Code, click `Terminal` -> `New Terminal`.
2. If the terminal opens as PowerShell, switch it to `Command Prompt`.
3. Make sure the terminal shows `cmd`.

## Step 3: Check Node.js

Run:

```cmd
node -v
npm -v
```

If `node` is not recognized, install `Node.js LTS` and reopen VS Code.

## Step 4: Run the Planning app

In the CMD terminal, run:

```cmd
cd C:\Users\YourName\Desktop\BAF-unified-app
cd planning
npm install
npm run dev
```

Then open this in the browser:

```text
http://localhost:3002
```

## Step 5: Run the WDE frontend only

Open one more CMD terminal in VS Code.

Run:

```cmd
cd C:\Users\YourName\Desktop\BAF-unified-app
cd wde\frontend
npm install
npm run dev
```

Then open this in the browser:

```text
http://localhost:3000
```

## Step 6: Do not run WDE backend

Do not run these commands:

```cmd
cd C:\Users\YourName\Desktop\BAF-unified-app
cd wde\backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

For this setup, only run:

- `planning`
- `wde frontend`

## Step 7: If terminal is in wrong folder

Go back to the main folder first:

```cmd
cd C:\Users\YourName\Desktop\BAF-unified-app
```

Then run the commands again.

## Final URLs

- Planning app: `http://localhost:3002`
- WDE frontend: `http://localhost:3000`
