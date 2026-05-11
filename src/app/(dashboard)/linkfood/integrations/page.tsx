import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import IntegracoesPlatformPage from "@/components/linkfood/integrations-page"

export default async function LinkfoodIntegrationsPage() {
  const hasAccess = await hasModuleAccess(Module.LINKFOOD)
  if (!hasAccess) redirect("/")

  return <IntegracoesPlatformPage />
}
