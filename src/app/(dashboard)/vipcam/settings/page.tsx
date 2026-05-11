import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import VipCamSettingsPage from "@/components/vipcam/settings-page"

export default async function VipCamSettingsRoute() {
  const hasAccess = await hasModuleAccess(Module.VIPCAM)
  if (!hasAccess) redirect("/")
  return <VipCamSettingsPage />
}
