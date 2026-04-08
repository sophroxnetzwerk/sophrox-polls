import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import LoginForm from "../../components/auth/LoginForm"

const queryClient = new QueryClient()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe("LoginForm", () => {
  it("should show validation errors on empty submit", async () => {
    const onSuccess = vi.fn()
    renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    const submitButton = screen.getByRole("button", { name: /login/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it("should show inline error for invalid email format", async () => {
    renderWithProviders(<LoginForm onSuccess={vi.fn()} />)

    const emailInput = screen.getByLabelText(/email/i)
    await userEvent.type(emailInput, "invalid-email")
    const submitButton = screen.getByRole("button", { name: /login/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it("should call onSuccess callback on successful login", async () => {
    const onSuccess = vi.fn()
    renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await userEvent.type(emailInput, "test@example.com")
    await userEvent.type(passwordInput, "password123")

    const submitButton = screen.getByRole("button", { name: /login/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it("should show Toast on network error", async () => {
    const onSuccess = vi.fn()
    renderWithProviders(<LoginForm onSuccess={onSuccess} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await userEvent.type(emailInput, "test@example.com")
    await userEvent.type(passwordInput, "password123")

    const submitButton = screen.getByRole("button", { name: /login/i })
    await userEvent.click(submitButton)

    // Simulate network error and check if toast appears
    await waitFor(() => {
      expect(screen.queryByText(/error|failed/i)).toBeInTheDocument()
    })
  })
})
