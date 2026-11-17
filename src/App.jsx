import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ModalProvider } from './context/ModalContext.jsx'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx'

// Importação das páginas da plataforma GIRO
import {
  OverviewPage,
  PedidosPage,
  PriorizacaoPage,
  SprintKanbanPage,
  ProductBacklogPage,
  ProductRoadmapPage,
  TeamWorkspacePage,
  TraceabilityMatrixPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  NotificationsPage,
  AdvancedSearchPage,
  TeamSettingsPage,
  ComponentShowcasePage,
} from './pages'

/**
 * GIRO Application Root
 * Configures global Context Providers and React Router DOM routes.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ModalProvider>
            <Routes>
              {/* Rotas Públicas de Autenticação */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
              {/* Redirecionamentos de conveniência */}
              <Route path="/criar-conta" element={<Navigate to="/register" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/recuperar-senha" replace />} />

              {/* Rotas Principais Protegidas por Autenticação e RBAC (RNF-SEG-02) */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* 1. Visão Geral (Dashboard Analítico) */}
                <Route index element={<OverviewPage />} />

                {/* 2. Pedidos de Funcionalidades */}
                <Route path="pedidos" element={<PedidosPage />} />

                {/* 3. Painel de Priorização e Votação */}
                <Route path="priorizacao" element={<PriorizacaoPage />} />

                {/* 4. Product Backlog */}
                <Route path="backlog" element={<ProductBacklogPage />} />

                {/* 5. Quadro de Sprint e Backlog (Kanban Sprint 12) */}
                <Route path="sprint" element={<SprintKanbanPage />} />

                {/* 6. Roadmap do Produto (Gantt & Releases) */}
                <Route path="roadmap" element={<ProductRoadmapPage />} />

                {/* 7. Team Workspace (Comunicação e Colaboração) */}
                <Route path="team" element={<TeamWorkspacePage />} />

                {/* 8. Matriz de Rastreabilidade de Requisitos */}
                <Route path="rastreabilidade" element={<TraceabilityMatrixPage />} />

                {/* Rotas Auxiliares e Utilitárias */}
                <Route path="notificacoes" element={<NotificationsPage />} />
                <Route path="pesquisa" element={<AdvancedSearchPage />} />
                <Route path="definicoes" element={<TeamSettingsPage />} />

                {/* Catálogo de Design Tokens & Componentes (Showcase Fase 1) */}
                <Route path="showcase" element={<ComponentShowcasePage />} />
              </Route>

              {/* Rota Fallback / 404 -> Redirecionar para Início */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ModalProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
