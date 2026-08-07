-- Migration to add 'taller' to tipo_envio enum
ALTER TYPE public.tipo_envio ADD VALUE IF NOT EXISTS 'taller';
