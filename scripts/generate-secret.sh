#!/bin/bash
# Gerar NEXTAUTH_SECRET para BarbeariaSuite

echo "=== Gerar NEXTAUTH_SECRET ==="

# Gerar segredo aleatório
SECRET=$(openssl rand -base64 32)

echo ""
echo "Adicione esta linha no seu arquivo .env:"
echo ""
echo "NEXTAUTH_SECRET=\"$SECRET\""
echo ""
echo "Ou execute este comando para copiar direto:"
echo ""
echo "echo \"NEXTAUTH_SECRET=\\\"$SECRET\\\"\" | pbcopy"
echo ""
