
-- Create scoring_rules table
CREATE TABLE public.scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  weight integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create filter_rules table
CREATE TABLE public.filter_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_rules ENABLE ROW LEVEL SECURITY;

-- Public access policies for scoring_rules
CREATE POLICY "Anyone can view scoring rules" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scoring rules" ON public.scoring_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scoring rules" ON public.scoring_rules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete scoring rules" ON public.scoring_rules FOR DELETE USING (true);

-- Public access policies for filter_rules
CREATE POLICY "Anyone can view filter rules" ON public.filter_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can update filter rules" ON public.filter_rules FOR UPDATE USING (true);

-- Updated_at triggers
CREATE TRIGGER update_scoring_rules_updated_at BEFORE UPDATE ON public.scoring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_filter_rules_updated_at BEFORE UPDATE ON public.filter_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed scoring rules
INSERT INTO public.scoring_rules (name, weight, enabled, description, sort_order) VALUES
  ('Data Completeness', 30, true, 'Score based on profile completion', 1),
  ('Web Presence', 25, true, 'Active website and social media', 2),
  ('Recent Activity', 20, true, 'Recent filings and updates', 3),
  ('Officer Quality', 15, true, 'Number and quality of officers', 4),
  ('Financial Health', 10, false, 'Based on filed accounts', 5);

-- Seed filter rules
INSERT INTO public.filter_rules (name, label, description, enabled) VALUES
  ('excludeDissolved', 'Exclude Dissolved Companies', 'Automatically filter out dissolved entities', true),
  ('minScore', 'Minimum Score Threshold', 'Only show entities with score ≥ 50', true),
  ('negativePress', 'Negative Press Filter', 'Flag entities with negative media coverage', false);
