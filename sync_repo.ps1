$git = "C:\Program Files\Git\cmd\git.exe"
$gh = "C:\Program Files\GitHub CLI\gh.exe"

Write-Host "[1/3] Verificando estado local..."
& $git status

Write-Host "`n[2/3] Autenticando con GitHub CLI..."
$token = (& $gh auth token).Trim()

Write-Host "`n[3/3] Subiendo cambios a GitHub..."
& $git remote set-url origin "https://${token}@github.com/brilan10/La-Romana-Peluqueria.git"
& $git push -u origin main --force
& $git remote set-url origin "https://github.com/brilan10/La-Romana-Peluqueria.git"

Write-Host "`n>>> REPOSITORIO SUBIDO EXITOSAMENTE A GITHUB <<<" -ForegroundColor Green
