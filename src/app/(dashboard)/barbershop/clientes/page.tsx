import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ClientesPageBarbershop from "@/components/barbershop/clientes-page"

export default async function BarbershopClientesPage() {
  const hasAccess = await hasModuleAccess(Module.BARBERSHOP)
  if (!hasAccess) redirect("/")

  return <ClientesPageBarbershop />
}
