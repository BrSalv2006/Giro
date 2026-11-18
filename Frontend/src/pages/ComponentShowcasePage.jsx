import { useState } from 'react'
import {
  BrandLogo,
  Button,
  TextField,
  Select,
  Checkbox,
  Toggle,
  StatusBadge,
  Avatar,
  MetricCard,
  VoteCounter,
  StoryCard,
  NotificationItem,
  SearchIcon,
  BellIcon,
  PlusIcon,
  SparklesIcon,
  CheckIcon,
  TrashIcon,
  EditIcon,
  FilterIcon,
  ClockIcon,
  CalendarIcon,
  ShieldCheckIcon,
  LogOutIcon,
  EyeIcon,
} from '../components/common'

export function ComponentShowcasePage() {
  // Estados para testes interactivos
  const [btnLoading, setBtnLoading] = useState(false)
  const [textVal, setTextVal] = useState('')
  const [hasError, setHasError] = useState(false)
  const [selectedTag, setSelectedTag] = useState('MELHORIA')
  const [multiTags, setMultiTags] = useState(['relatorios', 'prioridade'])
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [checkboxIndeterminate, setCheckboxIndeterminate] = useState(false)
  const [toggleState, setToggleState] = useState(true)
  const [voteCount, setVoteCount] = useState(42)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteMessage, setVoteMessage] = useState('')

  // Notificações interativas
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Sofia Martins mencionou-o num pedido',
      description: '«Poderias verificar a estimativa de esforço para os filtros avançados?»',
      timestamp: 'Há 5 minutos',
      read: false,
      type: 'comment',
    },
    {
      id: 'notif-2',
      title: 'Sprint 3 iniciado com 34 Story Points',
      description: 'O Sprint Backlog foi aprovado pelo Product Owner com 8 tarefas ativas.',
      timestamp: 'Há 2 horas',
      read: false,
      type: 'status',
    },
    {
      id: 'notif-3',
      title: 'Sugestão de priorização por IA disponível',
      description: 'O Gemini analisou 14 novos pedidos com pontuação média de impacto 8.5/10.',
      timestamp: 'Ontem às 18:30',
      read: true,
      type: 'ai',
    },
  ])

  const handleVote = (newVotes, votedState) => {
    setVoteCount(newVotes)
    setHasVoted(votedState)
    setVoteMessage(
      votedState
        ? '✓ Voto registado com sucesso! (limite de 1 voto ativo por utilizador)'
        : 'Voto cancelado.'
    )
  }

  const handleMarkRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="min-h-screen bg-bg-page text-fg-primary">
      {/* Top Banner de Contexto SCRUM */}
      <div className="bg-fg-primary text-white text-xs px-6 py-2 flex flex-wrap items-center justify-between border-b border-border-control">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-action text-white font-medium">
            <SparklesIcon size={12} /> Sprint 4 · SCRM-22
          </span>
          <span className="text-border-subtle">
            Engenharia de Software — Plataforma GIRO (Figma para Código)
          </span>
        </div>
        <div className="flex items-center gap-4 text-border-subtle">
          <span>React 19 + Vite 8</span>
          <span>•</span>
          <span>Tailwind CSS v4 (@theme)</span>
          <span>•</span>
          <span className="text-white font-medium">Fase 1: Componentes & Design Tokens</span>
        </div>
      </div>

      {/* Cabeçalho do Showcase */}
      <header className="bg-bg-surface border-b border-border-subtle sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo layout="full" size="md" subtitle="Design System & Componentes (Figma Canvas 02)" />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a
              href="#tokens"
              className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-brand-action hover:bg-brand-selection transition-colors font-medium"
            >
              Cores
            </a>
            <a
              href="#buttons"
              className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-brand-action hover:bg-brand-selection transition-colors font-medium"
            >
              Botões
            </a>
            <a
              href="#forms"
              className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-brand-action hover:bg-brand-selection transition-colors font-medium"
            >
              Formulários
            </a>
            <a
              href="#badges"
              className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-brand-action hover:bg-brand-selection transition-colors font-medium"
            >
              Badges
            </a>
            <a
              href="#cards"
              className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-brand-action hover:bg-brand-selection transition-colors font-medium"
            >
              Cartões
            </a>
            <a
              href="#notifications"
              className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-brand-action hover:bg-brand-selection transition-colors font-medium"
            >
              Notificações
            </a>
            <a
              href="#icons"
              className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-brand-action hover:bg-brand-selection transition-colors font-medium"
            >
              Ícones
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-16">
        {/* SECÇÃO 1: TOKENS DE COR */}
        <section id="tokens" className="space-y-6 scroll-mt-24">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
              01 — Identidade Visual
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
              Paleta Cromática & Design Tokens (Figma Canvas 01)
            </h2>
            <p className="text-sm text-fg-secondary mt-1">
              Valores extraídos das 264 variáveis do Figma, mapeados diretamente em classes Tailwind e variáveis CSS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-sm shadow-inner">
                #E6533D
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Marca / Ícone</p>
                <p className="text-xs text-fg-secondary">Color/Brand/Primary</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-brand-action flex items-center justify-center text-white font-bold text-sm shadow-inner">
                #B93826
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Ação / Botão Principal</p>
                <p className="text-xs text-fg-secondary">Color/Action/Default</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-brand-hover flex items-center justify-center text-white font-bold text-sm shadow-inner">
                #9A2C1E
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Hover de Ação</p>
                <p className="text-xs text-fg-secondary">Color/Action/Hover</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-brand-pressed flex items-center justify-center text-white font-bold text-sm shadow-inner">
                #7B2118
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Pressed de Ação</p>
                <p className="text-xs text-fg-secondary">Color/Action/Pressed</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-brand-selection border border-brand-primary flex items-center justify-center text-brand-action font-bold text-sm">
                #FFE3DC
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Seleção / Tint</p>
                <p className="text-xs text-fg-secondary">Color/Background/Selection</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-bg-page border border-border-subtle flex items-center justify-center text-fg-primary font-bold text-sm">
                #F1F2F4
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Fundo da Aplicação</p>
                <p className="text-xs text-fg-secondary">Color/Background/Page</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-bg-surface border border-border-subtle flex items-center justify-center text-fg-primary font-bold text-sm">
                #FFFFFF
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Superfície / Cartão</p>
                <p className="text-xs text-fg-secondary">Color/Background/Surface</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-fg-primary flex items-center justify-center text-white font-bold text-sm">
                #292D35
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Texto Primário</p>
                <p className="text-xs text-fg-secondary">Color/Foreground/Primary</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-fg-secondary flex items-center justify-center text-white font-bold text-sm">
                #626976
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Texto Secundário</p>
                <p className="text-xs text-fg-secondary">Color/Foreground/Secondary</p>
              </div>
            </div>

            <div className="bg-bg-surface p-4 rounded-lg border border-border-subtle shadow-xs space-y-2">
              <div className="h-16 rounded bg-border-subtle flex items-center justify-center text-fg-primary font-bold text-sm">
                #CDD1D8
              </div>
              <div>
                <p className="font-semibold text-xs text-fg-primary">Contornos & Divisórias</p>
                <p className="text-xs text-fg-secondary">Color/Border/Subtle</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECÇÃO 2: TIPOGRAFIA */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
              02 — Tipografia
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
              Família Tipográfica Inter (Google Fonts)
            </h2>
            <p className="text-sm text-fg-secondary mt-1">
              Hierarquia tipográfica rigorosamente alinhada com as especificações do Figma Canvas 01.
            </p>
          </div>

          <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle space-y-4">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border-subtle pb-3 gap-2">
              <div>
                <span className="text-xs text-fg-secondary block mb-1">Título do Ecrã (28px · Bold · 36px line)</span>
                <span className="text-2xl font-bold tracking-tight">Plataforma de Gestão de Roadmap e Pedidos</span>
              </div>
              <span className="text-xs text-fg-secondary font-mono">text-2xl font-bold leading-9</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border-subtle pb-3 gap-2">
              <div>
                <span className="text-xs text-fg-secondary block mb-1">Título de Secção (20px · SemiBold · 28px line)</span>
                <span className="text-xl font-semibold tracking-tight">Painel Interativo de Priorização e Votação</span>
              </div>
              <span className="text-xs text-fg-secondary font-mono">text-xl font-semibold leading-7</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border-subtle pb-3 gap-2">
              <div>
                <span className="text-xs text-fg-secondary block mb-1">Título de Cartão (16px · SemiBold · 24px line)</span>
                <span className="text-base font-semibold">Adicionar filtros combinados de pesquisa</span>
              </div>
              <span className="text-xs text-fg-secondary font-mono">text-base font-semibold leading-6</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border-subtle pb-3 gap-2">
              <div>
                <span className="text-xs text-fg-secondary block mb-1">Texto Normal / Corpo (16px · Regular · 24px line)</span>
                <span className="text-base text-fg-primary">
                  O sistema permite filtrar tarefas por categoria, estado Kanban e membro da Development Team.
                </span>
              </div>
              <span className="text-xs text-fg-secondary font-mono">text-base font-normal leading-6</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
              <div>
                <span className="text-xs text-fg-secondary block mb-1">Texto de Menus e Botões (14px · Medium · 20px line)</span>
                <span className="text-sm font-medium">Submeter novo pedido · Cancelar alteração · Exportar CSV</span>
              </div>
              <span className="text-xs text-fg-secondary font-mono">text-sm font-medium leading-5</span>
            </div>
          </div>
        </section>

        {/* SECÇÃO 3: BOTÕES */}
        <section id="buttons" className="space-y-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
                03 — Controlos de Ação
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
                Botões & Estados Interativos (Button.jsx)
              </h2>
              <p className="text-sm text-fg-secondary mt-1">
                Variantes Primary, Secondary e Tertiary com altura padrão de 44px e raio de 8px.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setBtnLoading(true)
                setTimeout(() => setBtnLoading(false), 2000)
              }}
              icon={<SparklesIcon size={16} />}
            >
              Simular Loading (2s)
            </Button>
          </div>

          <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase text-fg-secondary mb-3">Variantes Base</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" icon={<PlusIcon size={18} />}>
                  Criar Pedido
                </Button>
                <Button variant="secondary" icon={<FilterIcon size={18} />}>
                  Filtrar Resultados
                </Button>
                <Button variant="tertiary" icon={<EyeIcon size={18} />}>
                  Ver Detalhes
                </Button>
                <Button variant="primary" loading={btnLoading}>
                  Guardar Alterações
                </Button>
                <Button variant="primary" disabled>
                  Desativado
                </Button>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-6">
              <h4 className="text-xs font-bold uppercase text-fg-secondary mb-3">Tamanhos</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" variant="primary">
                  Pequeno (36px)
                </Button>
                <Button size="md" variant="primary">
                  Padrão (44px)
                </Button>
                <Button size="lg" variant="primary">
                  Grande (50px)
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECÇÃO 4: FORMULÁRIOS & CAMPOS */}
        <section id="forms" className="space-y-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
                04 — Entradas de Texto
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
                Campos de Texto & Validação (TextField.jsx)
              </h2>
              <p className="text-sm text-fg-secondary mt-1">
                Suporte a rótulos, ícones, foco com anel azul #005FCC e estado de erro com fundo peach #FFE3DC.
              </p>
            </div>
            <Button
              variant="tertiary"
              onClick={() => setHasError(!hasError)}
              className="text-xs"
            >
              {hasError ? 'Remover Erro' : 'Simular Estado de Erro'}
            </Button>
          </div>

          <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Título do Pedido"
              required
              placeholder="Ex.: Adicionar filtros combinados de pesquisa"
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              helperText="Indique de forma sucinta a funcionalidade desejada."
              error={hasError ? 'O título do pedido é obrigatório.' : ''}
            />

            <TextField
              label="Pesquisa com Ícone"
              icon={<SearchIcon size={18} />}
              placeholder="Pesquisar pedidos por título ou palavras-chave..."
              helperText="Sugestões automáticas instantâneas."
            />

            <TextField
              label="Campo Desativado"
              disabled
              value="Identificador gerado: GIRO-REQ-104"
              helperText="Este campo é gerado automaticamente pelo sistema."
            />

            <TextField
              label="Prazo de Entrega Estimado"
              icon={<CalendarIcon size={18} />}
              placeholder="DD/MM/AAAA"
              helperText="Data limite acordada com o Product Owner."
            />
          </div>
        </section>

        {/* SECÇÃO 5: SELETORES, CHECKBOXES & TOGGLES */}
        <section id="selectors" className="space-y-6 scroll-mt-24">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
              05 — Seletores & Alternadores
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
              Select, Checkbox & Toggle (Canvas 02 Figma)
            </h2>
            <p className="text-sm text-fg-secondary mt-1">
              Dropdowns com pesquisa e seleção múltipla, checkboxes acessíveis e switches no estilo Figma.
            </p>
          </div>

          <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-fg-secondary">Seletores (Select.jsx)</h4>
              <Select
                label="Categoria Funcional (Seleção Única)"
                options={[
                  { value: 'NOVA_FUNCIONALIDADE', label: 'Nova Funcionalidade', description: 'Requisito novo para o sistema' },
                  { value: 'MELHORIA', label: 'Melhoria de Usabilidade', description: 'Otimização de interface existente' },
                  { value: 'CORRECAO', label: 'Correção de Erro', description: 'Resolução de anomalia reportada' },
                  { value: 'INTEGRACAO', label: 'Integração Externa', description: 'Ligação com Gemini ou Jira' },
                ]}
                value={selectedTag}
                onChange={setSelectedTag}
                helperText="Classificação para cálculo do impacto no negócio."
              />

              <Select
                label="Etiquetas do Pedido (Multi-seleção com Tags)"
                multiple
                searchable
                options={[
                  { value: 'relatorios', label: 'Relatórios' },
                  { value: 'prioridade', label: 'Prioridade IA' },
                  { value: 'kanban', label: 'Kanban' },
                  { value: 'roadmap', label: 'Roadmap' },
                  { value: 'seguranca', label: 'Segurança' },
                ]}
                value={multiTags}
                onChange={setMultiTags}
                helperText="Pesquise e selecione múltiplas etiquetas para filtragem combinada."
              />
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase text-fg-secondary mb-3">Checkboxes (Checkbox.jsx)</h4>
                <div className="space-y-3">
                  <Checkbox
                    label="Notificar equipa por correio eletrónico"
                    helperText="Envia um sumário diário das alterações de estado às 08:00 UTC."
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                  />
                  <Checkbox
                    label="Selecionar todas as tarefas do Sprint"
                    helperText="Estado indeterminado para seleção parcial."
                    indeterminate={checkboxIndeterminate}
                    onChange={() => setCheckboxIndeterminate(!checkboxIndeterminate)}
                  />
                  <Checkbox
                    label="Opção desativada sem permissões"
                    disabled
                    checked={false}
                  />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6">
                <h4 className="text-xs font-bold uppercase text-fg-secondary mb-3">Toggles (Toggle.jsx)</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Recomendações automáticas por IA</p>
                      <p className="text-xs text-fg-secondary">
                        Invoca o modelo Gemini para sugerir posicionamento na matriz 2×2.
                      </p>
                    </div>
                    <Toggle checked={toggleState} onChange={setToggleState} />
                  </div>
                  <div className="flex items-center justify-between opacity-60">
                    <div>
                      <p className="text-sm font-medium">Modo Escuro (Dark Mode)</p>
                      <p className="text-xs text-fg-secondary">Variáveis Dark prontas nos tokens Figma.</p>
                    </div>
                    <Toggle checked={false} disabled />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECÇÃO 6: BADGES & AVATARES */}
        <section id="badges" className="space-y-6 scroll-mt-24">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
              06 — Etiquetas & Presença
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
              StatusBadges & Avatares (StatusBadge.jsx & Avatar.jsx)
            </h2>
            <p className="text-sm text-fg-secondary mt-1">
              Os 5 estados oficiais do ciclo de vida das funcionalidades com cores e opacidades extraídas do Figma.
            </p>
          </div>

          <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase text-fg-secondary mb-3">
                Estilo Pill (Figma: Style=Pill)
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="pending" style="pill" showDot />
                <StatusBadge status="analysis" style="pill" showDot />
                <StatusBadge status="development" style="pill" showDot />
                <StatusBadge status="complete" style="pill" showDot />
                <StatusBadge status="rejected" style="pill" showDot />
              </div>
            </div>

            <div className="border-t border-border-subtle pt-6">
              <h4 className="text-xs font-bold uppercase text-fg-secondary mb-3">
                Estilo Subtle (Figma: Style=Subtle)
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="pending" style="subtle" />
                <StatusBadge status="analysis" style="subtle" />
                <StatusBadge status="development" style="subtle" />
                <StatusBadge status="complete" style="subtle" />
                <StatusBadge status="rejected" style="subtle" />
              </div>
            </div>

            <div className="border-t border-border-subtle pt-6">
              <h4 className="text-xs font-bold uppercase text-fg-secondary mb-3">
                Avatares da Equipa (Tamanhos 24, 28, 32, 36, 40, 48px)
              </h4>
              <div className="flex flex-wrap items-end gap-6">
                <div className="text-center space-y-1">
                  <Avatar name="Sofia Martins" size={48} status="online" />
                  <span className="text-[10px] text-fg-secondary block">48px (PO)</span>
                </div>
                <div className="text-center space-y-1">
                  <Avatar name="Alexandre Ribeiro" size={40} status="busy" />
                  <span className="text-[10px] text-fg-secondary block">40px (SM)</span>
                </div>
                <div className="text-center space-y-1">
                  <Avatar name="Diogo Nogueira" size={36} status="online" />
                  <span className="text-[10px] text-fg-secondary block">36px (Dev)</span>
                </div>
                <div className="text-center space-y-1">
                  <Avatar name="Bruno Salvador" size={32} status="online" />
                  <span className="text-[10px] text-fg-secondary block">32px (Dev)</span>
                </div>
                <div className="text-center space-y-1">
                  <Avatar name="Rúben Lopes" size={28} status="none" />
                  <span className="text-[10px] text-fg-secondary block">28px (Dev)</span>
                </div>
                <div className="text-center space-y-1">
                  <Avatar name="Letizia Coelli" size={24} status="none" />
                  <span className="text-[10px] text-fg-secondary block">24px (Dev)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECÇÃO 7: CARTÕES, MÉTRICAS & VOTAÇÃO */}
        <section id="cards" className="space-y-6 scroll-mt-24">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
              07 — Cartões & Indicadores
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
              MetricCard, StoryCard & VoteCounter (Interativo)
            </h2>
            <p className="text-sm text-fg-secondary mt-1">
              Componentes ricos com lógica de negócio incorporada (voto único por utilizador e cartões Kanban).
            </p>
          </div>

          {/* Linha de KPIs (MetricCard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Pedidos Submetidos"
              value="128"
              change="+14.2%"
              trend="positive"
              icon={<SparklesIcon size={20} />}
              subtitle="Face ao sprint anterior"
            />
            <MetricCard
              title="Cycle Time Médio"
              value="4.2 dias"
              change="-18.0%"
              trend="positive"
              icon={<ClockIcon size={20} />}
              subtitle="Meta: < 5 dias úteis"
            />
            <MetricCard
              title="Capacidade Utilizada"
              value="87.5%"
              change="+2.5%"
              trend="neutral"
              icon={<CalendarIcon size={20} />}
              subtitle="35 de 40 SP atribuídos"
            />
            <MetricCard
              title="Tarefas Bloqueadas"
              value="2"
              change="+1"
              trend="negative"
              icon={<ShieldCheckIcon size={20} />}
              subtitle="Aguardam revisão técnica"
            />
          </div>

          {/* StoryCard e VoteCounter lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-bg-surface p-6 rounded-lg border border-border-subtle space-y-4">
              <h4 className="text-xs font-bold uppercase text-fg-secondary">
                Cartões de Histórias (StoryCard.jsx para Kanban e Backlog)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StoryCard
                  code="US-01"
                  title="Submeter pedidos de funcionalidade pelo cliente com validação rápida"
                  storyPoints={5}
                  priority="Alta"
                  assignee={{ name: 'Bruno Salvador' }}
                />
                <StoryCard
                  code="US-14"
                  title="Identificar e assinalar bloqueios em grafo acíclico de dependências"
                  storyPoints={8}
                  priority="Crítica"
                  blocked
                  blockedReason="Aguardando aprovação da arquitetura de persistência Prisma."
                  assignee={{ name: 'Diogo Nogueira' }}
                />
              </div>
            </div>

            <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase text-fg-secondary mb-2">
                  Votação Única (VoteCounter.jsx)
                </h4>
                <p className="text-xs text-fg-secondary">
                  Garante o cumprimento da regra de unicidade: cada utilizador pode votar apenas uma vez por pedido.
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-bg-page border border-border-subtle">
                <VoteCounter
                  votes={voteCount}
                  initialVoted={hasVoted}
                  onVote={handleVote}
                />
                <div>
                  <p className="text-sm font-semibold">«Filtros Avançados de Relatórios»</p>
                  <p className="text-xs text-fg-secondary">
                    {hasVoted ? 'Você já votou neste pedido.' : 'Clique na seta para apoiar este pedido.'}
                  </p>
                </div>
              </div>

              {voteMessage && (
                <div className="p-2.5 rounded bg-brand-selection text-brand-action text-xs font-medium border border-brand-primary">
                  {voteMessage}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECÇÃO 8: NOTIFICAÇÕES */}
        <section id="notifications" className="space-y-6 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
                08 — Feed de Notificações
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
                Centro de Notificações (NotificationItem.jsx)
              </h2>
              <p className="text-sm text-fg-secondary mt-1">
                Itens com indicador azul de não lida, categorização visual e ações rápidas de leitura e descarte.
              </p>
            </div>
            <Button
              variant="tertiary"
              onClick={() =>
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
              }
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          </div>

          <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-fg-secondary text-center py-6">
                Não existem notificações ativas de momento.
              </p>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  id={notif.id}
                  title={notif.title}
                  description={notif.description}
                  timestamp={notif.timestamp}
                  read={notif.read}
                  type={notif.type}
                  onMarkRead={handleMarkRead}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </div>
        </section>

        {/* SECÇÃO 9: ÍCONES FIGMA */}
        <section id="icons" className="space-y-6 scroll-mt-24">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-action">
              09 — Catálogo de Assets
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-fg-primary">
              Ícones SVG do Figma (Icons.jsx)
            </h2>
            <p className="text-sm text-fg-secondary mt-1">
              Todos os glyphs de ícones extraídos do Canvas 02 do Figma, disponíveis como componentes individuais e dinâmicos.
            </p>
          </div>

          <div className="bg-bg-surface p-6 rounded-lg border border-border-subtle grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 text-center">
            {[
              { name: 'Search', icon: <SearchIcon /> },
              { name: 'Bell', icon: <BellIcon /> },
              { name: 'Filter', icon: <FilterIcon /> },
              { name: 'Plus', icon: <PlusIcon /> },
              { name: 'Check', icon: <CheckIcon /> },
              { name: 'Edit', icon: <EditIcon /> },
              { name: 'Trash', icon: <TrashIcon /> },
              { name: 'Sparkles', icon: <SparklesIcon /> },
              { name: 'Clock', icon: <ClockIcon /> },
              { name: 'Calendar', icon: <CalendarIcon /> },
              { name: 'ShieldCheck', icon: <ShieldCheckIcon /> },
              { name: 'LogOut', icon: <LogOutIcon /> },
              { name: 'Eye', icon: <EyeIcon /> },
            ].map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-lg border border-border-subtle hover:border-brand-primary hover:bg-brand-selection/50 transition-colors flex flex-col items-center gap-2 group"
              >
                <div className="text-fg-primary group-hover:text-brand-action transition-colors">
                  {item.icon}
                </div>
                <span className="text-[11px] text-fg-secondary font-medium truncate w-full">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Rodapé da Aplicação */}
      <footer className="border-t border-border-subtle bg-bg-surface mt-20 py-8 text-center text-xs text-fg-secondary">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p className="font-semibold text-fg-primary">
            GIRO — Plataforma de Gestão de Feature Requests e Roadmap de Produto
          </p>
          <p>
            Engenharia de Software 2026 · Universidade da Beira Interior · Trabalho de Grupo SCRUM (Sprint 4)
          </p>
          <p className="text-[11px] text-border-control">
            Design Tokens e Componentes sincronizados 1:1 com o Figma oficial.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default ComponentShowcasePage

