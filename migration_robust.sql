-- PASSO 1: Adicionar a coluna (se não existir)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by uuid;

-- PASSO 2: Criar a chave estrangeira com NOME EXPLÍCITO
-- (Isso é crucial para que o frontend encontre a relação 'tasks_created_by_fkey')

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_created_by_fkey' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES public.employees(id);
    END IF;
END $$;
