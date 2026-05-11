/**
 * Funções de sincronização ERP → Plataforma
 *
 * Mapeamento:
 *   ERP: unidades          → Platform: Unit
 *   ERP: usuarios          → Platform: BarbershopColaborador
 *   ERP: clientes          → Platform: BarbershopCliente
 *   ERP: vendas + itens    → Platform: BarbershopVenda
 *   ERP: produtos (serv.)  → Platform: VipDataServico
 *   ERP: agendas_fechamentos → Platform: VipDataFolga
 */

import { erpQuery } from "./client"
import { prisma } from "@/lib/prisma"

// ─── Tipos ERP ────────────────────────────────────────────────────────────────

interface ErpUnidade {
  id: number
  nome: string
  cidade: string
  estado: string
  telefone: string
  email: string
  status: number
  data_criacao: Date
}

interface ErpUsuario {
  id: number
  unidade: number
  nome: string
  email: string
  telefone: string
  cor: string
  comissao_servico: number
  comissao_produto: number
  data_contratacao: Date | null
  status: number
}

interface ErpCliente {
  id: number
  unidade: number
  nome: string
  telefone: string
  email: string
  cpf: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  data_nascimento: Date | null
  ultima_visita: Date | null
  ultima_visita_unidade: number | null
  tags: string | null
  origem: string | null
  consumo: number
  status: number
}

interface ErpVenda {
  id: number
  unidade: number
  usuario: number | null        // caixa que fechou
  cliente: number | null
  valor_total: number
  status: number
  data_criacao: Date
}

interface ErpVendaProduto {
  id: number
  venda: number
  colaborador: number | null
  produto: number | null
  quantidade: number
  valor_unitario: number
  valor_total: number
  comissao: number
  nome_produto: string
  categoria_produto: string
  tipo_produto: string
}

interface ErpVendaPagamento {
  venda: number
  forma_pagamento: string
  valor: number
}

interface ErpProduto {
  id: number
  unidade: number
  nome: string
  tipo: string     // S=serviço, P=produto
  categoria: string
  valor_venda: number
  valor_compra: number
  status: number
}

interface ErpAgendaFechamento {
  id: number
  unidade: number
  colaborador: number | null
  data_inicio: Date
  data_fim: Date
  motivo: string
  status: number
}

// ─── Resultado do sync ───────────────────────────────────────────────────────

export interface SyncResult {
  entity: string
  inserted: number
  updated: number
  errors: number
  errorDetails: string[]
}

// ─── Sync: Unidades ──────────────────────────────────────────────────────────

