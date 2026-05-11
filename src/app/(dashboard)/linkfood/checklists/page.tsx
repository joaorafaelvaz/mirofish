import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ChecklistsPage from "@/components/linkfood/checklists-page"

export default async function LinkfoodChecklistsPage() {
  const hasAccess = await hasModuleAccess(Module.LINKFOOD)
  if (!hasAccess) redirect("/")

  return <ChecklistsPage />
}
