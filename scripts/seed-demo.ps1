#!/usr/bin/env pwsh
# Seed a demo user with tracking data so you can log in and see a populated UI.
#
# Prereq: dev stack running ->  docker compose -f docker-compose.dev.yml up -d
# Then:                          ./scripts/seed-demo.ps1
# Log in at http://localhost:8090/login with the credentials printed at the end.
# Seeds ~65 books (so the carousel's 50-item cap + "see all" is visible), 3 movies, 3 series.
# Idempotent-ish: re-running adds more tracking events but media dedupes by title.

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

# A bigger book catalog so the carousel's 50-item cap is visible ("50 · see all").
# No ISBN -> these render the typed placeholder tile (fine for a demo).
$bookCatalog = @'
The Fellowship of the Ring;J.R.R. Tolkien;423
The Two Towers;J.R.R. Tolkien;352
The Return of the King;J.R.R. Tolkien;416
A Game of Thrones;George R.R. Martin;694
A Clash of Kings;George R.R. Martin;768
The Way of Kings;Brandon Sanderson;1007
Mistborn: The Final Empire;Brandon Sanderson;541
The Fifth Season;N.K. Jemisin;468
A Wizard of Earthsea;Ursula K. Le Guin;205
The Left Hand of Darkness;Ursula K. Le Guin;304
Neuromancer;William Gibson;271
Snow Crash;Neal Stephenson;468
The Three-Body Problem;Liu Cixin;400
Foundation;Isaac Asimov;244
I, Robot;Isaac Asimov;224
Do Androids Dream of Electric Sheep?;Philip K. Dick;210
Hyperion;Dan Simmons;482
Ender's Game;Orson Scott Card;324
The Dispossessed;Ursula K. Le Guin;341
Rendezvous with Rama;Arthur C. Clarke;256
2001: A Space Odyssey;Arthur C. Clarke;297
Ringworld;Larry Niven;342
The Forever War;Joe Haldeman;278
A Canticle for Leibowitz;Walter M. Miller Jr.;320
Solaris;Stanislaw Lem;204
Roadside Picnic;Arkady and Boris Strugatsky;209
The Stars My Destination;Alfred Bester;258
Childhood's End;Arthur C. Clarke;224
The Martian;Andy Weir;369
Recursion;Blake Crouch;336
Dark Matter;Blake Crouch;342
Station Eleven;Emily St. John Mandel;333
The Road;Cormac McCarthy;287
Never Let Me Go;Kazuo Ishiguro;288
The Remains of the Day;Kazuo Ishiguro;258
Cloud Atlas;David Mitchell;509
The Night Circus;Erin Morgenstern;387
Jonathan Strange & Mr Norrell;Susanna Clarke;782
The Priory of the Orange Tree;Samantha Shannon;830
Circe;Madeline Miller;393
The Song of Achilles;Madeline Miller;352
Gideon the Ninth;Tamsyn Muir;448
The Poppy War;R.F. Kuang;545
Babel;R.F. Kuang;546
The City & the City;China Mieville;312
Perdido Street Station;China Mieville;710
American Gods;Neil Gaiman;465
The Ocean at the End of the Lane;Neil Gaiman;181
Good Omens;Neil Gaiman and Terry Pratchett;288
Small Gods;Terry Pratchett;384
Guards! Guards!;Terry Pratchett;355
Mort;Terry Pratchett;272
The Colour of Magic;Terry Pratchett;288
A Deepness in the Sky;Vernor Vinge;774
Blindsight;Peter Watts;384
Children of Time;Adrian Tchaikovsky;600
The Long Way to a Small, Angry Planet;Becky Chambers;518
A Memory Called Empire;Arkady Martine;462
This Is How You Lose the Time War;Amal El-Mohtar and Max Gladstone;209
'@ -split "`n" | Where-Object { $_.Trim() }

$i = 0
foreach ($line in $bookCatalog) {
    $p = $line.Split(';')
    # mostly finished, a few in progress, a couple barely started
    $prog = switch ($i % 7) { 5 { 100 } 6 { (30, 55, 78 | Get-Random) } default { 100 } }
    $items += @{ title = $p[0].Trim(); type = "Book"; length = [int]$p[2].Trim(); progress = $prog; author = $p[1].Trim() }
    $i++
}

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
