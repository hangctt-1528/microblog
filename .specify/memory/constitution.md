# Microblog Constitution

## Core Principles

### I. Content-First
Every feature MUST serve the core content lifecycle: Author writes → Reader reads & engages.
No feature may be added outside that pipeline (create → draft → publish → read → comment).
The UI MUST remain minimal and focused on the written content — decoration never takes
priority over readability.

### II. Draft / Publish Lifecycle (NON-NEGOTIABLE)
A post MUST exist in exactly one of two states: `draft` or `published`.
Only `published` posts are visible on any public-facing page.
Authors freely save drafts and explicitly trigger publish when ready.
Deletion MUST use soft-delete (`deleted_at` timestamp); hard-deletes from the database
are strictly forbidden.

### III. Tag-Driven Navigation
Posts may carry one or more Tags. Tags are the sole classification unit — no hierarchical
categories exist. Each Tag MUST have a dedicated public timeline page listing its
`published` posts. Tags are created automatically when an author enters a name that does
not yet exist in the system.

### IV. Comment Moderation (NON-NEGOTIABLE)
Readers MAY submit comments without creating an account.
Every submitted comment MUST enter a `pending` queue — bypassing moderation is forbidden.
Only `approved` comments are rendered on public post pages.
Authors / Admins approve or reject comments exclusively through the CMS.

### V. Simplicity & YAGNI
Start with the simplest implementation that satisfies the stated requirement.
Do not build features without a clear, confirmed need.
Prefer readable, maintainable code over premature optimisation.
Each module MUST have a single, well-defined responsibility.

## Feature Constraints & Scope

### Public-Facing Pages

| Route | Description |
|---|---|
| `/` | Home — timeline of all `published` posts, newest first |
| `/posts/[slug]` | Post detail — rendered content, `approved` comments, comment submission form |
| `/tags/[slug]` | Tag timeline — `published` posts for that tag, newest first |

### CMS (Admin Interface)

- Requires authentication; unauthenticated requests MUST be redirected before any content renders.
- **Posts**: create, edit, save as draft, publish / unpublish, soft-delete.
- **Tags**: list, create, rename; delete only when no posts reference the tag.
- **Comments**: view `pending` queue, approve (`approved`) or reject (`rejected`) each comment.

### Data Model (Logical)

The following entities and relationships MUST be reflected in the chosen database:

- **User** — authenticated author/admin; `id`, `name`, `email`, `role` (`admin` | `author`)
- **Post** — `id`, `title`, `slug` (unique), `body` (Markdown), `status` (`draft` | `published`),
  `author_id`, `created_at`, `published_at`, `deleted_at`
- **Tag** — `id`, `name`, `slug` (unique), `created_at`
- **PostTag** — junction table linking Post ↔ Tag (many-to-many)
- **Comment** — `id`, `post_id`, `author_name`, `author_email`, `body`,
  `status` (`pending` | `approved` | `rejected`), `created_at`

Rules:
- Slugs MUST be unique and auto-generated from titles via a pure function (unit-tested);
  manual override is allowed in the CMS.
- All schema changes MUST be managed through migration files — direct database edits are forbidden.
- Every query against `posts` on public routes MUST filter `deleted_at IS NULL`
  and `status = 'published'`.

## Development Workflow

### Coding Standards

- Slug generation MUST be a pure, unit-tested function.
- Comment submission MUST be validated server-side: `author_name` non-empty,
  `author_email` valid format, `body` non-empty.
- Authentication checks MUST occur at the routing/middleware layer, not scattered inside
  individual page handlers.

### Quality Gates

- Every CMS route MUST be protected by an authentication guard — no exceptions.
- Public `posts` queries MUST always filter `deleted_at IS NULL` (CMS queries are exempt
  from the status filter only).
- New features require corresponding tests before merging.
- All pull requests MUST confirm constitutional compliance before merging.

## Governance

This Constitution is the supreme governing document for the Microblog project.
Every architectural decision, feature addition, or technology change MUST be reconciled
against the principles above. Amendments require a clear rationale, a version bump
following semantic versioning, and an updated `Last Amended` date.

**Version**: 1.0.0 | **Ratified**: 2026-03-15 | **Last Amended**: 2026-03-15
