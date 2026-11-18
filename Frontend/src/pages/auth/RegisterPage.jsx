import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BrandLogo,
  Button,
  TextField,
  Checkbox,
  SparklesIcon,
  ShieldCheckIcon,
  CheckIcon,
} from '../../components/common'
import { useAuth } from '../../context/AuthContext.jsx'
import heroImg from '../../assets/hero.png'

function useSafeAuth() {
  try {
    return useAuth()
  } catch {
    return {
      login: () => {},
      register: () => {},
    }
  }
}

/**
 * RegisterPage Component
 * Baseado no Figma frame 342:1222 ("Criar conta", 1440x900)
 */
export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useSafeAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e?.preventDefault()

    if (!name.trim()) {
      setError('Por favor indique o seu nome completo.')
      return
    }
    if (!email || !email.includes('@')) {
      setError('Por favor indique um e-mail válido.')
      return
    }
    if (!password || password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres, com letras e números.')
      return
    }
    if (password !== confirmPassword) {
      setError('As palavras-passe indicadas não coincidem.')
      return
    }
    if (!termsAccepted) {
      setError('Deve aceitar os Termos de utilização e a Política de privacidade para continuar.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await register({ name, email, password, role: 'P04' })
      setLoading(false)
      setIsSuccess(true)
    } catch (submitError) {
      setLoading(false)
      setError(submitError.message)
    }
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* 1. Cabeçalho Superior (Figma 342:1223) */}
      <header className="max-w-[1344px] w-full mx-auto flex items-center justify-between py-2">
        <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focusRing rounded-lg">
          <BrandLogo layout="compact" size="md" />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-fg-secondary">
            Já tem uma conta?
          </span>
          <Button
            variant="tertiary"
            className="h-10 px-4 text-sm font-medium hover:bg-white/80 active:bg-white"
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* 2. Área Central: Split Layout (Figma 342:1229) */}
      <main className="max-w-[1344px] w-full mx-auto my-auto py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Lado Esquerdo: Branding Hero Editorial (Figma 342:1230) */}
        <section
          aria-label="Espaço de inspiração"
          className="hidden lg:flex lg:col-span-7 h-[670px] rounded-[28px] overflow-hidden relative shadow-lg flex-col justify-between p-11 bg-cover bg-center border border-border-subtle/50"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundColor: '#20252B',
          }}
        >
          {/* Contraste Editorial (Figma 342:1232) */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/85 pointer-events-none"
            aria-hidden="true"
          />

          {/* Assinatura Superior (Figma 342:1233) */}
          <div className="relative z-10 self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-fg-primary shadow-xs border border-white/40">
            <SparklesIcon size={15} className="text-brand-action" />
            <span className="text-xs font-medium tracking-tight">
              Mais espaço para o que importa
            </span>
          </div>

          {/* Manifesto Editorial (Figma 342:1236) */}
          <div className="relative z-10 space-y-4 max-w-xl text-white">
            <h2 className="text-4xl xl:text-[50px] font-medium leading-[1.1] tracking-tight text-white">
              O seu dia, em boa companhia.
            </h2>
            <p className="text-base text-white/90 leading-relaxed max-w-[450px]">
              Ideias, pessoas e projetos no mesmo lugar. Crie a sua conta e encontre o seu espaço.
            </p>

            {/* Indicador Editorial (Figma 342:1239) */}
            <div className="flex items-center gap-1.5 pt-3" aria-hidden="true">
              <span className="w-8 h-1 rounded-full bg-white transition-all" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
            </div>
          </div>
        </section>

        {/* Lado Direito: Formulário de Cadastro (Figma 342:1243) */}
        <section
          aria-labelledby="register-title"
          className="lg:col-span-5 max-w-[440px] w-full mx-auto flex flex-col justify-center space-y-5 bg-bg-surface sm:bg-transparent p-6 sm:p-0 rounded-2xl sm:rounded-none shadow-sm sm:shadow-none border border-border-subtle sm:border-0"
        >
          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-bg-surface border border-[#BBF7D0] dark:border-[#22C55E]/40 shadow-sm space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#166534] mx-auto flex items-center justify-center">
                <CheckIcon size={28} className="text-[#16A34A]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-fg-primary">
                  Conta criada com sucesso!
                </h2>
                <p className="text-sm text-fg-secondary">
                  Bem-vindo ao Giro, <strong>{name}</strong>. A sua conta foi configurada e está pronta para uso.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  className="w-full h-11 text-sm font-semibold"
                  onClick={() => navigate('/')}
                >
                  Entrar na plataforma
                </Button>
                <Button
                  variant="secondary"
                  className="w-full h-10 text-xs font-medium"
                  onClick={() => navigate('/login')}
                >
                  Ir para a página de início de sessão
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Introdução do Formulário (Figma 342:1244) */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold tracking-wider text-brand-action uppercase">
                  COMECE A SUA JORNADA
                </p>
                <h1 id="register-title" className="text-2xl sm:text-3xl font-bold text-fg-primary tracking-tight">
                  Crie a sua conta no Giro.
                </h1>
                <p className="text-sm text-fg-secondary">
                  Um novo espaço para as suas ideias e ligações.
                </p>
              </div>

              {/* Formulário (Figma 342:1248) */}
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {error && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-feedback-errorBg text-feedback-errorFg text-xs font-medium border border-feedback-errorBorder"
                  >
                    {error}
                  </div>
                )}

                <TextField
                  label="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nome Apelido"
                  required
                  autoComplete="name"
                  className="bg-bg-surface"
                />

                <TextField
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: utilizador@empresa.com"
                  required
                  autoComplete="email"
                  className="bg-bg-surface"
                />

                <TextField
                  label="Palavra-passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex: ••••••••"
                  helperText="Use pelo menos 8 caracteres, com letras e números."
                  required
                  autoComplete="new-password"
                  className="bg-bg-surface"
                />

                <TextField
                  label="Confirmar palavra-passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ex: ••••••••"
                  required
                  autoComplete="new-password"
                  className="bg-bg-surface"
                />

                {/* Consentimento (Figma 342:1253) */}
                <div className="pt-1">
                  <Checkbox
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    label="Li e aceito os Termos de utilização e a Política de privacidade."
                  />
                </div>

                {/* Botão Criar conta (Figma 342:1256) */}
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full h-11 text-base font-semibold shadow-xs mt-2"
                >
                  Criar conta
                </Button>
              </form>

              {/* Divisória e Segurança (Figma 342:1257) */}
              <div className="space-y-3 pt-2">
                <div className="h-px bg-border-subtle w-full" aria-hidden="true" />

                <div className="flex items-center justify-center gap-2 text-xs text-fg-secondary">
                  <ShieldCheckIcon size={14} className="text-[#16A34A] shrink-0" />
                  <span>Os seus dados protegidos, sempre. © 2026 Giro.</span>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* 3. Rodapé Global (Figma 342:1262) */}
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

export default RegisterPage
