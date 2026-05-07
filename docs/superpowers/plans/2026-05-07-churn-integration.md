# Barbearia VIP - Churn Integration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the MiroFish churn prediction microservice into the Barbearia VIP Next.js app by adding API routes, database schema migrations, and frontend components to display churn predictions.

**Architecture:** 
- Add API routes to Next.js for MiroFish integration
- Create database migrations for churn prediction storage
- Add dashboard components for viewing predictions and actions
- Use existing MySQL connection pool (Prisma)

**Tech Stack:** Next.js 16, Prisma, React, TypeScript, TailwindCSS

---

## File Structure

```
barbeariasuite_v2/
├── prisma/
│   └── migrations/
│       └── 20260507000000_churn_tables/
│           └── migration.sql
├── src/
│   ├── app/
│   │   └── (dashboard)/churn/
│   │       └── page.tsx              # Churn dashboard
│   ├── lib/
│   │   └── churn/
│   │       ├── client.ts             # API client for MiroFish
│   │       ├── actions.ts            # Server actions
│   │       └── types.ts              # TypeScript types
│   └── app/
│       └── api/
│           └── churn/
│               ├── predict/
│               │   └── route.ts      # Proxy to MiroFish
│               ├── trigger/
│               │   └── route.ts
│               └── stats/
│                   └── route.ts
├── components/
│   └── churn/
│       ├── ChurnList.tsx
│       ├── ChurnChart.tsx
│       ├── RiskBadge.tsx
│       └── ActionModal.tsx
└── docs/
    └── schema.sql                    # MySQL migration script
```

---

## Chunk 1: Database Schema

### Task 1: Create Migrations

**Files:**
- Create: `prisma/migrations/20260507000000_churn_tables/migration.sql`
- Modify: `prisma/schema.prisma` (add models)

- [ ] **Step 1: Create migration file**

```sql
-- prisma/migrations/20260507000000_churn_tables/migration.sql
-- Create churn prediction tables
-- This migration adds tables to store churn predictions and actions

-- Tabela de previsões
CREATE TABLE IF NOT EXISTS churn_predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  unidade_id INT NOT NULL,
  score_risco TINYINT UNSIGNED NOT NULL,
  probabilidade FLOAT NOT NULL,
  features JSON,
  previsao_data DATETIME NOT NULL,
  proxima_visita_prevista DATE,
  status ENUM('ativo', 'em_risco', 'em_risco_alto', 'perdido'),
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cliente (cliente_id),
  INDEX idx_previsao (previsao_data),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de ações
CREATE TABLE IF NOT EXISTS churn_acoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  unidade_id INT NOT NULL,
  tipo_acao ENUM('email', 'sms', 'whatsapp', 'desconto', 'alerta') NOT NULL,
  mensagem TEXT,
  status ENUM('pendente', 'enviado', 'falhou', 'ignorado', 'respondeu') DEFAULT 'pendente',
  data_acao DATETIME,
  response_data JSON,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_cliente (cliente_id),
  INDEX idx_status (status),
  INDEX idx_data (data_acao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs
CREATE TABLE IF NOT EXISTS churn_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo_processamento ENUM('diario', 'manual', 'agendado') NOT NULL,
  registros_analisados INT,
  previsoes_geradas INT,
  acoes_disparadas INT,
  status ENUM('success', 'error'),
  erro_mensagem TEXT,
  duration_ms INT,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configuração de ações
CREATE TABLE IF NOT EXISTS churn_acoes_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unidade_id INT,
  tipo_acao ENUM('email', 'sms', 'whatsapp', 'desconto', 'alerta'),
  ativo BOOLEAN DEFAULT TRUE,
  mensagem_template TEXT,
  score_min INT DEFAULT 0,
  score_max INT DEFAULT 100,
  criado_em DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Add Prisma models to schema.prisma**

```prisma
// Add after existing models, before closing //

// ─── Churn Prediction Models ───────────────────────────────────────────────────

model ChurnPrediction {
  id                  Int      @id @default(autoincrement())
  clienteId           Int
  unidadeId           Int
  scoreRisco          Int      @db.TinyInt
  probabilidade       Float
  features            Json?
  previsaoData        DateTime @db.DateTime
  proximaVisitaPrevista Date?  @db.Date
  status              String   @churnStatus
  createdAt           DateTime @default(now()) @db.DateTime
  updatedAt           DateTime @updatedAt @db.DateTime

  cliente ChurnCliente @relation(fields: [clienteId], references: [id], onDelete: Cascade)

  @@index([clienteId])
  @@index([previsaoData])
  @@index([status])
  @@index([unidadeId])
}

