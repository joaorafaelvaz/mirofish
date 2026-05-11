import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import VendasPageBarbershop from "@/components/barbershop/vendas-page"

export default async function BarbershopVendasPage() {
  const hasAccess = await hasModuleAccess(Module.BARBERSHOP)
  if (!hasAccess) redirect("/")

  return <VendasPageBarbershop />
}
