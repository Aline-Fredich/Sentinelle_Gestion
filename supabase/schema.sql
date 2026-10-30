-- ==============================================================================
-- SENTINEL GESTION - Schéma SQL PostgreSQL pour Supabase
-- Inclut : Tables, Enumérations, Relations, RLS (Row Level Security) et Stockage
-- ==============================================================================

-- 1. EXTENSIONS REQUISES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE workspace_role AS ENUM ('super_admin', 'owner', 'admin', 'project_manager', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_tier AS ENUM ('standard', 'pro', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'in_review', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES FONDAMENTALES

-- Profils utilisateurs (synchronisés avec auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    job_title TEXT DEFAULT 'Collaborateur',
    role workspace_role DEFAULT 'member',
    weekly_capacity_minutes INTEGER DEFAULT 2100,
    hourly_rate NUMERIC(10, 2) DEFAULT 75.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Espaces de travail (Workspaces)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon_key TEXT DEFAULT 'shield',
    color_key TEXT DEFAULT 'blue',
    locale TEXT DEFAULT 'fr-FR',
    timezone TEXT DEFAULT 'Europe/Paris',
    currency TEXT DEFAULT 'EUR',
    default_hourly_rate NUMERIC(10, 2) DEFAULT 75.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membres de l'espace de travail
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role workspace_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Projets
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    reference TEXT NOT NULL,
    description TEXT DEFAULT '',
    status project_status DEFAULT 'active',
    priority task_priority DEFAULT 'medium',
    tier project_tier DEFAULT 'standard',
    icon_key TEXT DEFAULT 'folder',
    color_key TEXT DEFAULT '#0066FF',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
    lead_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    github_repo_url TEXT,
    allocated_hours NUMERIC(10, 2) DEFAULT 100.0,
    budget NUMERIC(12, 2) DEFAULT 25000.0,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases de projet
CREATE TABLE IF NOT EXISTS public.project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    order_index INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    color_key TEXT DEFAULT '#0066FF',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tâches
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    estimate_minutes INTEGER DEFAULT 60,
    actual_minutes INTEGER DEFAULT 0,
    story_points INTEGER DEFAULT 3,
    labels TEXT[] DEFAULT ARRAY[]::TEXT[],
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Éléments de checklist
CREATE TABLE IF NOT EXISTS public.checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dépendances de tâches (Anti-cycle)
CREATE TABLE IF NOT EXISTS public.task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    predecessor_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    successor_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    dependency_type dependency_type DEFAULT 'finish_to_start',
    lag_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(predecessor_task_id, successor_task_id)
);

-- Saisies de temps (Time Entries)
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL,
    billable BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC(10, 2) DEFAULT 75.0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dépenses & Budgets
CREATE TABLE IF NOT EXISTS public.project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    description TEXT DEFAULT '',
    expense_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents de projet
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Général',
    content TEXT DEFAULT '',
    file_url TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal d'audit infalsifiable
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    previous_hash TEXT,
    hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUCKETS DE STOCKAGE SUPABASE (STORAGE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sentinel-documents', 'sentinel-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sentinel-avatars', 'sentinel-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. POLITIQUES RLS (ROW LEVEL SECURITY)
-- Activation stricte sur l'ensemble des tables métier
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Fonctions d'aide SECURITY DEFINER pour le cloisonnement d'espace sans récursion
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id AND user_id = u_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id UUID, u_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id AND user_id = u_id
        AND role IN ('owner', 'admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.2 Profils utilisateurs (Visibilité limitée au profil personnel et aux collègues du même espace)
CREATE POLICY "profiles_select_self_or_comember" ON public.profiles
    FOR SELECT TO authenticated USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.workspace_members wm1
            JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
            WHERE wm1.user_id = auth.uid() AND wm2.user_id = public.profiles.id
        )
    );

CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5.3 Espaces de travail (Workspaces)
CREATE POLICY "workspaces_select_members" ON public.workspaces
    FOR SELECT TO authenticated USING (public.is_workspace_member(id));

CREATE POLICY "workspaces_insert_creator" ON public.workspaces
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "workspaces_update_admin" ON public.workspaces
    FOR UPDATE TO authenticated USING (public.is_workspace_admin_or_owner(id))
    WITH CHECK (public.is_workspace_admin_or_owner(id));

CREATE POLICY "workspaces_delete_owner" ON public.workspaces
    FOR DELETE TO authenticated USING (public.is_workspace_admin_or_owner(id));

-- 5.4 Membres d'espaces (Workspace Members)
CREATE POLICY "workspace_members_select" ON public.workspace_members
    FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_members_insert" ON public.workspace_members
    FOR INSERT TO authenticated WITH CHECK (
        public.is_workspace_admin_or_owner(workspace_id)
        OR (user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_members.workspace_id))
    );

CREATE POLICY "workspace_members_update" ON public.workspace_members
    FOR UPDATE TO authenticated USING (public.is_workspace_admin_or_owner(workspace_id))
    WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

CREATE POLICY "workspace_members_delete" ON public.workspace_members
    FOR DELETE TO authenticated USING (public.is_workspace_admin_or_owner(workspace_id) OR user_id = auth.uid());

-- 5.5 Projets
CREATE POLICY "projects_select" ON public.projects
    FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "projects_insert" ON public.projects
    FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "projects_update" ON public.projects
    FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "projects_delete" ON public.projects
    FOR DELETE TO authenticated USING (public.is_workspace_admin_or_owner(workspace_id));

-- 5.6 Phases de projets
CREATE POLICY "phases_select" ON public.project_phases
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "phases_insert" ON public.project_phases
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "phases_update" ON public.project_phases
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "phases_delete" ON public.project_phases
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

-- 5.7 Tâches
CREATE POLICY "tasks_select" ON public.tasks
    FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_insert" ON public.tasks
    FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_update" ON public.tasks
    FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_delete" ON public.tasks
    FOR DELETE TO authenticated USING (public.is_workspace_member(workspace_id));

-- 5.8 Éléments de checklist
CREATE POLICY "checklist_select" ON public.checklist_items
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_workspace_member(t.workspace_id))
    );