model ChurnAcao {
  id            Int      @id @default(autoincrement())
  clienteId     Int
  unidadeId     Int
  tipoAcao      String   @churnAcaoType
  mensagem      String?
  status        String   @churnAcaoStatus @default("pendente")
  dataAcao      DateTime? @db.DateTime
  responseData  Json?
  createdAt     DateTime @default(now()) @db.DateTime

  cliente ChurnCliente @relation(fields: [clienteId], references: [id], onDelete: Cascade)

  @@index([clienteId])
  @@index([status])
  @@index([dataAcao])
}

model ChurnLog {
  id                    Int      @id @default(autoincrement())
  tipoProcessamento     String   @churnProcessamentoType
  registrosAnalizados   Int
  previsoesGeradas      Int
  acoesDisparadas       Int
  status                String   @churnLogStatus
  erroMensagem          String?
  durationMs            Int
  createdAt             DateTime @default(now()) @db.DateTime
}

model ChurnAcaoConfig {
  id              Int      @id @default(autoincrement())
  unidadeId       Int?
  tipoAcao        String   @churnAcaoType
  ativo           Boolean  @default(true)
  mensagemTemplate String?
  scoreMin        Int      @default(0)
  scoreMax        Int      @default(100)
  criadoEm        DateTime @default(now()) @db.DateTime
}
```

Add enums to existing schema:

```prisma
// Add at top with other enums //
enum ChurnStatus {
  ativo
  em_risco
  em_risco_alto
  perdido
}

enum ChurnAcaoType {
  email
  sms
  whatsapp
  desconto
  alerta
}

enum ChurnAcaoStatus {
  pendente
  enviado
  falhou
  ignorado
  respondeu
}

enum ChurnProcessamentoType {
  diario
  manual
  agendado
}

enum ChurnLogStatus {
  success
  error
}
```

- [ ] **Step 3: Generate and run migration**

```bash
# From barbeariasuite_v2 directory
cd "D:/Dev/Barbearia VIP/barbeariasuite_v2"
npx prisma migrate dev --name churn_tables
npx prisma generate
```

- [ ] **Step 4: Verify tables created**

```bash
npx prisma studio
# Check churn_predictions, churn_acoes, churn_logs, churn_acoes_config tables exist
```

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add churn prediction database schema"
```

---

## Chunk 2: API Routes

### Task 2: Create Churn API Routes

**Files:**
- Create: `src/app/api/churn/predict/route.ts`
- Create: `src/app/api/churn/trigger/route.ts`
- Create: `src/app/api/churn/stats/route.ts`

- [ ] **Step 1: Create predict route**

