import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import LogsPage from "@/components/instagram/logs-page"

export default async function InstagramLogsRoute() {
  const hasAccess = await hasModuleAccess(Module.INSTAGRAM)
  if (!hasAccess) redirect("/")

  return <LogsPage />
}
