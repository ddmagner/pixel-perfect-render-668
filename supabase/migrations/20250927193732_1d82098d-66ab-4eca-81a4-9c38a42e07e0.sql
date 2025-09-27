-- Add missing attention column to clients table
ALTER TABLE public.clients 
ADD COLUMN attention TEXT;