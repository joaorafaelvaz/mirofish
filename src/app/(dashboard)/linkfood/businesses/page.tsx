import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import BusinessesPage from "@/components/linkfood/businesses-page"

export default async function LinkfoodBusinessesPage() {
  const hasAccess = await hasModuleAccess(Module.LINKFOOD)
  if (!hasAccess) redirect("/")

  return <BusinessesPage />
}
