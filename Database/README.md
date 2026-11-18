# Base de dados PostgreSQL

Esta pasta contém o SQL de inicialização da base de dados GIRO, gerado a
partir de `Giro/Backend/prisma/schema.prisma`.

## Arranque com Docker

Na pasta `Giro/Database`, execute:

```powershell
docker compose up -d
```

O PostgreSQL fica disponível em:

```text
host: localhost
porta: 5432
base de dados: giro
utilizador: giro
palavra-passe: giro
```

Configure o backend em `Giro/Backend/.env`:

```text
DATABASE_URL=postgresql://giro:giro@localhost:5432/giro?schema=public
REPOSITORY_MODE=prisma
```

Depois, gere o cliente Prisma e arranque o backend:

```powershell
cd ..\Backend
npm run prisma:generate
npm start
```

## Inicialização manual

Com uma base PostgreSQL vazia criada e ativa, aplique:

```powershell
psql -d giro -f init.sql
```

O ficheiro `init.sql` cria os tipos enum, as 11 tabelas, os índices, as
chaves únicas e todas as relações estrangeiras. Não é necessário executar
`init.sql` novamente num volume Docker já inicializado.

## Migração Prisma

Para manutenção futura, edite primeiro `Giro/Backend/prisma/schema.prisma`.
Depois valide o esquema e gere uma migração no backend:

```powershell
npm run prisma:validate
npm run prisma:migrate
```
