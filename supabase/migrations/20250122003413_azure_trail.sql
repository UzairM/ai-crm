/*
  # Initial Helpdesk System Schema

  1. New Tables
    - users (extends auth.users)
      - role: enum for user roles (client, agent, manager)
      - full_name: user's full name
      - avatar_url: URL to user's avatar
    - tickets
      - subject, description, status, priority
      - category, assigned_to, created_by
      - SLA fields and metadata
    - ticket_comments
      - content, ticket reference, author
      - internal_note flag for agent-only notes
    - knowledge_base
      - title, content, category
      - status (draft, published)
      - author and approval fields
    - categories
      - name and description for ticket categorization
    - canned_responses
      - title and content for quick replies
    
  2. Security
    - RLS policies for each role
    - Secure access patterns
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'agent', 'manager');
CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE article_status AS ENUM ('draft', 'pending_review', 'published');

-- Create users table extending auth.users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  category_id UUID REFERENCES categories(id),
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  sla_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ticket comments
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  internal_note BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create knowledge base articles
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  status article_status DEFAULT 'draft',
  author_id UUID REFERENCES users(id),
  approver_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create canned responses
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Agents and managers can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('agent', 'manager')
    )
  );

-- Tickets policies
CREATE POLICY "Clients can view their own tickets"
  ON tickets FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Clients can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Agents can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'agent'
    )
  );

CREATE POLICY "Agents can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'agent'
    )
  );

CREATE POLICY "Managers can view all tickets"
  ON tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Comments policies
CREATE POLICY "Users can view comments on their tickets"
  ON ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('agent', 'manager')
        )
      )
    )
  );

CREATE POLICY "Agents and managers can create comments"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('agent', 'manager')
    )
  );

-- Knowledge base policies
CREATE POLICY "Anyone can view published articles"
  ON knowledge_base FOR SELECT
  USING (status = 'published');

CREATE POLICY "Agents can create and edit articles"
  ON knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('agent', 'manager')
    )
  );

-- Categories policies
CREATE POLICY "Categories are viewable by all"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Canned responses policies
CREATE POLICY "Agents and managers can manage canned responses"
  ON canned_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('agent', 'manager')
    )
  );