-- Apply manually in the Supabase SQL Editor.
ALTER TABLE public.socio
    ADD COLUMN IF NOT EXISTS referencia_direccion VARCHAR(250);
