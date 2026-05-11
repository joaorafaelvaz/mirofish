import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ServicosPage from "@/components/vip-data/servicos-page"

export default async function VipDataServicosRoute() {
  const hasAccess = await hasModuleAccess(Module.VIP_DATA)
  if (!hasAccess) redirect("/")

  return <ServicosPage />
}
