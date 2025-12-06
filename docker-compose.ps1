# PowerShell script to load .env file and start Docker Compose
$envFile = "server\.env"

if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile..." -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  Set $key" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "Warning: $envFile not found!" -ForegroundColor Yellow
}

Write-Host "`nStarting Docker Compose..." -ForegroundColor Green
docker-compose up --build

