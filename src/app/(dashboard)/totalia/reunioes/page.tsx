import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ReunioesPage from "@/components/totalia/reunioes-page"

export default async function Page() {
  const hasAccess = await hasModuleAccess(Module.TOTALIA)
  if (!hasAccess) redirect("/")
  return <ReunioesPage />
}
