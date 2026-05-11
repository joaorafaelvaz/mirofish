import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...")

  // Create network
  const network = await prisma.network.upsert({
    where: { slug: "barbearia-vip" },
    update: {},
    create: {
      name: "Barbearia VIP",
      slug: "barbearia-vip",
    },
  })

  // Create units
  const unit1 = await prisma.unit.upsert({
    where: { slug: "unidade-centro" },
    update: {},
    create: {
      name: "Unidade Centro",
      slug: "unidade-centro",
      networkId: network.id,
    },
  })

  const unit2 = await prisma.unit.upsert({
    where: { slug: "unidade-norte" },
    update: {},
    create: {
      name: "Unidade Norte",
      slug: "unidade-norte",
      networkId: network.id,
    },
  })

  // Create super admin
  const passwordHash = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@barbeariasuite.com" },
    update: {},
    create: {
      email: "admin@barbeariasuite.com",
      name: "Administrador",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  })

  // Create franqueador
  const franqueador = await prisma.user.upsert({
    where: { email: "franqueador@barbeariasuite.com" },
    update: {},
    create: {
      email: "franqueador@barbeariasuite.com",
      name: "Franqueador Demo",
      passwordHash,
      role: "FRANQUEADOR",
      networkId: network.id,
    },
  })

  // Create gerente
  const gerente = await prisma.user.upsert({
    where: { email: "gerente@barbeariasuite.com" },
    update: {},
    create: {
      email: "gerente@barbeariasuite.com",
      name: "Gerente Centro",
      passwordHash,
      role: "GERENTE",
    },
  })

  // Assign gerente to unit
  await prisma.userUnit.upsert({
    where: {
      userId_unitId: { userId: gerente.id, unitId: unit1.id },
    },
    update: {},
    create: {
      userId: gerente.id,
      unitId: unit1.id,
    },
  })

  // Give modules to franqueador
  const allModules = [
    "BARBERSHOP",
    "LINKFOOD",
    "WAHASEND",
    "VIPCAM",
    "VIP_DATA",
    "TOTALIA",
    "INSTAGRAM",
  ] as const

  for (const mod of allModules) {
    await prisma.userModulePermission.upsert({
      where: {
        userId_unitId_module: {
          userId: franqueador.id,
          unitId: unit1.id,
          module: mod,
        },
      },
      update: {},
      create: {
        userId: franqueador.id,
        unitId: unit1.id,
        module: mod,
      },
    })
  }

  // Give barbershop + wahasend to gerente
  for (const mod of ["BARBERSHOP", "WAHASEND"] as const) {
    await prisma.userModulePermission.upsert({
      where: {
        userId_unitId_module: {
          userId: gerente.id,
          unitId: unit1.id,
          module: mod,
        },
      },
      update: {},
      create: {
        userId: gerente.id,
        unitId: unit1.id,
        module: mod,
      },
    })
  }

  console.log("Seed completed!")
  console.log("")
  console.log("Users created:")
  console.log("  admin@barbeariasuite.com / admin123 (Super Admin)")
  console.log("  franqueador@barbeariasuite.com / admin123 (Franqueador)")
  console.log("  gerente@barbeariasuite.com / admin123 (Gerente)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
