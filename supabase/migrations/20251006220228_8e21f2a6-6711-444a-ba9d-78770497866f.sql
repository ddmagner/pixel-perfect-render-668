-- Add invoice_number column to app_settings table
ALTER TABLE app_settings 
ADD COLUMN invoice_number integer NOT NULL DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN app_settings.invoice_number IS 'Current invoice number counter that auto-increments with each invoice generation';