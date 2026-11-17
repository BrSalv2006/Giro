import { useState } from 'react'
import {
  Button,
  Avatar,
  StatusBadge,
} from '../components/common'
import {
  Send,
  Paperclip,
  Hash,
  Pin,
  AtSign,
  FileText,
  ExternalLink,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useModal } from '../context/ModalContext.jsx'

function useSafeData() {
  try {
    return useData() || {}
  } catch {
    return {}
  }
}

function useSafeModal() {
  try {
    return useModal() || {}
  } catch {
    return {}
  }
}

const DEFAULT_MEMBERS = [
  { name: 'Sofia Costa', role: 'Product Owner', initials: 'SC', status: 'online' },
  { name: 'Inês Martins', role: 'Scrum Master', initials: 'IM', status: 'online' },
  { name: 'Rafael Silva', role: 'Developer', initials: 'RS', status: 'online' },
  { name: 'Diogo Ferreira', role: 'Administrador', initials: 'DF', status: 'away' },
  { name: 'Miguel Alves', role: 'Cliente', initials: 'MA', status: 'offline' },
]

const DEFAULT_CHANNELS = [
  { id: 'geral', label: '#geral', desc: 'Canal de anúncios e comunicação geral da equipa Giro', unread: 0 },
  { id: 'sprint-12', label: '#sprint-12', desc: 'Acompanhamento do sprint corrente e alinhamento diário', unread: 2 },
  { id: 'bugs-alertas', label: '#bugs-alertas', desc: 'Relato urgente de impedimentos e bugs em produção', unread: 1 },
  { id: 'decisoes-produto', label: '#decisoes-produto', desc: 'Registo de decisões do PO e aprovação de requisitos', unread: 0 },
]

const INITIAL_MESSAGES_STORE = {
  'geral': [
    {
      id: 'm1',
      sender: { name: 'Diogo Ferreira', role: 'Administrador', initials: 'DF' },
      content: 'Bem-vindos à nova versão da plataforma Giro! O ambiente de testes com RBAC está ativo.',
      timestamp: 'Hoje às 09:15',
      reactions: { '👍': 3, '🚀': 2 },
    },
    {
      id: 'm2',
      sender: { name: 'Sofia Costa', role: 'Product Owner', initials: 'SC' },
      content: 'Lembrem-se que a priorização dos pedidos para a Sprint 13 encerra esta sexta-feira no painel interativo.',
      timestamp: 'Hoje às 10:00',
      reactions: { '❤️': 4 },
    },
  ],
  'sprint-12': [
    {
      id: 'm3',
      sender: { name: 'Inês Martins', role: 'Scrum Master', initials: 'IM' },
      content: 'Daily standup concluído. Restam 3 dias de Sprint 12 e já temos 21% dos story points concluídos.',
      timestamp: 'Hoje às 10:45',
      reactions: { '🎯': 3 },
    },
    {
      id: 'm4',
      sender: { name: 'Rafael Silva', role: 'Developer', initials: 'RS' },
      content: 'Aviso de impedimento: Na #US-42 (Voto único RNF-SEG-03), aguardo validação final da chave única na base de dados.',
      timestamp: 'Hoje às 11:20',
      taskRef: { id: 'US-42', title: 'Persistir votos únicos de utilizadores por pedido (RNF-SEG-03)', status: 'in_progress', points: 3 },
      reactions: { '👀': 2 },
    },
    {
      id: 'm5',
      sender: { name: 'Sofia Costa', role: 'Product Owner', initials: 'SC' },
      content: 'Obrigada @Rafael Silva. Vou pedir prioridade ao Diogo Ferreira para desbloquear a migração ainda hoje.',
      timestamp: 'Hoje às 11:35',
      reactions: { '🙏': 2 },
    },
  ],
  'bugs-alertas': [
    {
      id: 'm6',
      sender: { name: 'Rafael Silva', role: 'Developer', initials: 'RS' },
      content: 'Aviso: Identificado bloqueio externo temporário na API de testes. A US-31 e US-42 têm dependência registada.',
      timestamp: 'Hoje às 11:05',
      taskRef: { id: 'US-31', title: 'Filtrar pedidos por categoria e estado de análise', status: 'in_progress', points: 5 },
      reactions: { '⚠️': 3 },
    },
  ],
  'decisoes-produto': [
    {
      id: 'm7',
      sender: { name: 'Sofia Costa', role: 'Product Owner', initials: 'SC' },
      content: 'Decisão oficial: O módulo de PDF e relatórios (RF-12) foi agendado para arranque na Sprint 13.',
      timestamp: 'Hoje às 09:40',
      reactions: { '✅': 4 },
    },
  ],
}

