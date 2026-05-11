import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import CamerasPage from "@/components/vipcam/cameras-page"

export default async function VipCamCamerasRoute() {
  const hasAccess = await hasModuleAccess(Module.VIPCAM)
  if (!hasAccess) redirect("/")
  return <CamerasPage />
}
