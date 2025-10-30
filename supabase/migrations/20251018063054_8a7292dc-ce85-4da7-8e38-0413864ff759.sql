-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text NOT NULL,
  institution_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Add user_id to existing tables
ALTER TABLE public.exams ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.classrooms ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.students ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.invigilators ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for exams
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.exams;
CREATE POLICY "Users can view their own exams"
  ON public.exams FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exams"
  ON public.exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exams"
  ON public.exams FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exams"
  ON public.exams FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for classrooms
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.classrooms;
CREATE POLICY "Users can view their own classrooms"
  ON public.classrooms FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own classrooms"
  ON public.classrooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own classrooms"
  ON public.classrooms FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own classrooms"
  ON public.classrooms FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for students
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.students;
CREATE POLICY "Users can view their own students"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own students"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own students"
  ON public.students FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own students"
  ON public.students FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for invigilators
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.invigilators;
CREATE POLICY "Users can view their own invigilators"
  ON public.invigilators FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invigilators"
  ON public.invigilators FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invigilators"
  ON public.invigilators FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invigilators"
  ON public.invigilators FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for seating_allocations (based on exam ownership)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.seating_allocations;
CREATE POLICY "Users can view their own seating allocations"
  ON public.seating_allocations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = seating_allocations.exam_id AND exams.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert their own seating allocations"
  ON public.seating_allocations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = seating_allocations.exam_id AND exams.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete their own seating allocations"
  ON public.seating_allocations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = seating_allocations.exam_id AND exams.user_id = auth.uid()
  ));

-- RLS policies for invigilator_assignments (based on exam ownership)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.invigilator_assignments;
CREATE POLICY "Users can view their own invigilator assignments"
  ON public.invigilator_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = invigilator_assignments.exam_id AND exams.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert their own invigilator assignments"
  ON public.invigilator_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = invigilator_assignments.exam_id AND exams.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete their own invigilator assignments"
  ON public.invigilator_assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.exams WHERE exams.id = invigilator_assignments.exam_id AND exams.user_id = auth.uid()
  ));

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, institution_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'institution_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating profiles timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();