/**
 * TeamWorkspacePage Component
 * Conforme Figma frame 325:2488 ("Team Workspace", 1600x1200)
 */
export function TeamWorkspacePage() {
  const dataContext = useSafeData()
  const modalContext = useSafeModal()

  const [activeChannelId, setActiveChannelId] = useState('sprint-12')
  const [messages, setMessages] = useState(INITIAL_MESSAGES_STORE)
  const [inputText, setInputText] = useState('')
  const [activeReactionToast, setActiveReactionToast] = useState('')

  const activeChannel = DEFAULT_CHANNELS.find((c) => c.id === activeChannelId) || DEFAULT_CHANNELS[1]
  const currentMessages = messages[activeChannelId] || []

  const handleSendMessage = (e) => {
    e?.preventDefault()
    if (!inputText.trim()) return

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: { name: 'Sofia Costa', role: 'Product Owner', initials: 'SC' },
      content: inputText,
      timestamp: 'Agora mesmo',
      reactions: {},
    }

    setMessages((prev) => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
    }))

    if (dataContext.addMessage) {
      dataContext.addMessage(activeChannelId, inputText)
    }

    setInputText('')
  }

  const handleAddReaction = (msgId, emoji) => {
    setMessages((prev) => ({
      ...prev,
      [activeChannelId]: (prev[activeChannelId] || []).map((m) => {
        if (m.id !== msgId) return m
        const currentCount = m.reactions?.[emoji] || 0
        return {
          ...m,
          reactions: {
            ...m.reactions,
            [emoji]: currentCount + 1,
          },
        }
      }),
    }))
    setActiveReactionToast(`Reagiu com ${emoji}`)
    setTimeout(() => setActiveReactionToast(''), 2000)
  }

  return (
    <div className="min-h-full bg-bg-page p-6 lg:p-8 space-y-6">
      {/* 1. Introdução / Cabeçalho (Figma 325:2488) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary tracking-tight">
              Team Workspace
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              3 membros online
            </span>
          </div>
          <p className="text-sm text-fg-secondary mt-1">
            Giro Dev Team · Conversas, decisões e progresso num só lugar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => {
              if (modalContext.openCreateStoryModal) {
                modalContext.openCreateStoryModal()
              }
            }}
          >
            Criar User Story
          </Button>
        </div>
      </div>

      {activeReactionToast && (
        <div className="fixed bottom-6 right-6 bg-fg-primary text-white text-xs px-3 py-1.5 rounded-lg shadow-lg animate-fadeIn z-50">
          {activeReactionToast}
        </div>
      )}

      {/* 2. Layout Principal de 3 Colunas: Canais (Esquerda) + Chat Stream (Centro) + Membros (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Canais (3 Colunas) */}
        <div className="lg:col-span-3 bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-fg-primary flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-brand-action" />
              Canais da Equipa
            </h2>
            <span className="text-[11px] text-fg-secondary">4 canais</span>
          </div>

          <div className="space-y-1">
            {DEFAULT_CHANNELS.map((ch) => {
              const isActive = ch.id === activeChannelId
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[#FFE3DC] text-brand-action border border-[#F8C1B7]'
                      : 'text-fg-secondary hover:bg-bg-page hover:text-fg-primary'
                  }`}
                >
                  <span className="truncate">{ch.label}</span>
                  {ch.unread > 0 && !isActive && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-action text-white">
                      {ch.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Secção de Ficheiros Partilhados no Workspace */}
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-fg-secondary">
              Ficheiros Recentes
            </h3>
            <div className="space-y-1 text-xs">
              <div className="p-2 rounded bg-bg-page hover:bg-border-subtle/40 flex items-center gap-2 cursor-pointer transition-colors">
                <FileText className="w-3.5 h-3.5 text-brand-action shrink-0" />
                <span className="truncate text-fg-primary">Ata_Sprint12_Planeamento.pdf</span>
              </div>
              <div className="p-2 rounded bg-bg-page hover:bg-border-subtle/40 flex items-center gap-2 cursor-pointer transition-colors">
                <FileText className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                <span className="truncate text-fg-primary">Tokens_Figma_v1.4.json</span>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Central: Chat Stream do Canal Ativo (6 Colunas) */}
        <div className="lg:col-span-6 bg-bg-surface border border-border-subtle rounded-xl shadow-xs flex flex-col h-[680px]">
          {/* Cabeçalho do Canal Ativo */}
          <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-surface rounded-t-xl">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-fg-primary">{activeChannel.label}</h2>
                <span className="text-[11px] text-fg-secondary">• {activeChannel.desc}</span>
              </div>
            </div>
            <span className="text-xs text-brand-action font-semibold">Giro Dev Team</span>
          </div>

          {/* Banner de Mensagem Fixada */}
          <div className="bg-[#FEF3C7]/40 border-b border-[#FDE68A] p-2.5 px-4 flex items-center gap-2 text-xs text-[#7A4D00]">
            <Pin className="w-3.5 h-3.5 shrink-0 text-[#F59E0B]" />
            <span className="font-semibold">Fixado:</span>
            <span className="truncate">Meta Sprint 12: Concluir RNF-SEG-03 e fechar os 2 bloqueios de backend.</span>
          </div>

          {/* Fluxo de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {currentMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 group">
                <Avatar
                  name={msg.sender?.name}
                  initials={msg.sender?.initials}
                  size={32}
                  className="mt-0.5"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-fg-primary">
                      {msg.sender?.name}
                    </span>
                    <span className="text-[10px] text-fg-secondary font-medium px-1.5 py-0.2 rounded bg-bg-page">
                      {msg.sender?.role}
                    </span>
                    <span className="text-[11px] text-fg-secondary">
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-fg-primary leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Pré-visualização de Cartão de Tarefa se mencionada */}
                  {msg.taskRef && (
                    <div className="mt-2 p-2.5 rounded-lg border border-[#F8C1B7] bg-[#FFE3DC]/40 text-xs flex items-center justify-between max-w-md">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-brand-action">{msg.taskRef.id}</span>
                          <span className="font-semibold text-fg-primary">{msg.taskRef.title}</span>
                        </div>
                        <div className="text-[11px] text-fg-secondary flex items-center gap-2">
                          <span>{msg.taskRef.points} SP</span>
                          <span>•</span>
                          <StatusBadge status={msg.taskRef.status} />
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-brand-action shrink-0 ml-2" />
                    </div>
                  )}

                  {/* Reações e Botão de Reagir */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(msg.id, emoji)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-bg-page border border-border-subtle hover:bg-border-subtle/40 transition-colors"
                      >
                        <span>{emoji}</span>
                        <span className="font-bold text-fg-secondary">{count}</span>
                      </button>
                    ))}

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                      <button
                        onClick={() => handleAddReaction(msg.id, '👍')}
                        className="p-1 hover:bg-bg-page rounded text-xs"
                        title="Polegar"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleAddReaction(msg.id, '🚀')}
                        className="p-1 hover:bg-bg-page rounded text-xs"
                        title="Foguete"
                      >
                        🚀
                      </button>
                      <button
                        onClick={() => handleAddReaction(msg.id, '❤️')}
                        className="p-1 hover:bg-bg-page rounded text-xs"
                        title="Coração"
                      >
                        ❤️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Campo de Entrada de Mensagem */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-border-subtle bg-bg-surface rounded-b-xl flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2 text-fg-secondary hover:text-fg-primary rounded-lg hover:bg-bg-page"
              title="Anexar ficheiro"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="p-2 text-fg-secondary hover:text-fg-primary rounded-lg hover:bg-bg-page"
              title="Mencionar membro (@)"
              onClick={() => setInputText((prev) => `${prev} @`)}
            >
              <AtSign className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Escreva uma mensagem em ${activeChannel.label}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-bg-page border border-border-subtle focus:border-brand-action focus:ring-1 focus:ring-brand-action rounded-lg px-3 py-2 text-xs text-fg-primary outline-none"
            />

            <Button
              type="submit"
              variant="primary"
              className="px-3.5 py-2 h-9 text-xs"
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Enviar
            </Button>
          </form>
        </div>

        {/* Painel Direito: Membros da Equipa e Presença (3 Colunas) */}
        <div className="lg:col-span-3 bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-fg-primary flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-action" />
              Membros da Equipa
            </h2>
            <span className="text-[11px] font-semibold text-[#16A34A]">3 online</span>
          </div>

          <div className="space-y-3">
            {DEFAULT_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Avatar
                      name={member.name}
                      initials={member.initials}
                      size={32}
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                        member.status === 'online'
                          ? 'bg-[#16A34A]'
                          : member.status === 'away'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#9BA2AD]'
                      }`}
                      title={member.status}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-fg-primary">{member.name}</div>
                    <div className="text-[11px] text-fg-secondary">{member.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dica de Acessibilidade e RBAC */}
          <div className="pt-3 border-t border-border-subtle">
            <div className="p-3 bg-bg-page rounded-lg border border-border-subtle text-[11px] text-fg-secondary space-y-1">
              <div className="flex items-center gap-1 font-bold text-fg-primary">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-action" />
                <span>Auditoria & Segurança (RNF-SEG-02)</span>
              </div>
              <p>
                As mensagens em canais oficiais mantêm registo de log auditável com carimbo temporal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamWorkspacePage
