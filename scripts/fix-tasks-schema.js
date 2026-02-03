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

async function checkColumnExists() {
    console.log('\n🔍 Verificando se coluna "title" existe na tabela tasks...\n');

    // Tentar fazer SELECT incluindo a coluna title
    const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description')
        .limit(1);

    if (error) {
        if (error.message.includes('column') && error.message.includes('title')) {
            console.log('❌ Coluna "title" NÃO existe na tabela tasks');
            console.log('   Erro:', error.message);
            return false;
        }
        console.log('⚠️  Erro ao verificar tabela:', error.message);
        return null;
    }

    console.log('✅ Coluna "title" existe na tabela tasks');
    return true;
}

async function addTitleColumn() {
    console.log('\n🔧 Tentando adicionar coluna "title" à tabela tasks...\n');

    // Nota: A API do Supabase não permite executar DDL diretamente via REST API
    // Precisamos usar SQL Editor no dashboard ou service_role key

    console.log('📝 SQL necessário para executar no Supabase Dashboard (SQL Editor):');
    console.log('');
    console.log('```sql');
    console.log('-- Adicionar coluna title com valor padrão');
    console.log('ALTER TABLE tasks');
    console.log('ADD COLUMN IF NOT EXISTS title text DEFAULT \'Nova Tarefa\';');
    console.log('');
    console.log('-- Tornar NOT NULL após garantir valores');
    console.log('ALTER TABLE tasks');
    console.log('ALTER COLUMN title SET NOT NULL;');
    console.log('');
    console.log('-- Preencher titles com description onde estiverem vazios');
    console.log('UPDATE tasks');
    console.log('SET title = COALESCE(description, \'Tarefa sem descrição\')');
    console.log('WHERE title IS NULL OR title = \'\';');
    console.log('```');
    console.log('');
    console.log('⚠️  INSTRUÇÕES:');
    console.log('1. Acesse: https://mprvslcxtbtiaevvpepg.supabase.co/project/_/sql/new');
    console.log('2. Cole o SQL acima');
    console.log('3. Clique em "Run"');
    console.log('4. Execute este script novamente para verificar');
}

async function testInsert() {
    console.log('\n🧪 Testando inserção de task...\n');

    const testTask = {
        title: 'Teste de Criação',
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

    const columnExists = await checkColumnExists();

    if (columnExists === false) {
        await addTitleColumn();
        console.log('\n⚠️  Execute o SQL no Supabase Dashboard e rode este script novamente.');
        process.exit(1);
    } else if (columnExists === true) {
        console.log('\n✅ Estrutura da tabela parece estar correta.');

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
    } else {
        console.log('\n❌ Não foi possível determinar o estado da tabela.');
        console.log('   Verifique as permissões e a conexão com o Supabase.');
        process.exit(1);
    }
}

main().catch(console.error);
