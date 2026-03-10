# MediaTracker
System to automatically track user's media consumption, including films, seres, books and comics

## Levantar solo DB + migraciones (sin .NET local)

Si tu VM no tiene instalado .NET SDK, puedes correr las migraciones con Docker usando el servicio `migrator`.

1. Levanta Postgres:

```bash
docker compose up -d postgres
```

2. Ejecuta migraciones EF Core desde contenedor SDK:

```bash
docker compose --profile db run --rm migrator
```

Esto aplica `dotnet ef database update` contra la base de datos definida en `.env`.

## Variables importantes para VM

Para que el frontend en el navegador pueda llamar al backend, configura en `.env` una URL pública (no `backend:8080`):

```bash
NEXT_PUBLIC_API_URL=http://143.47.54.63:8080/api
CORS_ALLOWED_ORIGINS=http://143.47.54.63
```

Luego reconstruye el frontend:

```bash
docker compose up -d --build frontend backend
```
