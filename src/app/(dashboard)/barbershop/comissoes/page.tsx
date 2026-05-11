import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ComissoesPageBarbershop from "@/components/barbershop/comissoes-page"

export default async function BarbershopComissoesPage() {
  const hasAccess = await hasModuleAccess(Module.BARBERSHOP)
  if (!hasAccess) redirect("/")

  return <ComissoesPageBarbershop />
}
