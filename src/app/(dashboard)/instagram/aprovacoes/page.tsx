import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import AprovacoesPage from "@/components/instagram/aprovacoes-page"

export default async function InstagramAprovacoesRoute() {
  const hasAccess = await hasModuleAccess(Module.INSTAGRAM)
  if (!hasAccess) redirect("/")

  return <AprovacoesPage />
}
