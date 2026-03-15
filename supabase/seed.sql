-- Seed data for local development
-- Provides: 2 published posts (different tags), 1 draft post, 1 approved comment
-- Run after: supabase db push

-- ──────────────────────────────────────────────────
-- Auth User (local dev only — requires auth.users to exist)
-- ──────────────────────────────────────────────────
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- ──────────────────────────────────────────────────
-- Profile
-- ──────────────────────────────────────────────────
insert into public.profiles (id, name, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'admin')
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────
-- Tags
-- ──────────────────────────────────────────────────
insert into public.tags (id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'Technology', 'technology'),
  ('10000000-0000-0000-0000-000000000002', 'Life',       'life'),
  ('10000000-0000-0000-0000-000000000003', 'Tutorial',   'tutorial')
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────
-- Posts: 2 published, 1 draft
-- ──────────────────────────────────────────────────
insert into public.posts (id, title, slug, body_markdown, status, author_id, published_at) values
  (
    '20000000-0000-0000-0000-000000000001',
    'Getting Started with Next.js 15',
    'getting-started-with-nextjs-15',
    E'# Getting Started with Next.js 15\n\nNext.js 15 brings many improvements including **React 19** support and the new Turbopack bundler.\n\n## Installation\n\n```bash\npnpm create next-app@latest\n```\n\nThis creates a full Next.js application with TypeScript, Tailwind CSS, and ESLint configured.\n\n## Key Features\n\n- App Router with Server Components\n- Built-in TypeScript support\n- Automatic image optimisation\n- Edge Runtime support',
    'published',
    '00000000-0000-0000-0000-000000000001',
    now() - interval '2 days'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Why I Love Remote Work',
    'why-i-love-remote-work',
    E'# Why I Love Remote Work\n\nRemote work has changed my life in many **positive** ways.\n\n## Flexibility\n\nBeing able to work from anywhere gives me the freedom to design my own schedule.\n\n## Productivity\n\nI find that I am more productive working from home, without the usual office distractions.\n\n## Work-Life Balance\n\nThe commute time saved goes straight back into personal projects and family time.',
    'published',
    '00000000-0000-0000-0000-000000000001',
    now() - interval '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'My Upcoming Tutorial Series',
    'my-upcoming-tutorial-series',
    E'# My Upcoming Tutorial Series\n\nI am working on a comprehensive tutorial series covering full-stack development with Next.js and Supabase.\n\nStay tuned for more updates!',
    'draft',
    '00000000-0000-0000-0000-000000000001',
    null
  )
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────
-- Post Tags (different tags per post)
-- ──────────────────────────────────────────────────
insert into public.post_tags (post_id, tag_id) values
  -- "Getting Started with Next.js 15" → Technology + Tutorial
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'),
  -- "Why I Love Remote Work" → Life
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
  -- draft → Tutorial
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003')
on conflict (post_id, tag_id) do nothing;

-- ──────────────────────────────────────────────────
-- Comments: 1 approved
-- ──────────────────────────────────────────────────
insert into public.comments (id, post_id, author_name, author_email, body, status) values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Jane Smith',
    'jane@example.com',
    'This is a really helpful article! I learned a lot about Next.js 15 from it. Looking forward to more posts like this.',
    'approved'
  )
on conflict (id) do nothing;
