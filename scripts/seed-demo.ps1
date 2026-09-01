#!/usr/bin/env pwsh
# Seed a demo user with tracking data so you can log in and see a populated UI.
#
# Prereq: dev stack running ->  docker compose -f docker-compose.dev.yml up -d
# Then:                          ./scripts/seed-demo.ps1
# Log in at http://localhost:8090/login with the credentials printed at the end.

[CmdletBinding()]
param(
    [string]$ApiBase  = "http://localhost:8080/api",
    [string]$Email    = "demo@taletrack.dev",
    [string]$Username  = "demo",
    [string]$Password  = "demo1234"
)

$ErrorActionPreference = "Stop"

# INTERNAL_API_KEY is needed to hit /register
$envFile = Join-Path $PSScriptRoot "..\.env"
$internalKey = ((Get-Content $envFile | Where-Object { $_ -match '^INTERNAL_API_KEY=' }) -replace '^INTERNAL_API_KEY=', '').Trim()
if (-not $internalKey) { throw "INTERNAL_API_KEY not found in $envFile" }

Write-Host "-> Registering $Email ..."
try {
    Invoke-RestMethod -Method Post -Uri "$ApiBase/register" `
        -Headers @{ "X-Internal-Api-Key" = $internalKey } `
        -ContentType "application/json" `
        -Body (@{ email = $Email; username = $Username; password = $Password } | ConvertTo-Json) | Out-Null
    Write-Host "   registered."
} catch {
    if ("$($_.ErrorDetails.Message)" -match "registrado") { Write-Host "   already exists, continuing." }
    else { throw }
}

Write-Host "-> Logging in ..."
$login = Invoke-RestMethod -Method Post -Uri "$ApiBase/login" `
    -ContentType "application/json" `
    -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
$auth = @{ Authorization = "Bearer $($login.token)" }

# type must be one of: Book | Movie | Series   (see AddTrackingEventRequest)
# Books with a real ISBN get author + cover auto-filled from OpenLibrary in the background.
$items = @(
    @{ title = "The Hobbit";                        type = "Book";   length = 310; progress = 100; author = "J.R.R. Tolkien";   isbn = "9780547928227" }
    @{ title = "Dune";                              type = "Book";   length = 688; progress = 64;  author = "Frank Herbert";    isbn = "9780441013593" }
    @{ title = "Project Hail Mary";                 type = "Book";   length = 496; progress = 100; author = "Andy Weir";        isbn = "9780593135204" }
    @{ title = "The Name of the Wind";              type = "Book";   length = 662; progress = 27;  author = "Patrick Rothfuss"; isbn = "9780756404741" }
    @{ title = "Klara and the Sun";                 type = "Book";   length = 320; progress = 100; author = "Kazuo Ishiguro";   isbn = "9780593318171" }
    @{ title = "Piranesi";                          type = "Book";   length = 245; progress = 88;  author = "Susanna Clarke";   isbn = "9781635575637" }
    @{ title = "Blade Runner 2049";                 type = "Movie";  length = 164; progress = 100 }
    @{ title = "Everything Everywhere All at Once"; type = "Movie";  length = 139; progress = 100 }
    @{ title = "Dune: Part Two";                    type = "Movie";  length = 166; progress = 45  }
    @{ title = "Severance";                         type = "Series"; length = 9;   progress = 100 }
    @{ title = "The Bear";                          type = "Series"; length = 10;  progress = 70  }
    @{ title = "Shogun";                            type = "Series"; length = 10;  progress = 30  }
)

Write-Host "-> Adding $($items.Count) tracking events ..."
foreach ($it in $items) {
    Invoke-RestMethod -Method Post -Uri "$ApiBase/tracking" -Headers $auth `
        -ContentType "application/json" -Body ($it | ConvertTo-Json) | Out-Null
    Write-Host ("   + {0,-38} {1,-7} {2}%" -f $it.title, $it.type, $it.progress)
}

Write-Host ""
Write-Host "Done. Open http://localhost:8090/login"
Write-Host "  email:    $Email"
Write-Host "  password: $Password"
