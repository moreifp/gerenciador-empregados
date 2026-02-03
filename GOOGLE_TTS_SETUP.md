# Configuração do Google Cloud Text-to-Speech

Este documento descreve como configurar o Google Cloud Text-to-Speech para o sistema de TTS do aplicativo.

## Pré-requisitos

Você já tem a conta de serviço criada:
- **Email**: gerenciador-funcionarios@numeric-marker-374321.iam.gserviceaccount.com
- **Project ID**: numeric-marker-374321

## Passos para Configuração

### 1. Obter a Chave Privada da Conta de Serviço

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Selecione o projeto `numeric-marker-374321`
3. Navegue para **IAM & Admin** > **Service Accounts**
4. Encontre a conta de serviço `gerenciador-funcionarios@numeric-marker-374321.iam.gserviceaccount.com`
5. Clique nos três pontos (⋮) > **Manage keys**
6. Clique em **Add Key** > **Create new key**
7. Selecione o formato **JSON** e clique em **Create**
8. O arquivo JSON será baixado automaticamente

### 2. Ativar a API do Text-to-Speech

1. No Google Cloud Console, navegue para **APIs & Services** > **Library**
2. Procure por "Cloud Text-to-Speech API"
3. Clique em **Enable** se ainda não estiver ativada

### 3. Configurar Variáveis de Ambiente

#### Para desenvolvimento local:

1. Abra o arquivo JSON baixado no passo 1
2. Copie o conteúdo do arquivo `.env.example` para um novo arquivo `.env`
3. Preencha as seguintes variáveis:

```env
GOOGLE_PROJECT_ID=numeric-marker-374321
GOOGLE_CLIENT_EMAIL=gerenciador-funcionarios@numeric-marker-374321.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[COLE A CHAVE PRIVADA AQUI]\n-----END PRIVATE KEY-----\n"
```

**IMPORTANTE**: A chave privada deve estar entre aspas e com `\n` para quebras de linha.

#### Para produção (Vercel):

1. Acesse o dashboard do seu projeto na Vercel
2. Vá para **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:
   - `GOOGLE_PROJECT_ID`: numeric-marker-374321
   - `GOOGLE_CLIENT_EMAIL`: gerenciador-funcionarios@numeric-marker-374321.iam.gserviceaccount.com
   - `GOOGLE_PRIVATE_KEY`: Cole a chave privada completa do arquivo JSON (com `\n` para quebras de linha)

### 4. Permissões Necessárias

Certifique-se de que a conta de serviço tenha a seguinte permissão:
- **Cloud Text-to-Speech User** (roles/cloudtexttospeech.user)

Para verificar/adicionar:
1. No Google Cloud Console, vá para **IAM & Admin** > **IAM**
2. Encontre a conta de serviço
3. Clique em editar (ícone de lápis)
4. Adicione a role "Cloud Text-to-Speech User" se não estiver presente

### 5. Testar a Configuração

Após configurar as variáveis de ambiente:

1. Reinicie o servidor de desenvolvimento (`npm run dev`)
2. Tente usar o botão "Ler em Voz Alta" em qualquer tarefa
3. Verifique o console do navegador e os logs do servidor para mensagens de erro

## Vozes Disponíveis

O sistema está configurado para usar a voz feminina de alta qualidade do Google:
- **Nome**: pt-BR-Wavenet-A
- **Tipo**: WaveNet (neural, alta qualidade)
- **Gênero**: Feminino
- **Velocidade**: 0.85 (otimizada para naturalidade)

Outras vozes pt-BR disponíveis:
- pt-BR-Wavenet-B (Masculino)
- pt-BR-Wavenet-C (Feminino)
- pt-BR-Standard-A (Feminino, qualidade padrão)

## Solução de Problemas

### Erro: "Failed to generate speech"
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Confirme que a API do Text-to-Speech está ativada no projeto
- Verifique se a chave privada está no formato correto (com `\n` para quebras de linha)

### Erro: "Permission denied"
- Verifique se a conta de serviço tem a role "Cloud Text-to-Speech User"
- Confirme que você está usando o projeto correto (numeric-marker-374321)

### Áudio não toca
- Verifique o console do navegador para erros
- Certifique-se de que o navegador permite reprodução de áudio
- Teste em modo de navegação privada para descartar problemas de cache

## Custos

O Google Cloud Text-to-Speech tem os seguintes preços (2024):
- WaveNet voices: $16.00 por 1 milhão de caracteres
- Standard voices: $4.00 por 1 milhão de caracteres
- Primeiros 1 milhão de caracteres WaveNet por mês: **GRÁTIS**

Para uso típico de um gerenciador de tarefas, o custo deve ser mínimo ou zero.
