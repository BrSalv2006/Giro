# Prisma

O esquema PostgreSQL está em `schema.prisma` e modela as 11 tabelas da
arquitetura. A aplicação deve fornecer `DATABASE_URL` através do ambiente,
por exemplo:

```text
DATABASE_URL="postgresql://utilizador:palavra-passe@localhost:5432/giro?schema=public"
```

Para usar PostgreSQL, copie `.env.example` para `.env`, defina uma
`DATABASE_URL` válida e altere `REPOSITORY_MODE` para `prisma`. Não
commite o ficheiro `.env`, porque pode conter credenciais.

Depois, instale as dependências e valide/ gere o cliente:

```powershell
npm install
npm run prisma:validate
npm run prisma:generate
```

Com uma instância PostgreSQL acessível em `DATABASE_URL`, crie/aplique as
migrações com:

```powershell
npm run prisma:migrate
# Em CI/produção:
npm run prisma:deploy
```

O modo `memory` continua disponível apenas para desenvolvimento e testes;
produção exige `REPOSITORY_MODE=prisma`.
