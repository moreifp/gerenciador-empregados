# Sistema de Recr iação Automática de Tarefas Recorrentes

## 📋 Visão Geral

Este documento descreve o funcionamento do sistema implementado para recriar automaticamente tarefas recorrentes quando marcadas como concluídas.

## 🎯 Funcionalidades Implementadas

### 1. **Tipos de Recorrência Suportados**

O sistema suporta 4 tipos de recorrência:

#### ✅ **Diária (Daily)**
- **Comportamento**: A tarefa se repete todo dia
- **Exemplo**: Tarefa concluída hoje (11/fev) → Nova tarefa criada para amanhã (12/fev)

#### ✅ **Semanal (Weekly)**  
- **Comportamento**: A tarefa se repete no mesmo dia da semana, toda semana
- **Exemplo**: Tarefa de terça-feira concluída → Nova tarefa criada para próxima terça-feira (7 dias depois)

#### ✅ **Mensal (Monthly)**
- **Comportamento**: A tarefa se repete no mesmo dia do mês
- **Exemplo**: Tarefa do dia 15 concluída → Nova tarefa criada para dia 15 do próximo mês
- **Tratamento especial**: Se o dia não existir no próximo mês (ex: 31/jan → fev), usa o último dia válido

#### ✅ **Personalizada (Custom)**
- **Comportamento**: A tarefa se repete em dias específicos da semana escolhidos pelo usuário
- **Exemplo**: Tarefa configurada para Terça (2) e Quinta (4)
  - Concluída na terça → Nova tarefa para próxima quinta
  - Concluída na quinta → Nova tarefa para próxima terça

## 🔧 Arquitetura da Solução

### Arquivo: `/src/utils/recurrence.ts`

Função principal: `getNextRecurrenceDate()`

```typescript
/**
 * Calcula a próxima data de ocorrência para uma tarefa recorrente
 * @param currentDate - Data atual da tarefa (formato YYYY-MM-DD)
 * @param recurrenceType - Tipo de recorrência ('daily' | 'weekly' | 'monthly' | 'custom')
 * @param recurrenceDay - Número do dia (0-6 para semanal, 1-31 para mensal)
 * @param recurrenceDays - Array de dias da semana para recorrência personalizada
 * @returns Próxima data em formato YYYY-MM-DD ou null se não for recorrente
 */
```

### Arquivo: `/src/pages/Tasks.tsx`

Função modificada: `handleStatusChange()`

**Fluxo de execução quando uma tarefa é concluída:**

1. ✅ **Atualizar status** da tarefa para 'completed'
2. ✅ **Verificar** se a tarefa é recorrente (`recurrenceType !== 'none'`)
3. ✅ **Buscar** dados completos da tarefa do banco de dados
4. ✅ **Calcular** próxima data usando `getNextRecurrenceDate()`
5. ✅ **Criar nova tarefa** com:
   - Mesma descrição, responsável(is), tipo, configurações de recorrência
   - Status: `pending`
   - Data: próxima ocorrência calculada
   - Proof fields: vazios (nova tarefa)
6. ✅ **Recriar assignees** se a tarefa tiver múltiplos responsáveis
7. ✅ **Atualizar** estado local para mostrar imediatamente a nova tarefa

## 📅 Exemplos de Uso

### Exemplo 1: Tarefa Diária
```
Tarefa: "Limpar cozinha"
Recorrência: Daily
Data: 2026-02-11

✅ Marcada como concluída
➡️ Nova tarefa criada para: 2026-02-12
```

### Exemplo 2: Tarefa Semanal
```
Tarefa: "Reunião de equipe"
Recorrência: Weekly (Terça-feira)
Data: 2026-02-11 (terça)

✅ Marcada como concluída
➡️ Nova tarefa criada para: 2026-02-18 (próxima terça)
```

