import { BarbershopCliente } from "@prisma/client"

/**
 * Calculate churn features for a client
 * These features are used by the ML model to predict churn probability
 */
export function calculateChurnFeatures(cliente: BarbershopCliente) {
  const agora = new Date()
  const ultimaVisita = cliente.ultimaVisita ? new Date(cliente.ultimaVisita) : null
  const dataCadastro = cliente.createdAt ? new Date(cliente.createdAt) : agora

  // dias_ultima_visita: Número de dias desde a última visita
  const diasUltimaVisita = ultimaVisita
    ? Math.floor((agora.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // frequencia_mensal: Número de Visitas por mês (estimado)
  // Calcula o número total de visitas no período e divide pela idade em meses
  const idadeCadastroMeses = Math.max(
    1,
    Math.floor((agora.getTime() - dataCadastro.getTime()) / (1000 * 60 * 60 * 24 * 30))
  )

  // Nota: Para calcular a frequência real, precisaríamos contar as vendas do cliente
  // Isso seria feito com uma query adicional ao banco
  const frequenciaMensal = 0 // Será calculado com base nas vendas

  // ticket_medio: Valor médio gasto por visita
  const ticketMedio = cliente.consumoTotal ? cliente.consumoTotal / Math.max(1, frequenciaMensal * idadeCadastroMeses) : 0

  // variabilidade_frequencia: Desvio padrão da frequência (simplificado)
  const variabilidadeFrequencia = 0 // Seria calculado com histórico de visitas

  // tendencia_declinio: 1 se última visita foi há muito tempo, 0 caso contrário
  const tendenciaDeclinio = diasUltimaVisita && diasUltimaVisita > 90 ? 1 : 0

  // valor_total_comprado: Valor total já gasto
  const valorTotalComprado = cliente.consumoTotal || 0

  // idade_cadastro: Tempo desde o cadastro em dias
  const idadeCadastro = Math.floor((agora.getTime() - dataCadastro.getTime()) / (1000 * 60 * 60 * 24))

  return {
    diasUltimaVisita: diasUltimaVisita ?? 0,
    frequenciaMensal: frequenciaMensal,
    ticketMedio: ticketMedio,
    variabilidadeFrequencia: variabilidadeFrequencia,
    tendenciaDeclinio: tendenciaDeclinio,
    valorTotalComprado: valorTotalComprado,
    idadeCadastro: idadeCadastro,
  }
}

/**
 * Type definition for churn features
 */
export type ChurnFeatures = {
  diasUltimaVisita: number
  frequenciaMensal: number
  ticketMedio: number
  variabilidadeFrequencia: number
  tendenciaDeclinio: number
  valorTotalComprado: number
  idadeCadastro: number
}
