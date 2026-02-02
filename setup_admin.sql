-- Script para criar registro do Administrador na tabela employees
-- Execute este script no Supabase SQL Editor

-- Inserir administrador
INSERT INTO public.employees (name, role, active)
VALUES ('Administrador', 'admin', true)
ON CONFLICT DO NOTHING
RETURNING id, name, role;

-- Nota: Copie o UUID (id) retornado e atualize a constante ADMIN_EMPLOYEE_ID
-- em src/contexts/AuthContext.tsx com este valor.
-- 
-- Se desejar adicionar uma foto ao administrador, você pode atualizar depois:
-- UPDATE public.employees SET photo = 'URL_OU_BASE64_DA_FOTO' WHERE role = 'admin';