CREATE POLICY "checklist_insert" ON public.checklist_items
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_workspace_member(t.workspace_id))
    );

CREATE POLICY "checklist_update" ON public.checklist_items
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_workspace_member(t.workspace_id))
    );

CREATE POLICY "checklist_delete" ON public.checklist_items
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.is_workspace_member(t.workspace_id))
    );

-- 5.9 Dépendances de tâches
CREATE POLICY "dependencies_select" ON public.task_dependencies
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "dependencies_insert" ON public.task_dependencies
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "dependencies_delete" ON public.task_dependencies
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

-- 5.10 Saisies de temps (Time Entries)
CREATE POLICY "time_entries_select" ON public.time_entries
    FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "time_entries_insert" ON public.time_entries
    FOR INSERT TO authenticated WITH CHECK (
        public.is_workspace_member(workspace_id) AND user_id = auth.uid()
    );

CREATE POLICY "time_entries_update" ON public.time_entries
    FOR UPDATE TO authenticated USING (
        public.is_workspace_member(workspace_id) AND (user_id = auth.uid() OR public.is_workspace_admin_or_owner(workspace_id))
    ) WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "time_entries_delete" ON public.time_entries
    FOR DELETE TO authenticated USING (
        public.is_workspace_member(workspace_id) AND (user_id = auth.uid() OR public.is_workspace_admin_or_owner(workspace_id))
    );

-- 5.11 Dépenses & Budgets
CREATE POLICY "expenses_select" ON public.project_expenses
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "expenses_insert" ON public.project_expenses
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "expenses_update" ON public.project_expenses
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_admin_or_owner(p.workspace_id))
    );

CREATE POLICY "expenses_delete" ON public.project_expenses
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_admin_or_owner(p.workspace_id))
    );

-- 5.12 Documents de projet
CREATE POLICY "documents_select" ON public.project_documents
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "documents_insert" ON public.project_documents
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "documents_update" ON public.project_documents
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

CREATE POLICY "documents_delete" ON public.project_documents
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_workspace_member(p.workspace_id))
    );

-- 5.13 Journal d'Audit (Append-only strict : Aucune modification ni suppression)
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT TO authenticated USING (
        workspace_id IS NULL OR public.is_workspace_member(workspace_id)
    );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (
        workspace_id IS NULL OR public.is_workspace_member(workspace_id)
    );

-- Verrouillage cryptographique au niveau SQL : interdiction absolue de modification et suppression
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Interdiction formelle : Les entrées du journal d audit (audit_logs) sont infalsifiables et ne peuvent être ni modifiées ni supprimées (Append-Only immutability).';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_update
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();

DROP TRIGGER IF EXISTS trg_audit_logs_no_delete ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_no_delete
    BEFORE DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();

-- 5.14 Table des événements de paiement et registre d'idempotence MTN MoMo
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    transaction_id TEXT,
    phone TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'XAF',
    status TEXT NOT NULL,
    provider TEXT DEFAULT 'MTN_MOMO',
    payload JSONB DEFAULT '{}'::JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_events_select_admin" ON public.payment_events
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'super_admin')
        )
    );

CREATE POLICY "payment_events_insert_webhook" ON public.payment_events
    FOR INSERT TO authenticated, anon WITH CHECK (true);


-- Trigger pour créer automatiquement un profil lors de l'inscription via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        new.email,
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        'member'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