### Exemplo 3: Tarefa Mensal
```
Tarefa: "Pagamento de aluguel"
Recorrência: Monthly (dia 5)
Data: 2026-02-05

✅ Marcada como concluída
➡️ Nova tarefa criada para: 2026-03-05
```

### Exemplo 4: Tarefa Personalizada (Terças e Quintas)
```
Tarefa: "Ir à academia"
Recorrência: Custom [2, 4] (terça e quinta)
Data: 2026-02-11 (terça, dia 2)

✅ Marcada como concluída
➡️ Nova tarefa criada para: 2026-02-13 (quinta, dia 4)

---

Quando a tarefa de quinta for concluída:
Data: 2026-02-13 (quinta, dia 4)

✅ Marcada como concluída
➡️ Nova tarefa criada para: 2026-02-18 (próxima terça, dia 2)
```

## 🔍 Lógica de Recorrência Personalizada

Para recorrência personalizada, o algoritmo:

1. **Identifica** o dia da semana atual (0=Domingo, 1=Segunda, ..., 6=Sábado)
2. **Procura** o próximo dia na lista de dias selecionados
3. Se encontrar um dia **maior** que o atual na mesma semana → usa esse dia
4. Se **não encontrar** na semana atual → usa o primeiro dia da lista na próxima semana

**Exemplo detalhado:**
```
recurrenceDays: [2, 4, 6] (Terça, Quinta, Sábado)

Concluída Segunda (dia 1):
  → Próximo dia > 1 na lista: 2 (Terça)
  → Dias até próxima ocorrência: 2 - 1 = 1 dia

Concluída Quinta (dia 4):
  → Próximo dia > 4 na lista: 6 (Sábado)
  → Dias até próxima ocorrência: 6 - 4 = 2 dias

Concluída Sábado (dia 6):
  → Não há dia > 6 na lista
  → Usa primeiro dia da lista: 2 (Terça)
  → Dias até próxima ocorrência: (7 - 6) + 2 = 3 dias
```

## ✨ Características Importantes

### 1. **Preservação de Dados**
- Nova tarefa mantém: descrição, responsáveis, tipo, configurações de recorrência
- Nova tarefa limpa: proof de conclusão, data de conclusão

### 2. **Múltiplos Responsáveis**
- Se a tarefa original tinha múltiplos assignees na tabela `task_assignees`
- A nova tarefa recria todos os assignees

### 3. **UX Otimizada**
- Atualização imediata do estado local (não precisa recarregar página)
- Nova tarefa aparece automaticamente na lista
- Log no console para debug: `✅ Recurring task recreated for YYYY-MM-DD`

### 4. **Tratamento de Erros**
- Try-catch global para capturar erros
- Logs detalhados de erros para debug
- Sistema não quebra se houver erro na recriação

## 🧪 Como Testar

1. **Criar uma tarefa recorrente**:
   - Vá em Nova Tarefa
   - Preencha a descrição
   - Em "Agendamento", selecione qualquer tipo exceto "Sem repetição"
   - Salve a tarefa

2. **Marcar como concluída**:
   - Encontre a tarefa na lista
   - Marque como concluída (checkbox ou botão)

3. **Verificar criação**:
   - Uma nova tarefa deve aparecer automaticamente
   - A nova tarefa terá a próxima data calculada
   - Status da nova tarefa: Pendente

4. **Verificar no console**:
   - Abra DevTools (F12)
   - Procure por: `✅ Recurring task recreated for...`

## 📊 Banco de Dados

Nenhuma alteração foi necessária no schema do Supabase. O sistema usa as colunas existentes:
- `recurrence_type`: tipo de recorrência
- `recurrence_day`: dia específico (semanal/mensal)
- `recurrence_days`: array de dias (personalizado)

## 🎉 Benefícios

- ✅ Automático - sem intervenção manual
- ✅ Universal - funciona para todos os tipos
- ✅ Flexível - suporta padrões complexos
- ✅ Confiável - preserva todos os dados importantes
- ✅ Escalável - não cria carga desnecessária no banco
