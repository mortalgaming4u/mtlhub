-- Create novels table
CREATE TABLE public.novels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_cn text,
  title_jp text,
  title_kr text,
  author text,
  description text,
  cover_url text,
  status text DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus', 'dropped')),
  rating decimal(3,2) DEFAULT 0.0,
  total_chapters integer DEFAULT 0,
  total_views integer DEFAULT 0,
  reader_count integer DEFAULT 0,
  review_count integer DEFAULT 0,
  original_url text,
  source_domain text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create genres table
CREATE TABLE public.genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create novel_genres junction table
CREATE TABLE public.novel_genres (
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE,
  genre_id uuid REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (novel_id, genre_id)
);

-- Create chapters table
CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  chapter_number integer NOT NULL,
  title text,
  content text,
  word_count integer DEFAULT 0,
  views integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(novel_id, chapter_number)
);

-- Create user roles enum and table
CREATE TYPE public.user_role AS ENUM ('user', 'moderator', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create requests table
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  ticket_cost integer DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create library folders table
CREATE TABLE public.library_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create library items table
CREATE TABLE public.library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  folder_id uuid REFERENCES public.library_folders(id) ON DELETE SET NULL,
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  scroll_position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, novel_id)
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  progress_percentage decimal(5,2) DEFAULT 0.0,
  read_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, novel_id, chapter_id)
);

-- Create contributions table
CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('translation_edit', 'metadata_edit', 'chapter_report', 'novel_suggestion')),
  content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  xp_reward integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('translation_error', 'inappropriate_content', 'copyright_violation', 'technical_issue', 'other')),
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add XP and level fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tickets integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_requests_used integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_request_reset timestamp with time zone DEFAULT now();

-- Enable RLS on all tables
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novel_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'moderator' THEN 2
    WHEN 'user' THEN 3
  END
  LIMIT 1
$$;

-- RLS Policies for novels (public read, admin write)
CREATE POLICY "Anyone can view novels" ON public.novels FOR SELECT USING (true);
CREATE POLICY "Admins can manage novels" ON public.novels FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'admin'));

-- RLS Policies for genres (public read, admin write)
CREATE POLICY "Anyone can view genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Admins can manage genres" ON public.genres FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'admin'));

-- RLS Policies for novel_genres (public read, admin write)
CREATE POLICY "Anyone can view novel genres" ON public.novel_genres FOR SELECT USING (true);
CREATE POLICY "Admins can manage novel genres" ON public.novel_genres FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'admin'));

-- RLS Policies for chapters (public read, admin write)
CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Admins can manage chapters" ON public.chapters FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'admin'));

-- RLS Policies for user_roles (users can view their own, admins can manage)
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT 
  USING (user_id = auth.uid()::uuid OR public.has_role(auth.uid()::uuid, 'admin'));
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'admin'));

-- RLS Policies for requests (users can manage their own, admins can view all)
CREATE POLICY "Users can view their own requests" ON public.requests FOR SELECT 
  USING (user_id = auth.uid()::uuid OR public.has_role(auth.uid()::uuid, 'admin'));
CREATE POLICY "Users can create their own requests" ON public.requests FOR INSERT 
  WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update their own requests" ON public.requests FOR UPDATE 
  USING (user_id = auth.uid()::uuid);
CREATE POLICY "Admins can manage all requests" ON public.requests FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'admin'));

-- RLS Policies for library folders (users own their folders)
CREATE POLICY "Users can manage their own library folders" ON public.library_folders FOR ALL 
  USING (user_id = auth.uid()::uuid);

-- RLS Policies for library items (users own their library items)
CREATE POLICY "Users can manage their own library items" ON public.library_items FOR ALL 
  USING (user_id = auth.uid()::uuid);

-- RLS Policies for bookmarks (users own their bookmarks)
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks FOR ALL 
  USING (user_id = auth.uid()::uuid);

-- RLS Policies for user progress (users own their progress)
CREATE POLICY "Users can manage their own progress" ON public.user_progress FOR ALL 
  USING (user_id = auth.uid()::uuid);

-- RLS Policies for contributions (users can view their own, moderators can manage)
CREATE POLICY "Users can view their own contributions" ON public.contributions FOR SELECT 
  USING (user_id = auth.uid()::uuid OR public.has_role(auth.uid()::uuid, 'moderator'));
CREATE POLICY "Users can create contributions" ON public.contributions FOR INSERT 
  WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Moderators can manage contributions" ON public.contributions FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'moderator'));

-- RLS Policies for reports (users can manage their own, moderators can view all)
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT 
  USING (user_id = auth.uid()::uuid OR public.has_role(auth.uid()::uuid, 'moderator'));
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT 
  WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE 
  USING (user_id = auth.uid()::uuid);
CREATE POLICY "Moderators can manage all reports" ON public.reports FOR ALL 
  USING (public.has_role(auth.uid()::uuid, 'moderator'));

-- Create triggers for updated_at
CREATE TRIGGER update_novels_updated_at BEFORE UPDATE ON public.novels 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON public.bookmarks 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default genres
INSERT INTO public.genres (name) VALUES 
  ('Action'), ('Adventure'), ('Comedy'), ('Drama'), ('Fantasy'), 
  ('Historical'), ('Horror'), ('Martial Arts'), ('Mystery'), ('Romance'),
  ('Sci-Fi'), ('Slice of Life'), ('Supernatural'), ('Thriller'), ('Tragedy'),
  ('Wuxia'), ('Xianxia'), ('Xuanhuan'), ('Urban'), ('School Life'),
  ('Psychological'), ('Josei'), ('Seinen'), ('Shoujo'), ('Shounen'),
  ('Ecchi'), ('Harem'), ('Reverse Harem'), ('Yaoi'), ('Yuri'),
  ('Isekai'), ('Reincarnation'), ('System'), ('Cultivation'), ('Magic'),
  ('Gaming'), ('Virtual Reality'), ('Apocalypse'), ('Zombies'), ('Mecha');

-- Create function to assign default user role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'user');
  RETURN NEW;
END;
$$;

-- Create trigger to assign default role when profile is created
CREATE TRIGGER assign_user_role_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- Create function to calculate XP rewards and level up
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_xp integer;
  new_level integer;
BEGIN
  -- Update XP
  UPDATE public.profiles 
  SET xp = xp + _xp_amount 
  WHERE user_id = _user_id
  RETURNING xp INTO new_xp;
  
  -- Calculate new level (100 XP per level, with increasing requirements)
  new_level := FLOOR(SQRT(new_xp / 100)) + 1;
  
  -- Update level if increased
  UPDATE public.profiles 
  SET level = new_level 
  WHERE user_id = _user_id AND level < new_level;
END;
$$;