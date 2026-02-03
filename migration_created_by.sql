-- Adicionar coluna created_by na tabela tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.employees(id);

-- Opcional: Atualizar tarefas existentes para serem 'criadas' pelo admin (assumindo que as antigas foram)
-- UPDATE public.tasks SET created_by = [UUID_DO_ADMIN] WHERE created_by IS NULL;

-- Política de RLS já deve permitir insert, mas bom verificar se precisa ajuste
-- (A política "Enable all access for all users" já cobre isso)
