$root = "c:\Users\Barry\Downloads\Doussel_immo"
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx")
$excludeDirs = @("node_modules", ".next", ".git")

$files = Get-ChildItem -Path $root -Include $extensions -Recurse -File | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | Where-Object { $path -match "\\$_\\" })
}

$replacements = @(
    @{ Old = 'https://dousell-immo.app'; New = 'https://dousel.com' },
    @{ Old = 'https://www.dousell-immo.com'; New = 'https://dousel.com' },
    @{ Old = 'https://dousell-immo.com'; New = 'https://dousel.com' },
    @{ Old = 'https://dousell-immo.vercel.app'; New = 'https://dousel.com' },
    @{ Old = 'https://app.doussel.immo'; New = 'https://app.dousel.com' },
    @{ Old = 'contact@doussel-immo.com'; New = 'contact@dousel.com' },
    @{ Old = 'contact@dousell-immo.com'; New = 'contact@dousel.com' },
    @{ Old = "Dousell Immobilier S`u00e9n`u00e9gal"; New = "Dousel Immobilier S`u00e9n`u00e9gal" },
    @{ Old = 'Dousell Immo'; New = 'Dousel' },
    @{ Old = 'Dousell'; New = 'Dousel' }
)

$changedFiles = @()

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    
    foreach ($r in $replacements) {
        $content = $content.Replace($r.Old, $r.New)
    }
    
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $changedFiles += $file.FullName
        Write-Output "CHANGED: $($file.FullName)"
    }
}

Write-Output "`n--- TOTAL: $($changedFiles.Count) files changed ---"
