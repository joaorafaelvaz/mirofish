import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

function getPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaMariaDb(databaseUrl);
  return new PrismaClient({ adapter });
}

// Lazy initialization: create the client only when first accessed
// This avoids issues during build time when DATABASE_URL is not available
export const prisma: any = {
  get client() {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = getPrismaClient();
    }
    return globalForPrisma.prisma;
  },
  // Re-export common methods for direct access (e.g., prisma.user.findMany)
  ...((() => {
    try {
      const client = getPrismaClient();
      // Create a proxy that delegates to the actual client
      return new Proxy(client, {
        get: (target: any, prop: string) => {
          if (prop in target) {
            return target[prop];
          }
          return (client as any)[prop];
        },
      });
    } catch (e) {
      // During build time, return a proxy that throws on access
      return new Proxy({}, {
        get: () => {
          throw new Error("DATABASE_URL environment variable is not set");
        },
      });
    }
  })()),
};
