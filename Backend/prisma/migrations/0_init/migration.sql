-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "PapelUtilizador" AS ENUM ('P01', 'P02', 'P03', 'P04', 'P05');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('SUBMETIDO', 'EM_ANALISE', 'APROVADO', 'PLANEADO', 'EM_DESENVOLVIMENTO', 'CONCLUIDO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('ALTERACAO_ESTADO', 'NOVO_COMENTARIO', 'NOVO_VOTO', 'ATRIBUICAO', 'ALERTA');

-- CreateEnum
CREATE TYPE "EstadoSprint" AS ENUM ('PLANEADO', 'ATIVO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoTecnico" AS ENUM ('BACKLOG', 'TODO', 'EM_PROGRESSO', 'EM_REVISAO', 'CONCLUIDO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoDependencia" AS ENUM ('PRECEDE', 'BLOQUEIA', 'RELACIONADA');

-- CreateTable
CREATE TABLE "Utilizador" (
    "id_utilizador" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "papel" "PapelUtilizador" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_registo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilizador_pkey" PRIMARY KEY ("id_utilizador")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id_pedido" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estado" "EstadoPedido" NOT NULL DEFAULT 'SUBMETIDO',
    "esforco_estimado" INTEGER,
    "impacto_negocio" INTEGER,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_autor" UUID NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "HistoricoPedido" (
    "id_historico" UUID NOT NULL,
    "titulo_anterior" TEXT,
    "descricao_anterior" TEXT,
    "categoria_anterior" TEXT,
    "estado_anterior" "EstadoPedido",
    "data_alteracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_pedido" UUID NOT NULL,
    "id_editor" UUID NOT NULL,

    CONSTRAINT "HistoricoPedido_pkey" PRIMARY KEY ("id_historico")
);

-- CreateTable
CREATE TABLE "Voto" (
    "id_voto" UUID NOT NULL,
    "data_voto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilizador" UUID NOT NULL,
    "id_pedido" UUID NOT NULL,

    CONSTRAINT "Voto_pkey" PRIMARY KEY ("id_voto")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id_comentario" UUID NOT NULL,
    "conteudo" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilizador" UUID NOT NULL,
    "id_pedido" UUID NOT NULL,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id_notificacao" UUID NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilizador" UUID NOT NULL,
    "id_pedido" UUID,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id_notificacao")
);

-- CreateTable
CREATE TABLE "Log" (
    "id_log" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "detalhes" JSONB,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilizador" UUID NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id_log")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id_sprint" UUID NOT NULL,
    "numero_sprint" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "capacidade_maxima" INTEGER,
    "estado" "EstadoSprint" NOT NULL DEFAULT 'PLANEADO',

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id_sprint")
);

-- CreateTable
CREATE TABLE "RoadmapRelease" (
    "id_release" UUID NOT NULL,
    "titulo_release" TEXT NOT NULL,
    "descricao" TEXT,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "marco_critico" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RoadmapRelease_pkey" PRIMARY KEY ("id_release")
);

-- CreateTable
CREATE TABLE "UserStory" (
    "id_tarefa" UUID NOT NULL,
    "codigo_us" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criterios_aceitacao" TEXT NOT NULL,
    "estado_tecnico" "EstadoTecnico" NOT NULL DEFAULT 'BACKLOG',
    "story_points" INTEGER,
    "tempo_registado" INTEGER,
    "id_pedido" UUID NOT NULL,
    "id_sprint" UUID,
    "id_responsavel" UUID,
    "id_release" UUID,

    CONSTRAINT "UserStory_pkey" PRIMARY KEY ("id_tarefa")
);

-- CreateTable
CREATE TABLE "Dependencia" (
    "id_dependencia" UUID NOT NULL,
    "tipo_dependencia" "TipoDependencia" NOT NULL,
    "id_tarefa_origem" UUID NOT NULL,
    "id_tarefa_destino" UUID NOT NULL,

    CONSTRAINT "Dependencia_pkey" PRIMARY KEY ("id_dependencia")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");

-- CreateIndex
CREATE INDEX "Pedido_id_autor_idx" ON "Pedido"("id_autor");

-- CreateIndex
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Pedido_titulo_trgm_idx" ON "Pedido" USING gin ("titulo" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Pedido_descricao_trgm_idx" ON "Pedido" USING gin ("descricao" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "HistoricoPedido_id_pedido_data_alteracao_idx" ON "HistoricoPedido"("id_pedido", "data_alteracao");

-- CreateIndex
CREATE INDEX "HistoricoPedido_id_editor_idx" ON "HistoricoPedido"("id_editor");

-- CreateIndex
CREATE INDEX "Voto_id_pedido_idx" ON "Voto"("id_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "Voto_id_utilizador_id_pedido_key" ON "Voto"("id_utilizador", "id_pedido");

-- CreateIndex
CREATE INDEX "Comentario_id_pedido_data_criacao_idx" ON "Comentario"("id_pedido", "data_criacao");

-- CreateIndex
CREATE INDEX "Comentario_id_utilizador_idx" ON "Comentario"("id_utilizador");

-- CreateIndex
CREATE INDEX "Notificacao_id_utilizador_lida_idx" ON "Notificacao"("id_utilizador", "lida");

-- CreateIndex
CREATE INDEX "Notificacao_id_pedido_idx" ON "Notificacao"("id_pedido");

-- CreateIndex
CREATE INDEX "Log_id_utilizador_data_hora_idx" ON "Log"("id_utilizador", "data_hora");

-- CreateIndex
CREATE INDEX "Log_recurso_idx" ON "Log"("recurso");

-- CreateIndex
CREATE UNIQUE INDEX "Sprint_numero_sprint_key" ON "Sprint"("numero_sprint");

-- CreateIndex
CREATE INDEX "Sprint_estado_idx" ON "Sprint"("estado");

-- CreateIndex
CREATE INDEX "RoadmapRelease_data_inicio_data_fim_idx" ON "RoadmapRelease"("data_inicio", "data_fim");

-- CreateIndex
CREATE UNIQUE INDEX "UserStory_codigo_us_key" ON "UserStory"("codigo_us");

-- CreateIndex
CREATE INDEX "UserStory_id_pedido_idx" ON "UserStory"("id_pedido");

-- CreateIndex
CREATE INDEX "UserStory_id_sprint_idx" ON "UserStory"("id_sprint");

-- CreateIndex
CREATE INDEX "UserStory_id_responsavel_idx" ON "UserStory"("id_responsavel");

-- CreateIndex
CREATE INDEX "UserStory_id_release_idx" ON "UserStory"("id_release");

-- CreateIndex
CREATE INDEX "UserStory_estado_tecnico_idx" ON "UserStory"("estado_tecnico");

-- CreateIndex
CREATE INDEX "Dependencia_id_tarefa_destino_idx" ON "Dependencia"("id_tarefa_destino");

-- CreateIndex
CREATE UNIQUE INDEX "Dependencia_id_tarefa_origem_id_tarefa_destino_key" ON "Dependencia"("id_tarefa_origem", "id_tarefa_destino");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_id_autor_fkey" FOREIGN KEY ("id_autor") REFERENCES "Utilizador"("id_utilizador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoPedido" ADD CONSTRAINT "HistoricoPedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "Pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoPedido" ADD CONSTRAINT "HistoricoPedido_id_editor_fkey" FOREIGN KEY ("id_editor") REFERENCES "Utilizador"("id_utilizador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_id_utilizador_fkey" FOREIGN KEY ("id_utilizador") REFERENCES "Utilizador"("id_utilizador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "Pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_id_utilizador_fkey" FOREIGN KEY ("id_utilizador") REFERENCES "Utilizador"("id_utilizador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "Pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_id_utilizador_fkey" FOREIGN KEY ("id_utilizador") REFERENCES "Utilizador"("id_utilizador") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "Pedido"("id_pedido") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_id_utilizador_fkey" FOREIGN KEY ("id_utilizador") REFERENCES "Utilizador"("id_utilizador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "Pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_id_sprint_fkey" FOREIGN KEY ("id_sprint") REFERENCES "Sprint"("id_sprint") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "Utilizador"("id_utilizador") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_id_release_fkey" FOREIGN KEY ("id_release") REFERENCES "RoadmapRelease"("id_release") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependencia" ADD CONSTRAINT "Dependencia_id_tarefa_origem_fkey" FOREIGN KEY ("id_tarefa_origem") REFERENCES "UserStory"("id_tarefa") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependencia" ADD CONSTRAINT "Dependencia_id_tarefa_destino_fkey" FOREIGN KEY ("id_tarefa_destino") REFERENCES "UserStory"("id_tarefa") ON DELETE CASCADE ON UPDATE CASCADE;

