import { Outlet } from "react-router-dom"
import NavBar from "@/components/shared/NavBar"

export const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
