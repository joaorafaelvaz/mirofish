import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import RelatoriosPage from "@/components/vip-data/relatorios-page"

export default async function VipDataRelatoriosRoute() {
  const hasAccess = await hasModuleAccess(Module.VIP_DATA)
  if (!hasAccess) redirect("/")

  return <RelatoriosPage />
}
