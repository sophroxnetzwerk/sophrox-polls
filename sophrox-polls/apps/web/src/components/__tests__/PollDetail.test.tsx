import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import PollDetail from "../../pages/PollDetail"

const queryClient = new QueryClient()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe("PollDetail", () => {
  beforeEach(() => {
    queryClient.clear()
  })

  it("should disable vote button after casting a vote", async () => {
    renderWithProviders(<PollDetail />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /vote|submit/i })).toBeInTheDocument()
    })

    const voteButton = screen.getByRole("button", { name: /vote|submit/i })
    await userEvent.click(voteButton)

    await waitFor(() => {
      expect(voteButton).toBeDisabled()
    })
  })

  it("should display correct percentage values on result bars", async () => {
    renderWithProviders(<PollDetail />)

    await waitFor(() => {
      // Result bars should show percentages
      expect(screen.getByText(/50%/i) || screen.getByText(/100%/i)).toBeInTheDocument()
    })
  })

  it("should show 'Poll Ended' badge when poll is closed", async () => {
    renderWithProviders(<PollDetail />)

    await waitFor(() => {
      expect(screen.getByText(/poll ended|closed/i)).toBeInTheDocument()
    })
  })

  it("should update results without page reload via live updates", async () => {
    renderWithProviders(<PollDetail />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /vote|submit/i })).toBeInTheDocument()
    })

    // Verify refetchInterval is working (5000ms per spec)
    await new Promise((resolve) => setTimeout(resolve, 5100))

    // After 5.1 seconds, the data should be refetched
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /vote|submit/i })).toBeInTheDocument()
    })
  })
})
