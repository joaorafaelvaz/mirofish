# BarbeariaSuite Health Check
# Usado pelo systemd e reverse proxy para verificar saúde da aplicação

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Verificar se o database está acessível
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json({ status: "error", message: "DATABASE_URL not configured" }, { status: 500 })
    }

    // Se chegou aqui, basicamente a aplicação está rodando
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 500 })
  }
}
