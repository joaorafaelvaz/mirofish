import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./prisma"
import { Module, Role } from "@/generated/prisma/enums"
import { cookies } from "next/headers"

export type TenantFilter = {
  unitId: string
} | {
  unitId: { in: string[] }
}

export async function getSelectedUnitId(): Promise<string | "all"> {
  const cookieStore = await cookies()
  return cookieStore.get("selected-unit-id")?.value || "all"
}

export async function getTenantFilter(): Promise<TenantFilter | null> {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const { role, unitIds, networkId } = session.user
  const selectedUnitId = await getSelectedUnitId()

  if (role === "SUPER_ADMIN") {
    if (selectedUnitId !== "all") {
      return { unitId: selectedUnitId }
    }
    return null as unknown as TenantFilter
  }

  if (role === "FRANQUEADOR" && networkId) {
    if (selectedUnitId !== "all") {
      return { unitId: selectedUnitId }
    }
    const units = await prisma.unit.findMany({
      where: { networkId },
      select: { id: true },
    }) as { id: string }[]
    return { unitId: { in: units.map((u: { id: string }) => u.id) } }
  }

  if (role === "MULTIFRANQUEADO") {
    if (selectedUnitId !== "all") {
      if (unitIds.includes(selectedUnitId)) {
        return { unitId: selectedUnitId }
      }
      return { unitId: unitIds[0] }
    }
    return { unitId: { in: unitIds } }
  }

  // GERENTE or COLABORADOR
  return { unitId: unitIds[0] || "" }
}

export async function hasModuleAccess(module: Module): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session) return false

  if (session.user.role === "SUPER_ADMIN") return true

  const permission = await prisma.userModulePermission.findFirst({
    where: {
      userId: session.user.id,
      module,
    },
  })

  return !!permission
}

export async function getUserModules(): Promise<Module[]> {
  const session = await getServerSession(authOptions)
  if (!session) return []

  if (session.user.role === "SUPER_ADMIN") {
    return [
      Module.BARBERSHOP,
      Module.LINKFOOD,
      Module.WAHASEND,
      Module.VIPCAM,
      Module.VIP_DATA,
      Module.TOTALIA,
      Module.INSTAGRAM,
    ]
  }

  const permissions = await prisma.userModulePermission.findMany({
    where: { userId: session.user.id },
    select: { module: true },
  })

  return [...new Set((permissions as { module: Module }[]).map((p) => p.module))]
}

export function canManageUsers(role: Role): boolean {
  return [Role.SUPER_ADMIN, Role.FRANQUEADOR, Role.GERENTE].includes(role)
}

export async function getUserUnits() {
  const session = await getServerSession(authOptions)
  if (!session) return []

  const { role, unitIds, networkId } = session.user

  if (role === "SUPER_ADMIN") {
    return prisma.unit.findMany({
      include: { network: true },
      orderBy: { name: "asc" },
    })
  }

  if (role === "FRANQUEADOR" && networkId) {
    return prisma.unit.findMany({
      where: { networkId },
      include: { network: true },
      orderBy: { name: "asc" },
    })
  }

  return prisma.unit.findMany({
    where: { id: { in: unitIds } },
    include: { network: true },
    orderBy: { name: "asc" },
  })
}
