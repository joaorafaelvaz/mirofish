import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import ChurnDashboard from "@/components/churn/dashboard"

export default async function ChurnPage() {
  const hasAccess = await hasModuleAccess("BARBERSHOP")
  if (!hasAccess) redirect("/")

  return <ChurnDashboard />
}
