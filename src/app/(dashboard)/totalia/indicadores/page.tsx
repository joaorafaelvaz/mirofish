import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default async function Page() {
  const hasAccess = await hasModuleAccess(Module.TOTALIA)
  if (!hasAccess) redirect("/")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Indicadores</h1>
        <p className="text-muted-foreground">KPIs e métricas de desempenho</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center py-16 gap-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Em breve — módulo em desenvolvimento</p>
        </CardContent>
      </Card>
    </div>
  )
}
