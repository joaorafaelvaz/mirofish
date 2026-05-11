import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import InstagramConfigPage from "@/components/instagram/config-page"

export default async function InstagramConfigRoute() {
  const hasAccess = await hasModuleAccess(Module.INSTAGRAM)
  if (!hasAccess) redirect("/")

  return <InstagramConfigPage />
}
