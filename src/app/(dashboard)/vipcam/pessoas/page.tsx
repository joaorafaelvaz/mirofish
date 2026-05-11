import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import PessoasPage from "@/components/vipcam/pessoas-page"

export default async function VipCamPessoasRoute() {
  const hasAccess = await hasModuleAccess(Module.VIPCAM)
  if (!hasAccess) redirect("/")
  return <PessoasPage />
}
