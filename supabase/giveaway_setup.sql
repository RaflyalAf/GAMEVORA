-- Run in Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.giveaways (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    winner_count INTEGER DEFAULT 1,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active giveaways"
ON public.giveaways FOR SELECT
USING (true);

CREATE POLICY "Admins can insert giveaways"
ON public.giveaways FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update giveaways"
ON public.giveaways FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE TABLE IF NOT EXISTS public.giveaway_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(giveaway_id, user_id)
);

ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read entries"
ON public.giveaway_entries FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own entries"
ON public.giveaway_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.library ADD COLUMN IF NOT EXISTS is_giveaway BOOLEAN DEFAULT false;
