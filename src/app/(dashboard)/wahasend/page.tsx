import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import { WizardProvider } from "@/lib/wahasend/wizard-context"
import Wizard from "@/components/wahasend/wizard"

export default async function WahasendPage() {
  const hasAccess = await hasModuleAccess(Module.WAHASEND)
  if (!hasAccess) redirect("/")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Send</h1>
        <p className="text-muted-foreground">
          Envio de mensagens em massa via WhatsApp
        </p>
      </div>
      <WizardProvider>
        <Wizard />
      </WizardProvider>
    </div>
  )
}
