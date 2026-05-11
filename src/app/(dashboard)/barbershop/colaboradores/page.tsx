import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ColaboradoresPageBarbershop from "@/components/barbershop/colaboradores-page"

export default async function BarbershopColaboradoresPage() {
  const hasAccess = await hasModuleAccess(Module.BARBERSHOP)
  if (!hasAccess) redirect("/")

  return <ColaboradoresPageBarbershop />
}
