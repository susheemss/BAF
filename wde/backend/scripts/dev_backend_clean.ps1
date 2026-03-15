$ErrorActionPreference = "SilentlyContinue"

$uvicornProcs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match "uvicorn main:app" }
if ($uvicornProcs) {
  foreach ($proc in $uvicornProcs) {
    if ($proc.ProcessId -and $proc.ProcessId -ne $PID) {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
}

Start-Sleep -Milliseconds 300
$ErrorActionPreference = "Continue"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
