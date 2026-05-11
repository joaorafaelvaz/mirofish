import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import BemVindosPage from "@/components/instagram/bem-vindos-page"

export default async function InstagramBemVindosRoute() {
  const hasAccess = await hasModuleAccess(Module.INSTAGRAM)
  if (!hasAccess) redirect("/")

  return <BemVindosPage />
}
