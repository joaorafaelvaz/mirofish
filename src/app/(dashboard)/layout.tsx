import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserModules, getUserUnits, getSelectedUnitId, canManageUsers } from "@/lib/permissions"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { SessionProvider } from "@/components/providers/session-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const [modules, units, selectedUnitId] = await Promise.all([
    getUserModules(),
    getUserUnits(),
    getSelectedUnitId(),
  ])

  const showAllOption = ["SUPER_ADMIN", "FRANQUEADOR", "MULTIFRANQUEADO"].includes(
    session.user.role
  )

  const unitOptions = (units as any[]).map((u) => ({
    id: u.id,
    name: u.name,
    networkName: u.network.name,
  }))

  return (
    <SessionProvider>
      <div className="flex h-screen">
        <Sidebar
          modules={modules}
          canManageUsers={canManageUsers(session.user.role)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            units={unitOptions}
            selectedUnitId={selectedUnitId}
            showAllOption={showAllOption}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
