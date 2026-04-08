import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ThemeProvider } from "./components/theme-provider"
import { Sidebar } from "./components/layout/Sidebar"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import ProtectedRoute from "./components/shared/ProtectedRoute"

// Pages
import Login from "./pages/Login"
import DiscordCallback from "./pages/DiscordCallback"
import CreatePoll from "./pages/CreatePoll"
import PollDetail from "./pages/PollDetail"
import Admin from "./pages/Admin"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Layout wrapper with Sidebar
const MainLayout = () => (
  <div className="flex h-screen bg-background">
    <Sidebar />
    <Outlet />
  </div>
)

// Layout wrapper with Sidebar + Padding for regular pages
const PageLayout = () => (
  <div className="flex h-screen bg-background">
    <Sidebar />
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <Outlet />
      </div>
    </main>
  </div>
)

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/discord" element={<DiscordCallback />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardLayout />} />
              </Route>

              <Route element={<PageLayout />}>
                <Route path="/polls/:id" element={<PollDetail />} />
                <Route
                  path="/settings"
                  element={
                    <div className="text-center py-12 flex-1">Settings coming soon...</div>
                  }
                />

                <Route element={<ProtectedRoute role="creator" />}>
                  <Route path="/polls/create" element={<CreatePoll />} />
                </Route>

                <Route element={<ProtectedRoute role="admin" />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
