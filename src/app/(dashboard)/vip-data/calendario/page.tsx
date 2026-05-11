import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import CalendarioPage from "@/components/vip-data/calendario-page"

export default async function VipDataCalendarioRoute() {
  const hasAccess = await hasModuleAccess(Module.VIP_DATA)
  if (!hasAccess) redirect("/")

  return <CalendarioPage />
}
