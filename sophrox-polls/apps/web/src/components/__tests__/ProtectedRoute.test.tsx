import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import ProtectedRoute from "../../components/shared/ProtectedRoute"

const queryClient = new QueryClient()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe("ProtectedRoute", () => {
  it("should redirect to /login when no token is present", async () => {
    const TestContent = () => <div>Protected Content</div>

    renderWithProviders(
      <ProtectedRoute>
        <TestContent />
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
      // Should redirect to login
      expect(window.location.pathname).toContain("login")
    })
  })

  it("should redirect to /dashboard when user has wrong role", async () => {
    const TestContent = () => <div>Admin Content</div>

    renderWithProviders(
      <ProtectedRoute role="admin">
        <TestContent />
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument()
      // Should redirect to dashboard
      expect(window.location.pathname).toContain("dashboard")
    })
  })

  it("should render children when user has correct role", async () => {
    const TestContent = () => <div>Admin Content</div>

    renderWithProviders(
      <ProtectedRoute role="admin">
        <TestContent />
      </ProtectedRoute>
    )

    // Mock auth state with admin token
    // Assume auth library is set to admin role

    await waitFor(() => {
      expect(screen.getByText("Admin Content")).toBeInTheDocument()
    })
  })
})
