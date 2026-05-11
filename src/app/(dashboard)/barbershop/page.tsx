import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import BarbershopDashboard from "@/components/barbershop/dashboard"

export default async function BarbershopPage() {
  const hasAccess = await hasModuleAccess(Module.BARBERSHOP)
  if (!hasAccess) redirect("/")

  return <BarbershopDashboard />
}
