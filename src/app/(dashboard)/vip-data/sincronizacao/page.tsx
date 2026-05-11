import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import SincronizacaoPage from "@/components/vip-data/sincronizacao-page"

export default async function VipDataSincronizacaoRoute() {
  const hasAccess = await hasModuleAccess(Module.VIP_DATA)
  if (!hasAccess) redirect("/")

  return <SincronizacaoPage />
}
