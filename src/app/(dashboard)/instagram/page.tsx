import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import InstagramDashboard from "@/components/instagram/dashboard"

export default async function InstagramPage() {
  const hasAccess = await hasModuleAccess(Module.INSTAGRAM)
  if (!hasAccess) redirect("/")

  return <InstagramDashboard />
}
