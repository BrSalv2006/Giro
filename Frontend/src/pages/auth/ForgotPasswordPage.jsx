import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BrandLogo,
  Button,
  TextField,
  SparklesIcon,
  ShieldCheckIcon,
  CheckIcon,
} from '../../components/common'
import heroImg from '../../assets/hero.png'

/**
 * ForgotPasswordPage Component
 * Baseado no Figma frame 342:1267 ("Recuperar palavra-passe", 1440x900)
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('sofia.costa@giro.com')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e) => {
    e?.preventDefault()

    if (!email || !email.includes('@')) {
      setError('Por favor indique um e-mail válido associado à sua conta.')
      return
    }

    setError('')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setIsSuccess(true)
    }, 500)
  }

  const handleResend = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* 1. Cabeçalho Superior (Figma 342:1268) */}
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

      {/* 2. Área Central: Split Layout (Figma 342:1274) */}
      <main className="max-w-[1344px] w-full mx-auto my-auto py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Lado Esquerdo: Branding Hero Editorial (Figma 342:1275) */}
        <section
          aria-label="Espaço de inspiração"
          className="hidden lg:flex lg:col-span-7 h-[640px] rounded-[28px] overflow-hidden relative shadow-lg flex-col justify-between p-11 bg-cover bg-center border border-border-subtle/50"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundColor: '#20252B',
          }}
        >
          {/* Contraste Editorial (Figma 342:1277) */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/85 pointer-events-none"
            aria-hidden="true"
          />

          {/* Assinatura Superior (Figma 342:1278) */}
          <div className="relative z-10 self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-fg-primary shadow-xs border border-white/40">
            <SparklesIcon size={15} className="text-brand-action" />
            <span className="text-xs font-medium tracking-tight">
              Mais espaço para o que importa
            </span>
          </div>

          {/* Manifesto Editorial (Figma 342:1281) */}
          <div className="relative z-10 space-y-4 max-w-xl text-white">
            <h2 className="text-4xl xl:text-[50px] font-medium leading-[1.1] tracking-tight text-white">
              O seu dia, em boa companhia.
            </h2>
            <p className="text-base text-white/90 leading-relaxed max-w-[450px]">
              Ideias, pessoas e projetos no mesmo lugar. O seu espaço espera por si.
            </p>

            {/* Indicador Editorial (Figma 342:1284) */}
            <div className="flex items-center gap-1.5 pt-3" aria-hidden="true">
              <span className="w-8 h-1 rounded-full bg-white transition-all" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
              <span className="w-2 h-1 rounded-full bg-white/40" />
            </div>
          </div>
        </section>

        {/* Lado Direito: Formulário de Recuperação (Figma 342:1288) */}
        <section
          aria-labelledby="forgot-title"
          className="lg:col-span-5 max-w-[440px] w-full mx-auto flex flex-col justify-center space-y-6 bg-white sm:bg-transparent p-6 sm:p-0 rounded-2xl sm:rounded-none shadow-sm sm:shadow-none border border-border-subtle sm:border-0"
        >
          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-white border border-[#BBF7D0] shadow-sm space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#166534] mx-auto flex items-center justify-center">
                <CheckIcon size={28} className="text-[#16A34A]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-fg-primary">
                  Link de recuperação enviado!
                </h2>
                <p className="text-sm text-fg-secondary leading-relaxed">
                  Enviámos uma mensagem para <strong className="text-fg-primary">{email}</strong> com instruções seguras para redefinir a sua palavra-passe.
                </p>
                <p className="text-xs text-fg-secondary/80">
                  O link é válido por 30 minutos. Se não encontrar o e-mail, verifique a pasta de spam.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  className="w-full h-11 text-sm font-semibold"
                  onClick={() => navigate('/login')}
                >
                  Voltar ao início de sessão
                </Button>
                <Button
                  variant="secondary"
                  loading={loading}
                  className="w-full h-10 text-xs font-medium"
                  onClick={handleResend}
                >
                  Reenviar link por e-mail
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Introdução do Formulário (Figma 342:1289) */}
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-brand-action uppercase">
                  RECUPERAR ACESSO
                </p>
                <h1 id="forgot-title" className="text-2xl sm:text-3xl font-bold text-fg-primary tracking-tight">
                  Esqueceu-se da sua palavra-passe?
                </h1>
                <p className="text-sm sm:text-base text-fg-secondary leading-relaxed">
                  Acontece. Indique o e-mail da sua conta e enviaremos um link para definir a nova palavra-passe.
                </p>
              </div>

              {/* Formulário (Figma 342:1293) */}
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

                {/* Ações (Figma 342:1295) */}
                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full h-11 text-base font-semibold shadow-xs"
                  >
                    Enviar link de recuperação
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-11 text-sm font-medium"
                    onClick={() => navigate('/login')}
                  >
                    Voltar ao início de sessão
                  </Button>
                </div>

                {/* Orientação de Envio (Figma 342:1298) */}
                <p className="text-center text-xs text-fg-secondary pt-1">
                  Não encontrou o e-mail? Verifique também a pasta de spam.
                </p>
              </form>

              {/* Divisória e Apoio (Figma 342:1299) */}
              <div className="space-y-3 pt-2">
                <div className="h-px bg-border-subtle w-full" aria-hidden="true" />

                <div className="flex items-center justify-center gap-2 text-xs text-fg-secondary">
                  <ShieldCheckIcon size={14} className="text-[#16A34A] shrink-0" />
                  <span>Proteção e recuperação segura com cifra SSL.</span>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* 3. Rodapé Global (Figma 342:1304) */}
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

export default ForgotPasswordPage