export async function syncUnidades(networkId: string): Promise<SyncResult> {
  const result: SyncResult = { entity: "unidades", inserted: 0, updated: 0, errors: 0, errorDetails: [] }

  const rows = await erpQuery<ErpUnidade>(
    `SELECT id, nome, cidade, estado, telefone, email, status
     FROM unidades
     WHERE status = 1
     ORDER BY id`
  )

  for (const row of rows) {
    try {
      const slug = row.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const existing = await prisma.unit.findUnique({ where: { erpId: row.id } })

      if (existing) {
        await prisma.unit.update({
          where: { id: existing.id },
          data: {
            name: row.nome,
            cidade: row.cidade,
            estado: row.estado,
            telefone: row.telefone,
            email: row.email,
          },
        })
        result.updated++
      } else {
        // Verificar se slug já existe
        let finalSlug = slug
        let attempt = 1
        while (await prisma.unit.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${attempt++}`
        }

        await prisma.unit.create({
          data: {
            name: row.nome,
            slug: finalSlug,
            networkId,
            erpId: row.id,
            cidade: row.cidade,
            estado: row.estado,
            telefone: row.telefone,
            email: row.email,
          },
        })
        result.inserted++
      }
    } catch (err: unknown) {
      result.errors++
      result.errorDetails.push(`Unidade ${row.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

// ─── Sync: Colaboradores ─────────────────────────────────────────────────────

export async function syncColaboradores(unitId: string, erpUnidadeId: number): Promise<SyncResult> {
  const result: SyncResult = { entity: "colaboradores", inserted: 0, updated: 0, errors: 0, errorDetails: [] }

  const rows = await erpQuery<ErpUsuario>(
    `SELECT id, unidade, nome, email, telefone, cor,
            comissao_servico, comissao_produto, data_contratacao, status
     FROM usuarios
     WHERE unidade = ? AND status = 1
     ORDER BY id`,
    [erpUnidadeId]
  )

  for (const row of rows) {
    try {
      const data = {
        unitId,
        erpId: row.id,
        nome: row.nome,
        email: row.email || null,
        telefone: row.telefone || null,
        cor: row.cor || null,
        comissaoServico: row.comissao_servico ?? null,
        comissaoProduto: row.comissao_produto ?? null,
        dataContratacao: row.data_contratacao ?? null,
        ativo: true,
      }

      const existing = await prisma.barbershopColaborador.findFirst({
        where: { unitId, erpId: row.id },
      })

      if (existing) {
        await prisma.barbershopColaborador.update({ where: { id: existing.id }, data })
        result.updated++
      } else {
        await prisma.barbershopColaborador.create({ data })
        result.inserted++
      }
    } catch (err: unknown) {
      result.errors++
      result.errorDetails.push(`Colaborador ${row.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

// ─── Sync: Clientes ──────────────────────────────────────────────────────────

export async function syncClientes(unitId: string, erpUnidadeId: number): Promise<SyncResult> {
  const result: SyncResult = { entity: "clientes", inserted: 0, updated: 0, errors: 0, errorDetails: [] }

  const rows = await erpQuery<ErpCliente>(
    `SELECT id, unidade, nome, telefone, email, cpf,
            bairro, cidade, estado, cep, data_nascimento,
            ultima_visita, ultima_visita_unidade, tags, origem, consumo, status
     FROM clientes
     WHERE unidade = ? AND status = 1
     ORDER BY id`,
    [erpUnidadeId]
  )

  for (const row of rows) {
    try {
      const data = {
        unitId,
        erpId: row.id,
        nome: row.nome,
        telefone: row.telefone || null,
        email: row.email || null,
        cpf: row.cpf || null,
        bairro: row.bairro || null,
        cidade: row.cidade || null,
        estado: row.estado || null,
        cep: row.cep || null,
        nascimento: row.data_nascimento ?? null,
        ultimaVisita: row.ultima_visita ?? null,
        ultimaVisitaUnidadeErp: row.ultima_visita_unidade ?? null,
        tags: row.tags || null,
        origem: row.origem || null,
        consumoTotal: row.consumo ?? 0,
        ativo: true,
      }

      const existing = await prisma.barbershopCliente.findFirst({
        where: { unitId, erpId: row.id },
      })

      if (existing) {
        await prisma.barbershopCliente.update({ where: { id: existing.id }, data })
        result.updated++
      } else {
        await prisma.barbershopCliente.create({ data })
        result.inserted++
      }
    } catch (err: unknown) {
      result.errors++
      result.errorDetails.push(`Cliente ${row.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

// ─── Sync: Vendas ─────────────────────────────────────────────────────────────

export async function syncVendas(
  unitId: string,
  erpUnidadeId: number,
  dataInicio?: Date,
  dataFim?: Date
): Promise<SyncResult> {
  const result: SyncResult = { entity: "vendas", inserted: 0, updated: 0, errors: 0, errorDetails: [] }

  // Construir filtro de data dinâmico
  const dateFilter = dataInicio && dataFim
    ? `AND v.data_criacao BETWEEN ? AND ?`
    : dataInicio
    ? `AND v.data_criacao >= ?`
    : ""

  const params: unknown[] = [erpUnidadeId]
  if (dataInicio) params.push(dataInicio)
  if (dataFim) params.push(dataFim)

  // Buscar vendas com itens e pagamentos em uma query
  const vendas = await erpQuery<ErpVenda>(
    `SELECT v.id, v.usuario, v.cliente, v.valor_total, v.status, v.data_criacao,
            cx.unidade
     FROM vendas v
     JOIN caixas cx ON cx.id = v.caixa
     WHERE cx.unidade = ? AND v.status = 1
     ${dateFilter}
     ORDER BY v.id DESC
     LIMIT 10000`,
    params
  )

  if (vendas.length === 0) return result

  const vendaIds = vendas.map((v) => v.id)

  // Buscar itens das vendas
  const itens = await erpQuery<ErpVendaProduto>(
    `SELECT vp.id, vp.venda, vp.colaborador, vp.produto,
            vp.quantidade, vp.valor_unitario, vp.valor_total, vp.comissao,
            p.nome AS nome_produto, p.categoria AS categoria_produto, p.tipo AS tipo_produto
     FROM vendas_produtos vp
     LEFT JOIN produtos p ON p.id = vp.produto
     WHERE vp.venda IN (${vendaIds.map(() => "?").join(",")})`,
    vendaIds
  )

  // Buscar pagamentos
  const pagamentos = await erpQuery<ErpVendaPagamento>(
    `SELECT vp.venda, fp.nome AS forma_pagamento, vp.valor
     FROM vendas_pagamentos vp
     LEFT JOIN formas_pagamentos fp ON fp.id = vp.forma_pagamento
     WHERE vp.venda IN (${vendaIds.map(() => "?").join(",")})`,
    vendaIds
  )

  // Agrupar por venda
  const itensPorVenda = itens.reduce<Record<number, ErpVendaProduto[]>>((acc, item) => {
    if (!acc[item.venda]) acc[item.venda] = []
    acc[item.venda].push(item)
    return acc
  }, {})

  const pagamentosPorVenda = pagamentos.reduce<Record<number, string>>((acc, pag) => {
    acc[pag.venda] = pag.forma_pagamento
    return acc
  }, {})

  // Buscar mapa colaborador erpId → platform id
  const colaboradores = await prisma.barbershopColaborador.findMany({
    where: { unitId },
    select: { id: true, erpId: true },
  })
  const colaboradorMap = Object.fromEntries(
    colaboradores
      .filter((c: { erpId: number | null }) => c.erpId != null)
      .map((c: { erpId: number; id: string }) => [c.erpId, c.id] as const)
  )

  // Buscar mapa cliente erpId → platform id
  const clientes = await prisma.barbershopCliente.findMany({
    where: { unitId },
    select: { id: true, erpId: true },
  })
  const clienteMap = Object.fromEntries(
    clientes
      .filter((c: { erpId: number | null }) => c.erpId != null)
      .map((c: { erpId: number; id: string }) => [c.erpId, c.id] as const)
  )

  for (const venda of vendas) {
    const vendaItens = itensPorVenda[venda.id] ?? []

    for (const item of vendaItens) {
      // vendaId único: combinação de venda.id + item.id do ERP
      const vendaId = `${venda.id}-${item.id}`

      try {
        const colaboradorPlatformId = item.colaborador
          ? colaboradorMap[item.colaborador] ?? null
          : null

        const clientePlatformId = venda.cliente
          ? clienteMap[venda.cliente] ?? null
          : null

        const data = {
          unitId,
          vendaId,
          colaboradorId: colaboradorPlatformId,
          colaboradorNome: null as string | null,
          clienteId: clientePlatformId,
          clienteNome: null as string | null,
          produto: item.nome_produto ?? null,
          categoria: item.tipo_produto === "S" ? "servico" : "produto",
          valorBruto: item.valor_total ?? 0,
          valorLiquido: item.valor_total ?? 0,
          formaPagamento: pagamentosPorVenda[venda.id] ?? null,
          vendaData: venda.data_criacao,
          source: "erp",
        }

        const existing = await prisma.barbershopVenda.findUnique({
          where: { unitId_vendaId: { unitId, vendaId } },
        })

        if (existing) {
          await prisma.barbershopVenda.update({ where: { id: existing.id }, data })
          result.updated++
        } else {
          await prisma.barbershopVenda.create({ data })
          result.inserted++
        }
      } catch (err: unknown) {
        result.errors++
        result.errorDetails.push(`Venda ${venda.id} item ${item.id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Venda sem itens — registrar somente o total
    if (vendaItens.length === 0) {
      const vendaId = `${venda.id}-0`
      try {
        const data = {
          unitId,
          vendaId,
          colaboradorId: null as string | null,
          colaboradorNome: null as string | null,
          clienteId: venda.cliente ? clienteMap[venda.cliente] ?? null : null,
          clienteNome: null as string | null,
          produto: null as string | null,
          categoria: null as string | null,
          valorBruto: venda.valor_total ?? 0,
          valorLiquido: venda.valor_total ?? 0,
          formaPagamento: pagamentosPorVenda[venda.id] ?? null,
          vendaData: venda.data_criacao,
          source: "erp",
        }

        const existing = await prisma.barbershopVenda.findUnique({
          where: { unitId_vendaId: { unitId, vendaId } },
        })

        if (existing) {
          await prisma.barbershopVenda.update({ where: { id: existing.id }, data })
          result.updated++
        } else {
          await prisma.barbershopVenda.create({ data })
          result.inserted++
        }
      } catch (err: unknown) {
        result.errors++
        result.errorDetails.push(`Venda ${venda.id} (sem itens): ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  return result
}

// ─── Sync: Serviços/Produtos ─────────────────────────────────────────────────

export async function syncServicos(unitId: string, erpUnidadeId: number): Promise<SyncResult> {
  const result: SyncResult = { entity: "servicos", inserted: 0, updated: 0, errors: 0, errorDetails: [] }

  const rows = await erpQuery<ErpProduto>(
    `SELECT id, unidade, nome, tipo, categoria, valor_venda, valor_compra, status
     FROM produtos
     WHERE unidade = ? AND status = 1
     ORDER BY id`,
    [erpUnidadeId]
  )

  for (const row of rows) {
    try {
      const data = {
        unitId,
        erpId: row.id,
        nome: row.nome,
        tipo: row.tipo ?? null,
        categoria: row.categoria ?? null,
        preco: row.valor_venda ?? 0,
        valorCompra: row.valor_compra ?? null,
        ativo: true,
      }

      const existing = await prisma.vipDataServico.findFirst({
        where: { unitId, erpId: row.id },
      })

      if (existing) {
        await prisma.vipDataServico.update({ where: { id: existing.id }, data })
        result.updated++
      } else {
        await prisma.vipDataServico.create({ data })
        result.inserted++
      }
    } catch (err: unknown) {
      result.errors++
      result.errorDetails.push(`Produto ${row.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

// ─── Sync: Folgas (agendas_fechamentos) ──────────────────────────────────────

export async function syncFolgas(unitId: string, erpUnidadeId: number): Promise<SyncResult> {
  const result: SyncResult = { entity: "folgas", inserted: 0, updated: 0, errors: 0, errorDetails: [] }

  const rows = await erpQuery<ErpAgendaFechamento>(
    `SELECT id, unidade, colaborador, data_inicio, data_fim, motivo, status
     FROM agendas_fechamentos
     WHERE unidade = ? AND status = 1
     ORDER BY id`,
    [erpUnidadeId]
  )

  // Mapa colaborador erpId → platform id
  const colaboradores = await prisma.barbershopColaborador.findMany({
    where: { unitId },
    select: { id: true, erpId: true, nome: true },
  })
  const colaboradorMap = Object.fromEntries(
    colaboradores
      .filter((c: { erpId: number | null }) => c.erpId != null)
      .map((c: { erpId: number; id: string; nome: string }) => [c.erpId, c] as const)
  )

  for (const row of rows) {
    try {
      const colab = row.colaborador ? colaboradorMap[row.colaborador] : null

      const data = {
        unitId,
        erpId: row.id,
        colaboradorId: colab?.id ?? null,
        colaboradorErpId: row.colaborador ?? null,
        colaboradorNome: colab?.nome ?? null,
        tipo: "fixa" as const,
        data: row.data_inicio,
        dataFim: row.data_fim,
        motivo: row.motivo ?? null,
        aprovada: true,
      }

      const existing = await prisma.vipDataFolga.findFirst({
        where: { unitId, erpId: row.id },
      })

      if (existing) {
        await prisma.vipDataFolga.update({ where: { id: existing.id }, data })
        result.updated++
      } else {
        await prisma.vipDataFolga.create({ data })
        result.inserted++
      }
    } catch (err: unknown) {
      result.errors++
      result.errorDetails.push(`Fechamento ${row.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

// ─── Sync completo de uma unidade ────────────────────────────────────────────

export async function syncUnidade(
  unitId: string,
  erpUnidadeId: number,
  opcoes?: {
    colaboradores?: boolean
    clientes?: boolean
    vendas?: boolean
    servicos?: boolean
    folgas?: boolean
    dataInicio?: Date
    dataFim?: Date
  }
): Promise<SyncResult[]> {
  const {
    colaboradores: syncColabs = true,
    clientes: syncClients = true,
    vendas: syncVends = true,
    servicos: syncServs = true,
    folgas: syncFolgs = true,
    dataInicio,
    dataFim,
  } = opcoes ?? {}

  const results: SyncResult[] = []

  if (syncColabs) results.push(await syncColaboradores(unitId, erpUnidadeId))
  if (syncClients) results.push(await syncClientes(unitId, erpUnidadeId))
  if (syncServs) results.push(await syncServicos(unitId, erpUnidadeId))
  if (syncFolgs) results.push(await syncFolgas(unitId, erpUnidadeId))
  if (syncVends) results.push(await syncVendas(unitId, erpUnidadeId, dataInicio, dataFim))

  return results
}
