import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import MetasPageBarbershop from "@/components/barbershop/metas-page"

export default async function BarbershopMetasPage() {
  const hasAccess = await hasModuleAccess(Module.BARBERSHOP)
  if (!hasAccess) redirect("/")

  return <MetasPageBarbershop />
}
