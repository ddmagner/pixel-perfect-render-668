-- Remove all clients except "Credit Gnomes"
DELETE FROM public.clients 
WHERE name != 'Credit Gnomes';