import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import RiscosPage from "@/components/totalia/riscos-page"

export default async function Page() {
  const hasAccess = await hasModuleAccess(Module.TOTALIA)
  if (!hasAccess) redirect("/")
  return <RiscosPage />
}
