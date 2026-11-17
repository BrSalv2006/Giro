import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BrandLogo,
  Button,
  TextField,
  Checkbox,
  SparklesIcon,
  ShieldCheckIcon,
} from '../../components/common'
import { useAuth } from '../../context/AuthContext.jsx'
import heroImg from '../../assets/hero.png'

function useSafeAuth() {
  try {
    return useAuth()
  } catch {
    return {
      login: () => {},
      switchRole: () => {},
      currentUser: { name: 'Sofia Costa', email: 'sofia.costa@giro.com', role: 'PRODUCT_OWNER' },
    }
  }
}

/**
 * LoginPage Component
 * Baseado no Figma frame 342:1176 ("Login", 1440x900)
 */
export function LoginPage() {
  const navigate = useNavigate()
  const { login, switchRole } = useSafeAuth()

  const [email, setEmail] = useState('sofia.costa@giro.com')
  const [password, setPassword] = useState('••••••••••••')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Por favor introduza um endereço de e-mail válido.')
      return
    }
    if (!password) {
      setError('Por favor introduza a sua palavra-passe.')
      return
    }

    setError('')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      login(email, password)
      navigate('/')
    }, 400)
  }

  // Acesso direto para testes rápidos dos 5 papéis RBAC
  const handleQuickLogin = (roleKey, userEmail) => {
    setEmail(userEmail)
    setPassword('demo1234')
    setError('')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      switchRole(roleKey)
      login(userEmail, 'demo1234')
      navigate('/')
    }, 250)
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* 1. Cabeçalho Superior (Figma 342:1177) */}
      <header className="max-w-[1344px] w-full mx-auto flex items-center justify-between py-2">
        <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing rounded-lg">
          <BrandLogo layout="compact" size="md" />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-fg-secondary">
            Ainda não tem uma conta?
          </span>
          <Button
            variant="tertiary"
            className="h-10 px-4 text-sm font-medium hover:bg-white/80 active:bg-white"
            onClick={() => navigate('/register')}
          >
            Criar conta
          </Button>
        </div>
      </header>

      {/* 2. Área Central: Split Layout (Figma 342:1184) */}
      <main className="max-w-[1344px] w-full mx-auto my-auto py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Lado Esquerdo: Branding Hero Editorial (Figma 342:1185) */}
        <section
          aria-label="Espaço de inspiração"
          className="hidden lg:flex lg:col-span-7 h-[640px] rounded-[28px] overflow-hidden relative shadow-lg flex-col justify-between p-11 bg-cover bg-center border border-border-subtle/50"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundColor: '#20252B',
          }}
        >
          {/* Contraste Editorial (Figma 342:1187) */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/85 pointer-events-none"
            aria-hidden="true"
          />

          {/* Assinatura Superior (Figma 342:1188) */}
          <div className="relative z-10 self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-fg-primary shadow-xs border border-white/40">
            <SparklesIcon size={15} className="text-brand-action" />
            <span className="text-xs font-medium tracking-tight">
              Mais espaço para o que importa
            </span>
          </div>

          {/* Manifesto Editorial (Figma 342:1192) */}
          <div className="relative z-10 space-y-4 max-w-xl text-white">
            <h2 className="text-4xl xl:text-[50px] font-medium leading-[1.1] tracking-tight text-white">
              O seu dia, em boa companhia.
            </h2>
            <p className="text-base text-white/90 leading-relaxed max-w-[450px]">
              Ideias, pessoas e projetos no mesmo lugar. Entre e continue de onde parou.
            </p>

            {/* Indicador Editorial (Figma 342:1195) */}
            <div className="flex items-center gap-1.5 pt-3" aria-hidden="true">
              <span className="w-8 h-1 rounded-full bg-white transition-all" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
            </div>
          </div>
        </section>

        {/* Lado Direito: Formulário de Login (Figma 342:1199) */}
        <section
          aria-labelledby="login-title"
          className="lg:col-span-5 max-w-[440px] w-full mx-auto flex flex-col justify-center space-y-6 bg-white sm:bg-transparent p-6 sm:p-0 rounded-2xl sm:rounded-none shadow-sm sm:shadow-none border border-border-subtle sm:border-0"
        >
          {/* Introdução do Formulário (Figma 342:1200) */}
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-wider text-brand-action uppercase">
              BEM-VINDO DE VOLTA
            </p>
            <h1 id="login-title" className="text-2xl sm:text-3xl font-bold text-fg-primary tracking-tight">
              Que bom tê-lo aqui.
            </h1>
            <p className="text-sm sm:text-base text-fg-secondary">
              Entre na sua conta para aceder ao seu espaço.
            </p>
          </div>

          {/* Formulário (Figma 342:1204) */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-feedback-errorBg text-feedback-errorFg text-xs font-medium border border-feedback-errorBorder"
              >
                {error}
              </div>
            )}

            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sofia.costa@giro.com"
              required
              autoComplete="email"
              className="bg-white"
            />

            <TextField
              label="Palavra-passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className="bg-white"
            />

            {/* Preferências de acesso (Figma 342:1207) */}
            <div className="flex items-center justify-between pt-1">
              <Checkbox
                label="Lembrar-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <Link
                to="/recuperar-senha"
                className="text-sm font-medium text-brand-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing rounded"
              >
                Recuperar palavra-passe
              </Link>
            </div>

            {/* Botão Entrar (Figma 342:1210) */}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full h-11 text-base font-semibold shadow-xs"
            >
              Entrar
            </Button>
          </form>

          {/* Divisória e Segurança (Figma 342:1211) */}
          <div className="space-y-3 pt-2">
            <div className="h-px bg-border-subtle w-full" aria-hidden="true" />

            <div className="flex items-center justify-center gap-2 text-xs text-fg-secondary">
              <ShieldCheckIcon size={14} className="text-[#16A34A] shrink-0" />
              <span>Os seus dados protegidos, sempre. Encriptação ponta a ponta.</span>
            </div>
          </div>

          {/* Botões de Acesso Rápido para Testes RBAC dos 5 Papéis */}
          <div className="p-3.5 rounded-xl bg-bg-page border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-fg-secondary uppercase tracking-wider">
                Acesso Rápido de Teste (5 Papéis RBAC)
              </span>
              <span className="text-[10px] text-brand-action font-mono">
                1-Clique Demo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('PRODUCT_OWNER', 'sofia.costa@giro.com')}
                className="p-2 rounded-lg bg-white hover:bg-[#FFE3DC] hover:text-brand-action text-left border border-border-subtle transition-all cursor-pointer font-medium"
                title="Sofia Costa (Product Owner)"
              >
                <div className="font-semibold text-fg-primary text-[11px]">Sofia Costa</div>
                <div className="text-[10px] text-fg-secondary truncate">Product Owner</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN', 'miguel.alves@giro.com')}
                className="p-2 rounded-lg bg-white hover:bg-[#FFE3DC] hover:text-brand-action text-left border border-border-subtle transition-all cursor-pointer font-medium"
                title="Miguel Alves (Administrador)"
              >
                <div className="font-semibold text-fg-primary text-[11px]">Miguel Alves</div>
                <div className="text-[10px] text-fg-secondary truncate">Administrador</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('SCRUM_MASTER', 'ines.martins@giro.com')}
                className="p-2 rounded-lg bg-white hover:bg-[#FFE3DC] hover:text-brand-action text-left border border-border-subtle transition-all cursor-pointer font-medium"
                title="Inês Martins (Scrum Master)"
              >
                <div className="font-semibold text-fg-primary text-[11px]">Inês Martins</div>
                <div className="text-[10px] text-fg-secondary truncate">Scrum Master</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('DEVELOPER', 'rafael.silva@giro.com')}
                className="p-2 rounded-lg bg-white hover:bg-[#FFE3DC] hover:text-brand-action text-left border border-border-subtle transition-all cursor-pointer font-medium"
                title="Rafael Silva (Desenvolvedor)"
              >
                <div className="font-semibold text-fg-primary text-[11px]">Rafael Silva</div>
                <div className="text-[10px] text-fg-secondary truncate">Developer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CLIENT', 'cliente@empresa.com')}
                className="col-span-2 sm:col-span-2 p-2 rounded-lg bg-white hover:bg-[#FFE3DC] hover:text-brand-action text-left border border-border-subtle transition-all cursor-pointer font-medium"
                title="Cliente Externo / Stakeholder"
              >
                <div className="font-semibold text-fg-primary text-[11px]">Cliente / Stakeholder</div>
                <div className="text-[10px] text-fg-secondary truncate">Votação & Sugestões</div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Rodapé Global (Figma 342:1217) */}
      <footer className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-t border-border-subtle/60 text-xs text-fg-secondary">
        <p>© 2026 Giro. Feito para conectar.</p>
        <div className="flex items-center gap-6">
          <Link to="#" className="hover:text-fg-primary transition-colors">
            Privacidade
          </Link>
          <Link to="#" className="hover:text-fg-primary transition-colors">
            Precisa de ajuda?
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
