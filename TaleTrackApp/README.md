# TaleTrack — Backend

ASP.NET Core 10 (.NET 10), Minimal APIs, patrón **REPR** (Request → Endpoint → Response).
PostgreSQL 15 vía EF Core. Autenticación JWT + API key interna.

> Mapa rápido para reorientarse. Para el detalle vivo, mira siempre `Program.cs` (registro de
> endpoints y pipeline) y la carpeta `Features/`.

---

## 1. Cómo arranca (`Program.cs`)

Todo el arranque está en el top-level `Program.cs` con funciones locales:

```
loadEnvironment()      -> carga ../.env con DotNetEnv (relativo al cwd)
configureDatabase()    -> DbContext Npgsql; se SALTA si Environment == "Testing"
configureAuth()        -> JWT bearer + 3 policies + handler de API key + EmailService HttpClient
configureApi()         -> controllers, Swagger, servicios scoped (REPR), OpenLibrary HttpClient, ValidationFilter
configureCors()        -> policy "FrontendCors" desde CORS_ALLOWED_ORIGINS (coma-separado)
--- build ---
configurePipeline():
    applyMigrations()  -> db.Database.Migrate() automático en cada arranque (EnsureCreated si es SQLite)
    Swagger + SwaggerUI (siempre activos, incluso en prod)
    UseHttpsRedirection
    UseCors -> UseAuthentication -> UseAuthorization
    grupo "/api" y cada *Endpoint.Map(apiGroup)
```

- **Migraciones**: se aplican solas al arrancar. Para crear una nueva:
  `dotnet ef migrations add <Nombre>` (nunca escribir el archivo a mano).
- **Config JWT**: `appsettings.json > JwtSettings` (Issuer/Audience `TaleTrackApp`, ExpirationMinutes `60`).
  El secreto viene de env `JwtSettings__Secret` (doble guion bajo = jerarquía en .NET config).

---

## 2. Organización de carpetas

```
TaleTrackApp/
├── Program.cs                 # arranque + registro de TODOS los endpoints
├── appsettings.json           # JwtSettings, Logging, OpenLibrary:SimilarityThreshold
├── Auth/
│   ├── Policies.cs            # constantes: UserPolicy / InternalOnly / UserAndInternal
│   ├── JwtService.cs          # GenerateToken(userId, email, username)
│   ├── InternalApiKeyHandler.cs  # valida header X-Internal-Api-Key contra env INTERNAL_API_KEY
│   ├── ValidationFilter.cs    # IEndpointFilter: valida DataAnnotations de cada argumento -> 400 con mensajes
│   └── EmailService.cs        # manda códigos OTP vía API de Resend (https://api.resend.com/emails)
├── Data/
│   ├── AppDbContext.cs        # 4 DbSet: Users, Medias, Reviews, TrackingEvents (+ cascade delete)
│   └── Migrations/            # 9 migraciones, generadas por EF
├── Model/                     # entidades EF: User, Media, Review, TrackingEvent
├── Features/
│   ├── User/  Media/  TrackingEvent/  Review/
│   ├── Stats/                 # StatsService + GetStats/  → GET /api/stats (resumen anual)
│   └── Library/               # LibraryService + GetLibrary/  → GET /api/library (1 fila por media)
└── Features/<Feature>/<Accion>/
        ├── <Accion>Endpoint.cs   # static class con Map(RouteGroupBuilder) + HandleAsync(...)
        ├── <Accion>Request.cs    # DTO de entrada con DataAnnotations
        └── (Response opcional)
    Features/<Feature>/<Feature>Service.cs   # lógica compartida del feature (scoped)
```

**Patrón de un endpoint** (todos iguales):

```csharp
public static class XEndpoint {
    public static void Map(RouteGroupBuilder group) =>
        group.MapPost("/x", HandleAsync)
             .AddEndpointFilter<ValidationFilter>()
             .RequireAuthorization(Policies.UserPolicy);

    private static async Task<IResult> HandleAsync(XRequest req, XService svc, ClaimsPrincipal user, ILogger<XRequest> log)
    { ... return Results.Ok(new { success = true, ... }); }
}
```

El `userId` se saca siempre de `user.FindFirst(ClaimTypes.NameIdentifier)?.Value` y se parsea a `int`.

---

## 3. Autenticación y autorización

| Policy | Requiere | Se usa para |
|---|---|---|
| `UserPolicy` | JWT válido (`RequireAuthenticatedUser`) | endpoints de datos del usuario |
| `InternalOnly` | header `X-Internal-Api-Key` == env `INTERNAL_API_KEY` | register, lectura de media/tracking desde plugin/extensión/SSR |
| `UserAndInternal` | ambos | definido pero **no usado** actualmente |

Varios endpoints encadenan `.RequireAuthorization(UserPolicy).RequireAuthorization(InternalOnly)` → exigen **JWT + API key** a la vez (p. ej. `GET /api/tracking`, edición de user y reviews).

**Claims del JWT**: `sub` / `NameIdentifier` (userId), `email`, `unique_name` (username), `jti`. Expira a los 60 min.

**3 formas de login**, todas devuelven `{ success, message, token }`:
1. Email + password → `POST /api/login`
2. Google OAuth → `POST /api/auth/google` (valida el idToken con `Google.Apis.Auth`; crea o vincula usuario por `GoogleId`/email)
3. Email OTP → `POST /api/auth/request-code` (manda código de 6 dígitos, expira 10 min) + `POST /api/auth/verify-code`

**Registro**: `POST /api/register` → **solo con API key interna** (el frontend la inyecta desde `NEXT_PUBLIC_INTERNAL_API_KEY`). No hace auto-login; el frontend llama a `/login` después.

⚠️ **Gotchas de seguridad** (relevante para el TFG):
- El hash de password es **SHA-256 sin sal** (`UserService.HashPassword`). No es bcrypt/argon2.
- `User` tiene campos `RefreshToken` / `RefreshTokenExpiry` pero **no hay endpoint de refresh**. El token simplemente caduca.
- Swagger UI queda expuesto siempre, también en producción.

---

## 4. Endpoints (todos bajo `/api`)

### Auth / User
| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/login` | anónimo | login email+password |
| POST | `/auth/google` | anónimo | login/registro con Google idToken |
| POST | `/auth/request-code` | anónimo | envía OTP al email (respuesta genérica, no filtra si existe) |
| POST | `/auth/verify-code` | anónimo | valida OTP → JWT |
| POST | `/register` | **InternalOnly** | crea usuario (email, username, password ≥6) |
| PUT | `/user/{id}` | JWT + Internal | edita username/email/password/avatarUrl + `privacy{bookProgress,bookReviews,movieProgress,movieReviews,seriesProgress,seriesReviews}`; solo uno mismo (`userId == id` o 403) |
| GET | `/users/{id}` | JWT | perfil público: `{ id, username, avatarUrl, createdAt, relationship, counts{book,movie,series,total} }` |
| DELETE | `/user/{id}` | JWT + Internal | borra la cuenta; solo uno mismo. Cascade borra Reviews + TrackingEvents |

### Media
| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/media` | JWT | crea Media suelto vía `MediaService.CreateAsync` (**sin dedup**) |
| GET | `/media` | **InternalOnly** | lista media con filtros `?type=&limit=&orderBy=` (no filtra por usuario) |
| GET | `/media/{id}` | JWT | ficha de un media: datos + tu progreso/reseña + todas las reseñas + nota media. Alimenta `/media/[id]` |

### Tracking
| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/tracking` | JWT | registra progreso. `FindOrCreateAsync` deduplica el Media; si es Book sin autor/portada, dispara enriquecimiento OpenLibrary en background (fire-and-forget) |
| GET | `/tracking` | **JWT + Internal** | eventos del usuario con `?type=&limit=&orderBy=`. Devuelve `data[]` con `media` anidado |
| GET | `/books` | JWT | libros del usuario, deduplicados por `MediaId` (se queda el evento más reciente). Lo consume `/library` |

### Library / Stats  (`Features/Library/`, `Features/Stats/` — alimentan el home `/`)
| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| GET | `/stats` | JWT | resumen anual del usuario: `?year=` (def. actual) → `{ year, total, byType{book,movie,series}, byMonth[12], reviewCount }`. Cuenta media distinta con evento ese año, agrupada por el mes de su evento más reciente |
| GET | `/library` | JWT | biblioteca del usuario, **una fila por media** (evento más reciente gana) + `myRating`/`myReviewId`. Filtros `?type=Book\|Movie\|Series&status=in_progress\|finished&sort=recent\|rating&year=&limit=`. Alimenta carruseles, "en curso" y "top del año" |
| GET | `/reviews` | JWT | reseñas escritas por el usuario, con `media` anidado |
| GET | `/reviews/pending` | JWT | media terminada (progreso 100) que el usuario aún no ha reseñado |

### Friends & Activity  (`Features/Friend/`, `Features/Activity/` — todo JWT)
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/friends` | `{ friends, incoming, outgoing }` (amigos aceptados + solicitudes) |
| POST | `/friends/requests` `{userId}` | envía solicitud a ese usuario |
| POST | `/friends/requests/{id}` `{accept}` | acepta / rechaza una entrante |
| DELETE | `/friends/{userId}` | elimina amistad o cancela solicitud |
| GET | `/users/search?username=` | busca usuario por username (quita `@` inicial) → `{ user, relationship }` |
| GET | `/activity?scope=all\|mine\|friends&limit=` | feed derivado de TrackingEvent + Review: `started`/`finished`/`reviewed`. Filtra por la privacidad **por tipo de media** de cada usuario (`Share{Book,Movie,Series}{Progress,Reviews}`) |
| GET | `/activity?userId=N&limit=` | actividad de un solo usuario (para su perfil público); vacío salvo que seas tú o su amigo |
| GET | `/user/me` | perfil completo (avatar, privacidad) del usuario autenticado |

### Review
| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/review` | JWT + Internal | crea reseña (mediaId, rating 1–10, comment opcional) |
| PUT | `/review/{id}` | JWT + Internal | edita; solo el dueño (o 403) |
| DELETE | `/review/{id}` | JWT + Internal | borra; solo el dueño |

**Validación de entrada**: `ValidationFilter` (IEndpointFilter) recorre los argumentos y valida sus DataAnnotations; si falla devuelve `400 { message: "err1; err2" }`. Los mensajes están en español.

---

## 5. Modelo de datos (`Model/`, DbSets en `AppDbContext`)

| Entidad | Campos clave | Notas |
|---|---|---|
| **User** | Email, Username, PasswordHash?, GoogleId?, EmailCode?/Expiry?, RefreshToken?/Expiry?, LastLogin?, IsActive, CreatedAt | password/google opcionales → un user puede ser solo-Google |
| **Media** | Title, Type, Length, Description?, PosterUrl?, Author?, Isbn?, FirstTrackedAt, UpdatedAt? | `Type` regex `^(Movie|Series|Book)$` |
| **TrackingEvent** | UserId→, MediaId→, Progress? (0–100), EventDate | `EventDate` = `DateTime.UtcNow` al crear (no se puede backdatear por API) |
| **Review** | UserId→, MediaId→, Rating (1–10), Comment?, CreatedAt, UpdatedAt? | |
| **Friendship** | RequesterId→, AddresseeId→, Status ("Pending"/"Accepted"), CreatedAt, RespondedAt? | índice único en (Requester, Addressee); ambos FK cascade-delete |
| **User** (nuevos) | AvatarUrl?, y 6 flags de privacidad `Share{Book,Movie,Series}{Progress,Reviews}` (bool, def. true) | migr. `AddFriendsAndProfile` (avatar + 2 flags) → `PerTypeFeedPrivacy` (renombra a `ShareSeries*` + añade 4 columnas) |

- **Cascade delete** configurado en `OnModelCreating`: borrar un `User` borra sus `Review` y `TrackingEvent`.
- **Dedup de Media** (`MediaService.FindOrCreateAsync`): prioridad ISBN → Title+Author → Title solo (siempre dentro del mismo `Type`).
- **Enriquecimiento** (`OpenLibraryService`): para libros, busca por ISBN o por título/autor (similitud de tokens, umbral 0.75 configurable) y rellena Author / PosterUrl / Isbn si faltan. Portadas: `covers.openlibrary.org`.

⚠️ **Desajuste de tipos front/back (legacy)**: el backend usa `Book | Movie | Series`. El home nuevo (`/`, `/library`, `/reviews`) ya usa esos valores. Las páginas antiguas `/movies /series /comics` (fuera del nav, aún accesibles por URL) todavía filtran por `Film | Serie | Comic` y no cruzan — pendientes de migrar o borrar.

---

## 6. Paquetes NuGet (`TaleTrackApp.csproj`)

| Paquete | Para qué |
|---|---|
| `Microsoft.EntityFrameworkCore` 10.0.1 | ORM |
| `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.0 | provider PostgreSQL |
| `Microsoft.EntityFrameworkCore.Design` 10.0.1 | `dotnet ef` (migraciones) |
| `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.3 | validación de JWT |
| `System.IdentityModel.Tokens.Jwt` 8.16.0 | generación de JWT |
| `Google.Apis.Auth` 1.68.0 | validar idToken de Google |
| `DotNetEnv` 3.1.1 | cargar `.env` |
| `Swashbuckle.AspNetCore` 10.1.0 | Swagger / OpenAPI |

Sin librería de hashing (usa `System.Security.Cryptography.SHA256`), sin MediatR, sin FluentValidation, sin AutoMapper. DI a mano en `Program.cs`.

---

## 7. Variables de entorno

Se leen de `../.env` (repo root). El código mezcla `Environment.GetEnvironmentVariable(...)` y `builder.Configuration[...]` (ver TODO.txt — hay intención de unificar a `Configuration`).

| Variable | Uso |
|---|---|
| `POSTGRES_HOST/PORT/USER/PASSWORD/DB` | connection string (se construye a mano en `configureDatabase`) |
| `JWT_SECRET` / `JwtSettings__Secret` | firma del JWT |
| `INTERNAL_API_KEY` | policy `InternalOnly` |
| `GOOGLE_CLIENT_ID` | audience al validar el idToken de Google |
| `RESEND_API_KEY` | Bearer para la API de Resend (emails OTP) |
| `CORS_ALLOWED_ORIGINS` | orígenes permitidos, coma-separado (default `http://localhost:8090`) |

