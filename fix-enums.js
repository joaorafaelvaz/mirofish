const fs = require('fs');
const path = require('path');

const moduleMap = {
  "BARBERSHOP": "Module.BARBERSHOP",
  "INSTAGRAM": "Module.INSTAGRAM",
  "LINKFOOD": "Module.LINKFOOD",
  "TOTALIA": "Module.TOTALIA",
  "VIP_DATA": "Module.VIP_DATA",
  "VIPCAM": "Module.VIPCAM",
  "WAHASEND": "Module.WAHASEND"
};

// Files to fix by module type
const filesByModule = {
  "BARBERSHOP": [
    "src/app/(dashboard)/barbershop/colaboradores/page.tsx",
    "src/app/(dashboard)/barbershop/comissoes/page.tsx",
    "src/app/(dashboard)/barbershop/metas/page.tsx",
    "src/app/(dashboard)/barbershop/page.tsx",
    "src/app/(dashboard)/barbershop/vendas/page.tsx",
    "src/app/(dashboard)/churn/page.tsx"
  ],
  "INSTAGRAM": [
    "src/app/(dashboard)/instagram/aprovacoes/page.tsx",
    "src/app/(dashboard)/instagram/bem-vindos/page.tsx",
    "src/app/(dashboard)/instagram/config/page.tsx",
    "src/app/(dashboard)/instagram/logs/page.tsx",
    "src/app/(dashboard)/instagram/monitoramento/page.tsx",
    "src/app/(dashboard)/instagram/page.tsx"
  ],
  "LINKFOOD": [
    "src/app/(dashboard)/linkfood/businesses/page.tsx",
    "src/app/(dashboard)/linkfood/checklists/page.tsx",
    "src/app/(dashboard)/linkfood/integrations/page.tsx",
    "src/app/(dashboard)/linkfood/page.tsx",
    "src/app/(dashboard)/linkfood/reviews/page.tsx"
  ],
  "TOTALIA": [
    "src/app/(dashboard)/totalia/cargos/page.tsx",
    "src/app/(dashboard)/totalia/colaboradores/page.tsx",
    "src/app/(dashboard)/totalia/compras/page.tsx",
    "src/app/(dashboard)/totalia/financeiro/page.tsx",
    "src/app/(dashboard)/totalia/ia-conselheiro/page.tsx",
    "src/app/(dashboard)/totalia/indicadores/page.tsx",
    "src/app/(dashboard)/totalia/marketing/page.tsx",
    "src/app/(dashboard)/totalia/oportunidades/page.tsx",
    "src/app/(dashboard)/totalia/page.tsx",
    "src/app/(dashboard)/totalia/planejamento/page.tsx",
    "src/app/(dashboard)/totalia/privilegios/page.tsx",
    "src/app/(dashboard)/totalia/problemas/page.tsx",
    "src/app/(dashboard)/totalia/processos/page.tsx",
    "src/app/(dashboard)/totalia/reunioes/page.tsx",
    "src/app/(dashboard)/totalia/riscos/page.tsx",
    "src/app/(dashboard)/totalia/tarefas/page.tsx"
  ],
  "VIP_DATA": [
    "src/app/(dashboard)/vip-data/calendario/page.tsx",
    "src/app/(dashboard)/vip-data/page.tsx",
    "src/app/(dashboard)/vip-data/relatorios/page.tsx",
    "src/app/(dashboard)/vip-data/servicos/page.tsx",
    "src/app/(dashboard)/vip-data/sincronizacao/page.tsx"
  ],
  "VIPCAM": [
    "src/app/(dashboard)/vipcam/analytics/page.tsx",
    "src/app/(dashboard)/vipcam/cameras/page.tsx",
    "src/app/(dashboard)/vipcam/page.tsx",
    "src/app/(dashboard)/vipcam/pessoas/page.tsx",
    "src/app/(dashboard)/vipcam/settings/page.tsx"
  ],
  "WAHASEND": [
    "src/app/(dashboard)/wahasend/page.tsx"
  ]
};

const projectRoot = "D:\\Dev\\Barbearia VIP\\barbeariasuite_v2";

function fixFile(filePath, module) {
  const fullPath = path.join(projectRoot, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');

  const regex = new RegExp(`hasModuleAccess\\("${module}"\\)`, 'g');
  if (!content.includes(`hasModuleAccess("${module}")`)) return;

  // Add enum import after permissions import
  let newContent = content.replace(
    `import { hasModuleAccess } from "@/lib/permissions"`,
    `import { hasModuleAccess } from "@/lib/permissions"\nimport { Module } from "@/generated/prisma/enums"`
  );

  // Replace the string literal with enum value
  newContent = newContent.replace(regex, `hasModuleAccess(${moduleMap[module]})`);

  fs.writeFileSync(fullPath, newContent);
  console.log(`Fixed: ${filePath}`);
}

// Process all files
for (const [module, files] of Object.entries(filesByModule)) {
  for (const file of files) {
    fixFile(file, module);
  }
}

console.log("\nAll files fixed!");
