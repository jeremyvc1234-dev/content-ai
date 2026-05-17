-- Table pour sauvegarder l'historique des générations ContentAI
CREATE TABLE IF NOT EXISTS public.generations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secteur     TEXT        NOT NULL,
  ville       TEXT        NOT NULL,
  ton         TEXT        NOT NULL,
  langue      TEXT        NOT NULL,
  description TEXT,
  posts       JSONB       NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes par user
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS generations_created_at_idx ON public.generations(created_at DESC);

-- Activer RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Policies RLS : chaque user ne voit que ses propres générations
CREATE POLICY "generations_select_own"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "generations_insert_own"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generations_delete_own"
  ON public.generations FOR DELETE
  USING (auth.uid() = user_id);