---

## 8. Tests (`../TaleTrackApp.Tests`)

- **xUnit** + `Microsoft.AspNetCore.Mvc.Testing` (integración end-to-end sobre `WebApplicationFactory<Program>`).
- `CustomWebApplicationFactory`: fuerza `Environment=Testing` (salta Npgsql), inyecta **SQLite in-memory** (con conexión KeepAlive), stubbea las llamadas HTTP de OpenLibrary (siempre 404), y fija `JwtSettings__Secret` / `INTERNAL_API_KEY` de test.
- `BookTrackingFlowTests`: 4 tests del flujo register → login → `POST /tracking` (book) → `GET /books` (incluye dedup y 401 sin auth).
- Correr: `dotnet test ../TaleTrackApp.Tests`

---

## 9. Cómo levantarlo

```bash
# Solo DB + migraciones (sin .NET local):
docker compose up -d postgres
docker compose --profile db run --rm migrator

# Stack de desarrollo completo (hot-reload):
docker compose -f docker-compose.dev.yml up -d
#   backend  -> http://localhost:8080  (Swagger en /swagger)
#   frontend -> http://localhost:8090
#   logs     -> http://localhost:9999  (dozzle)

# Local sin Docker:
cd TaleTrackApp && dotnet run
```

Para meter un usuario de prueba con datos: `../scripts/seed-demo.ps1` (registra `demo@taletrack.dev` / `demo1234` + ~12 tracking events).

---

## 10. Consumidores del backend

| Cliente | Cómo llama |
|---|---|
| `taletrack-frontend` (Next.js) | navegador → `/api/*` (rewrite a `backend:8080`). SSR usa `lib/api/server.ts` con la cookie `tt-token` + `X-Internal-Api-Key` |
| `taletrack.koplugin` (KOReader, Lua, submódulo git) | login por OTP (`/api/auth/request-code` + `/verify-code`), luego `POST /api/tracking` con `Authorization: Bearer` al avanzar/terminar un libro. **No** manda API key (el endpoint solo pide JWT) |
| `taletrack-netflix-extension` | detecta reproducción en Netflix y extrae título/temporada/episodio/progreso. **Todavía solo hace `console.log`**, no postea al backend (ver `TODO.txt`) |

> `SERVER_URL` en el koplugin está **hardcodeado** a `http://143.47.54.63` (la VM), no a localhost.
