import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import CampaignSelectPage from './pages/campaigns/CampaignSelectPage'
import BeneficiarioPage from './pages/admision/BeneficiarioPage'
import QueuePage from './pages/queue/QueuePage'
import SignosVitalesPage from './pages/triaje/SignosVitalesPage'
import ConsultaPage from './pages/consulta/ConsultaPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import TelemetriaPage from './pages/admin/TelemetriaPage'
import PersonalizacionPage from './pages/admin/PersonalizacionPage'
import TicketPage from './pages/tickets/TicketPage'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,       // 30s
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function HomeRedirect() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  const map: Record<string, string> = {
    admin:    '/queue',
    medico:   '/consulta',
    triaje:   '/triaje',
    admision: '/admision',
    guardia:  '/queue',
  }
  return <Navigate to={map[user.role] ?? '/queue'} replace />
}

function AdminRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/campaigns" element={<CampaignSelectPage />} />

          {/* Protected */}
          <Route element={<AppLayout />}>
            <Route path="/"                element={<HomeRedirect />} />
            <Route path="/admision"        element={<BeneficiarioPage />} />
            <Route path="/queue"           element={<QueuePage />} />
            <Route path="/cola"            element={<QueuePage />} />
            <Route path="/triaje"          element={<SignosVitalesPage />} />
            <Route path="/consulta"        element={<ConsultaPage />} />
            <Route path="/tickets"         element={<TicketPage />} />

            {/* Admin only */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/personalizacion" element={<PersonalizacionPage />} />
              <Route path="/admin/usuarios"    element={<UsuariosPage />} />
              <Route path="/admin/telemetria"  element={<TelemetriaPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
