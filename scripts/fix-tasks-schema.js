#!/usr/bin/env node

// Script para diagnosticar e corrigir problemas com a tabela tasks
// Usa o cliente Supabase configurado para executar migrations

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
    console.log('\n🔍 Verificando estrutura da tabela tasks...\n');

    // Tentar fazer SELECT das colunas principais
    const { data, error } = await supabase
        .from('tasks')
        .select('id, description, status, type')
        .limit(1);

    if (error) {
        console.log('❌ Erro ao verificar tabela:', error.message);
        return false;
    }

    console.log('✅ Estrutura básica da tabela tasks está OK');
    return true;
}

async function checkRequiredColumns() {
    console.log('\n🔍 Verificando colunas necessárias...\n');

    const columnsToCheck = ['created_by', 'response', 'recurrence_days', 'is_shared'];
    const missingColumns = [];

    for (const column of columnsToCheck) {
        const { error } = await supabase
            .from('tasks')
            .select(column)
            .limit(1);

        if (error && error.message.includes('column')) {
            console.log(`❌ Coluna "${column}" NÃO existe`);
            missingColumns.push(column);
        } else {
            console.log(`✅ Coluna "${column}" existe`);
        }
    }

    if (missingColumns.length > 0) {
        console.log('\n📝 SQL para adicionar colunas faltantes (executar no Supabase Dashboard):');
        console.log('');
        console.log('```sql');
        if (missingColumns.includes('created_by')) {
            console.log('ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.employees(id);');
        }
        if (missingColumns.includes('response')) {
            console.log('ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS response text;');
        }
        if (missingColumns.includes('recurrence_days')) {
            console.log('ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_days integer[];');
        }
        if (missingColumns.includes('is_shared')) {
            console.log('ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;');
        }
        console.log('```');
        return false;
    }

    return true;
}

async function testInsert() {
    console.log('\n🧪 Testando inserção de task...\n');

    const testTask = {
        description: 'Task de teste para verificar se o sistema está funcionando',
        status: 'pending',
        type: 'one_off',
        recurrence_type: 'none'
    };

    const { data, error } = await supabase
        .from('tasks')
        .insert([testTask])
        .select()
        .single();

    if (error) {
        console.log('❌ Erro ao inserir task de teste:', error.message);
        return false;
    }

    console.log('✅ Task de teste criada com sucesso!');
    console.log('   ID:', data.id);

    // Limpar task de teste
    const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', data.id);

    if (deleteError) {
        console.log('⚠️  Não foi possível deletar task de teste (ID:', data.id, ')');
    } else {
        console.log('✅ Task de teste deletada');
    }

    return true;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   Script de Diagnóstico e Correção - Tabela Tasks');
    console.log('═══════════════════════════════════════════════════════════');

    const structureOk = await checkTableStructure();

    if (!structureOk) {
        console.log('\n❌ Não foi possível verificar a estrutura da tabela.');
        console.log('   Verifique as permissões e a conexão com o Supabase.');
        process.exit(1);
    }

    const columnsOk = await checkRequiredColumns();

    if (!columnsOk) {
        console.log('\n⚠️  Execute o SQL no Supabase Dashboard e rode este script novamente.');
        process.exit(1);
    }

    const insertWorks = await testInsert();

    if (insertWorks) {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('✅ Sistema de criação de tasks está FUNCIONANDO!');
        console.log('═══════════════════════════════════════════════════════════\n');
        process.exit(0);
    } else {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('❌ Sistema de criação de tasks NÃO está funcionando');
        console.log('   Pode ser um problema de RLS (Row Level Security)');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('📝 SQL para verificar/corrigir RLS policies:');
        console.log('');
        console.log('```sql');
        console.log('-- Ver políticas ativas');
        console.log('SELECT * FROM pg_policies WHERE tablename = \'tasks\';');
        console.log('');
        console.log('-- Garantir permissões (se necessário)');
        console.log('DROP POLICY IF EXISTS "Allow all access to tasks" ON tasks;');
        console.log('CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);');
        console.log('```');
        process.exit(1);
    }
}

main().catch(console.error);
