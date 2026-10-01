ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS protocol text;

CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_protocol_key
  ON public.payment_transactions (protocol)
  WHERE protocol IS NOT NULL;

-- Cadastros sem cobrança (fluxo sem Pix) entram com amount = 0.
ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_amount_check;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_amount_check CHECK (amount >= 0);