```typescript
// src/app/api/churn/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidadeId');
    const clienteId = searchParams.get('clienteId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!unidadeId) {
      return NextResponse.json(
        { error: 'unidadeId é obrigatório' },
        { status: 400 }
      );
    }

    // Build query
    const where: any = { unidadeId: parseInt(unidadeId) };
    
    if (clienteId) {
      where.clienteId = parseInt(clienteId);
    }

    const predictions = await prisma.churnPrediction.findMany({
      where,
      take: limit,
      orderBy: { scoreRisco: 'desc' },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
            ultimaVisita: true,
            cpf: true,
            bairro: true,
            cidade: true,
            estado: true,
          }
        }
      }
    });

    // Calculate summary stats
    const total = predictions.length;
    const emRisco = predictions.filter(p => ['em_risco', 'em_risco_alto', 'perdido'].includes(p.status)).length;
    const emRiscoAlto = predictions.filter(p => ['em_risco_alto', 'perdido'].includes(p.status)).length;

    return NextResponse.json({
      data: predictions.map(p => ({
        clienteId: p.clienteId,
        nome: p.cliente?.nome,
        telefone: p.cliente?.telefone,
        email: p.cliente?.email,
        scoreRisco: p.scoreRisco,
        probabilidade: p.probabilidade,
        status: p.status,
        features: p.features,
        ultimaVisita: p.cliente?.ultimaVisita,
      })),
      total,
      emRisco,
      emRiscoAlto
    });
  } catch (error) {
    console.error('Churn predict error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar previsões' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

- [ ] **Step 2: Create trigger route**

```typescript
// src/app/api/churn/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unidadeId, forceReprocess = false } = body;

    if (!unidadeId) {
      return NextResponse.json(
        { error: 'unidadeId é obrigatório' },
        { status: 400 }
      );
    }

    // Trigger MiroFish webhook
    const miroFishUrl = process.env.MIROFISH_URL || 'http://localhost:8000';
    const webhookUrl = `${miroFishUrl}/api/churn/trigger`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unidade_id: unidadeId, force_reprocess: forceReprocess })
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: 'Erro ao disparar processamento', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Processamento iniciado',
      data: result
    });
  } catch (error) {
    console.error('Churn trigger error:', error);
    return NextResponse.json(
      { error: 'Erro ao disparar processamento' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

- [ ] **Step 3: Create stats route**

```typescript
// src/app/api/churn/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidadeId');

    if (!unidadeId) {
      return NextResponse.json(
        { error: 'unidadeId é obrigatório' },
        { status: 400 }
      );
    }

    // Get prediction stats
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status = 'em_risco' THEN 1 ELSE 0 END) as em_risco,
        SUM(CASE WHEN status = 'em_risco_alto' THEN 1 ELSE 0 END) as em_risco_alto,
        SUM(CASE WHEN status = 'perdido' THEN 1 ELSE 0 END) as perdidos
      FROM churn_predictions
      WHERE unidadeId = ${parseInt(unidadeId)}
    `;

    // Get recent actions
    const recentActions = await prisma.churnAcao.findMany({
      where: { unidadeId: parseInt(unidadeId) },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { cliente: { select: { nome: true, telefone: true } } }
    });

    // Get recent logs
    const recentLogs = await prisma.churnLog.findMany({
      where: {},
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      stats: stats[0],
      recentActions,
      recentLogs
    });
  } catch (error) {
    console.error('Churn stats error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

- [ ] **Step 4: Create action types file**

```typescript
// src/lib/churn/types.ts
export type ChurnStatus = 'ativo' | 'em_risco' | 'em_risco_alto' | 'perdido';
export type ChurnAcaoType = 'email' | 'sms' | 'whatsapp' | 'desconto' | 'alerta';
export type ChurnProcessamentoType = 'diario' | 'manual' | 'agendado';
export type ChurnAcaoStatus = 'pendente' | 'enviado' | 'falhou' | 'ignorado' | 'respondeu';

export interface ChurnFeatureSet {
  diasUltimaVisita: number;
  frequenciaMensal: number;
  ticketMedio: number;
  variabilidadeFrequencia: number;
  tendenciaDeclinio: number;
  valorTotalComprado: number;
  idadeCadastro: number;
}

export interface ChurnPrediction {
  id: number;
  clienteId: number;
  unidadeId: number;
  scoreRisco: number;
  probabilidade: number;
  features: ChurnFeatureSet | null;
  previsaoData: Date;
  proximaVisitaPrevista: Date | null;
  status: ChurnStatus;
  createdAt: Date;
  updatedAt: Date;
  cliente?: {
    id: number;
    nome: string;
    telefone: string | null;
    email: string | null;
    ultimaVisita: Date | null;
  };
}

export interface ChurnAcao {
  id: number;
  clienteId: number;
  unidadeId: number;
  tipoAcao: ChurnAcaoType;
  mensagem: string | null;
  status: ChurnAcaoStatus;
  dataAcao: Date | null;
  createdAt: Date;
}

export interface ChurnLog {
  id: number;
  tipoProcessamento: ChurnProcessamentoType;
  registrosAnalizados: number;
  previsoesGeradas: number;
  acoesDisparadas: number;
  status: 'success' | 'error';
  erroMensagem: string | null;
  durationMs: number;
  createdAt: Date;
}

export interface ChurnActionConfig {
  id: number;
  unidadeId: number | null;
  tipoAcao: ChurnAcaoType;
  ativo: boolean;
  mensagemTemplate: string | null;
  scoreMin: number;
  scoreMax: number;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/churn/
git commit -m "feat: add churn API routes"
```

---

## Chunk 3: Client Library and Actions

### Task 3: Create Client Library

**Files:**
- Create: `src/lib/churn/client.ts`
- Create: `src/lib/churn/actions.ts`

- [ ] **Step 1: Create client.ts**

```typescript
// src/lib/churn/client.ts
import { ChurnPrediction, ChurnAcao, ChurnLog, ChurnStatus } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_MIROFISH_URL || 'http://localhost:8000';

export async function getChurnPredictions(unidadeId: number, limit: number = 100): Promise<{
  data: ChurnPrediction[];
  total: number;
  emRisco: number;
  emRiscoAlto: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/churn/predict?unidadeId=${unidadeId}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch predictions');
  return response.json();
}

export async function triggerChurnProcessing(unidadeId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/churn/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unidadeId })
  });
  if (!response.ok) throw new Error('Failed to trigger processing');
  return response.json();
}

export async function getChurnStats(unidadeId: number): Promise<{
  stats: {
    total: number;
    ativos: number;
    emRisco: number;
    emRiscoAlto: number;
    perdidos: number;
  };
  recentActions: ChurnAcao[];
  recentLogs: ChurnLog[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/churn/stats?unidadeId=${unidadeId}`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function getPredictionByCliente(clienteId: number): Promise<ChurnPrediction> {
  const response = await fetch(`${API_BASE_URL}/api/churn/predict/cliente/${clienteId}`);
  if (!response.ok) throw new Error('Failed to fetch prediction');
  return response.json();
}

export function getRiskColor(status: ChurnStatus): string {
  switch (status) {
    case 'ativo': return 'bg-green-100 text-green-800';
    case 'em_risco': return 'bg-yellow-100 text-yellow-800';
    case 'em_risco_alto': return 'bg-orange-100 text-orange-800';
    case 'perdido': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getRiskBadge(status: ChurnStatus): React.ReactNode {
  const colors = getRiskColor(status);
  const labels: Record<ChurnStatus, string> = {
    ativo: 'Baixo Risco',
    em_risco: 'Médio Risco',
    em_risco_alto: 'Alto Risco',
    perdido: 'Perdido'
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors}`}>{labels[status]}</span>;
}
```

- [ ] **Step 2: Create actions.ts**

```typescript
// src/lib/churn/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getChurnPredictions, triggerChurnProcessing, getChurnStats } from './client';

export async function fetchChurnPredictions(unidadeId: number) {
  try {
    return await getChurnPredictions(unidadeId);
  } catch (error) {
    console.error('Failed to fetch churn predictions:', error);
    throw error;
  }
}

export async function runChurnProcessing(unidadeId: number) {
  try {
    await triggerChurnProcessing(unidadeId);
    revalidatePath('/churn', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to run churn processing:', error);
    return { success: false, error: 'Erro ao processar' };
  }
}

export async function fetchChurnStats(unidadeId: number) {
  try {
    return await getChurnStats(unidadeId);
  } catch (error) {
    console.error('Failed to fetch churn stats:', error);
    throw error;
  }
}

export async function exportChurnReport(unidadeId: number) {
  'use server';
  const { data } = await getChurnPredictions(unidadeId);
  
  // Generate CSV
  const csv = [
    ['Nome', 'Telefone', 'Score Risco', 'Status', 'Probabilidade', 'Última Visita'].join(','),
    ...data.map(c => [
      `"${c.nome}"`,
      c.telefone || '',
      c.scoreRisco,
      c.status,
      c.probabilidade,
      c.ultimaVisita || ''
    ].join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  return { url, fileName: `churn-relatorio-${unidadeId}.csv` };
}
```

- [ ] **Step 3: Create test files**

```typescript
// src/lib/churn/__tests__/client.test.ts
import { getRiskColor, getRiskBadge } from '../client';

test('getRiskColor returns correct colors', () => {
  expect(getRiskColor('ativo')).toBe('bg-green-100 text-green-800');
  expect(getRiskColor('em_risco')).toBe('bg-yellow-100 text-yellow-800');
  expect(getRiskColor('em_risco_alto')).toBe('bg-orange-100 text-orange-800');
  expect(getRiskColor('perdido')).toBe('bg-red-100 text-red-800');
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/churn/
git commit -m "feat: add churn client library"
```

---

## Chunk 4: Frontend Components

### Task 4: Create Dashboard Component

**Files:**
- Create: `src/app/(dashboard)/churn/page.tsx`

- [ ] **Step 1: Create main dashboard page**

```typescript
// src/app/(dashboard)/churn/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Chip } from '@nextui-org/chip';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@nextui-org/table';
import { Spinner } from '@nextui-org/spinner';
import { Input } from '@nextui-org/input';
import { Alert } from '@nextui-org/alert';

import { fetchChurnPredictions, fetchChurnStats } from '@/lib/churn/actions';
import { getRiskColor } from '@/lib/churn/client';

interface Prediction {
  clienteId: number;
  nome: string;
  scoreRisco: number;
  status: string;
  probabilidade: number;
}

export default function ChurnDashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unidadeId, setUnidadeId] = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [unidadeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [predictionsData, statsData] = await Promise.all([
        fetchChurnPredictions(unidadeId),
        fetchChurnStats(unidadeId)
      ]);
      setPredictions(predictionsData.data);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPredictions = predictions.filter(p => 
    p.nome.toLowerCase().includes(filter.toLowerCase()) ||
    p.telefone?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Carregando dados..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Predição de Evasão</h1>
        <div className="flex gap-2">
          <Input 
            placeholder="Filtrar clientes..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button color="primary" onPress={loadData}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="text-sm text-gray-500">Total Clientes</div>
          </CardBody>
        </Card>
        <Card className="bg-green-50">
          <CardBody>
            <div className="text-2xl font-bold text-green-600">{stats?.ativos || 0}</div>
            <div className="text-sm text-gray-500">Baixo Risco</div>
          </CardBody>
        </Card>
        <Card className="bg-yellow-50">
          <CardBody>
            <div className="text-2xl font-bold text-yellow-600">{stats?.emRisco || 0}</div>
            <div className="text-sm text-gray-500">Médio Risco</div>
          </CardBody>
        </Card>
        <Card className="bg-orange-50">
          <CardBody>
            <div className="text-2xl font-bold text-orange-600">{stats?.emRiscoAlto || 0}</div>
            <div className="text-sm text-gray-500">Alto Risco</div>
          </CardBody>
        </Card>
      </div>

      {/* Prediction Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold">Clientes em Risco</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Churn predictions">
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>TELEFONE</TableColumn>
              <TableColumn>SCORE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>PROBABILIDADE</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredPredictions.map((prediction) => (
                <TableRow key={prediction.clienteId}>
                  <TableCell>{prediction.nome}</TableCell>
                  <TableCell>{prediction.telefone}</TableCell>
                  <TableCell className="font-bold">{prediction.scoreRisco}</TableCell>
                  <TableCell>
                    <Chip 
                      className={getRiskColor(prediction.status)}
                      size="sm"
                    >
                      {prediction.status.replace('_', ' ')}
                    </Chip>
                  </TableCell>
                  <TableCell>{(prediction.probabilidade * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create RiskBadge component**

```typescript
// src/components/churn/RiskBadge.tsx
'use client';

import { ChurnStatus } from '@/lib/churn/types';

interface RiskBadgeProps {
  status: ChurnStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ status, size = 'md' }: RiskBadgeProps) {
  const colors = {
    ativo: 'bg-green-100 text-green-800 border-green-200',
    em_risco: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    em_risco_alto: 'bg-orange-100 text-orange-800 border-orange-200',
    perdido: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels: Record<ChurnStatus, string> = {
    ativo: 'Baixo Risco',
    em_risco: 'Risco Médio',
    em_risco_alto: 'Risco Alto',
    perdido: 'Cliente Perdido',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${colors[status]} ${sizeClasses[size]}`}>
      {labels[status]}
    </span>
  );
}
```

- [ ] **Step 3: Create ChurnChart component**

```typescript
// src/components/churn/ChurnChart.tsx
'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ChurnChartProps {
  predictions: Array<{ status: string; count: number }>;
}

const COLORS = ['#4ade80', '#facc15', '#fb923c', '#ef4444'];

export function ChurnChart({ predictions }: ChurnChartProps) {
  const data = useMemo(() => {
    const statusMap: Record<string, number> = {};
    predictions.forEach(p => {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    });
    
    return [
      { name: 'Baixo Risco', value: statusMap['ativo'] || 0, color: COLORS[0] },
      { name: 'Risco Médio', value: statusMap['em_risco'] || 0, color: COLORS[1] },
      { name: 'Risco Alto', value: statusMap['em_risco_alto'] || 0, color: COLORS[2] },
      { name: 'Perdido', value: statusMap['perdido'] || 0, color: COLORS[3] },
    ].filter(d => d.value > 0);
  }, [predictions]);

  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Sem dados para exibir</div>;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/churn/ src/components/churn/
git commit -m "feat: add churn dashboard components"
```

---

## Chunk 5: Settings and Configuration

### Task 5: Environment Configuration

**Files:**
- Modify: `.env.example`
- Modify: `prisma/.env`

- [ ] **Step 1: Update .env.example**

```env
# ... existing env vars ...

# MiroFish Integration
MIROFISH_URL=http://localhost:8000
```

- [ ] **Step 2: Update prisma/.env**

```env
# ... existing env vars ...

# MiroFish Configuration
MIROFISH_URL=http://localhost:8000
```

- [ ] **Step 3: Commit**

```bash
git add .env.example prisma/.env
git commit -m "chore: add MiroFish environment configuration"
```

---

## Final Checklist

- [ ] All migrations run: `npx prisma migrate dev`
- [ ] API routes work: `curl http://localhost:3000/api/churn/predict?unidadeId=1`
- [ ] Dashboard loads without errors
- [ ] Prisma models are generated: `npx prisma generate`
- [ ] Git log shows all commits

---

**Total:** 5 chunks, ~3-4 days for integration
