-- Add city, state, and zip_code columns to clients table
ALTER TABLE public.clients 
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN zip_code text;