import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import MonitoramentoPage from "@/components/instagram/monitoramento-page"

export default async function InstagramMonitoramentoRoute() {
  const hasAccess = await hasModuleAccess(Module.INSTAGRAM)
  if (!hasAccess) redirect("/")

  return <MonitoramentoPage />
}
