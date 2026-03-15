# Feature Specification: Microblog Web App

**Feature Branch**: `001-microblog-web-app`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Dynamic Web App Microblog — Authors write short posts (draft/publish), attach Tags, Readers read & comment (moderation). Home timeline, Tag pages. Markdown rendering."

> **Constitutional Compliance**: This spec strictly follows the [Microblog Constitution](../../.specify/memory/constitution.md).  
> All decisions align with its five core principles: Content-First, Draft/Publish Lifecycle,
> Tag-Driven Navigation, Comment Moderation, and Simplicity & YAGNI.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reader Browses the Home Timeline (Priority: P1)

A visitor opens the microblog and sees a reverse-chronological list of all published posts on
the home page. Each entry shows the post title, publication date, a short excerpt, and its
tags. The visitor can click any post to read it in full.

**Why this priority**: The home timeline is the entry point of the entire application.
Without it, no reader can access any content. It is the minimum viable public surface.

**Independent Test**: Deploy the app with at least two published posts seeded. Navigate to
`/` — both posts appear, newest first. Click one — the full post page loads. This can be
verified with zero CMS interaction.

**Acceptance Scenarios**:

1. **Given** the home page is loaded, **When** there are published posts in the system, **Then** all published posts are listed in descending `published_at` order.
2. **Given** the home page is loaded, **When** a post has one or more tags, **Then** those tag names are visible on the post card.
3. **Given** the home page is loaded, **When** there are no published posts, **Then** an empty-state message is shown (no errors, no blank page).
4. **Given** the home page is loaded, **When** a post has `status = draft`, **Then** it does NOT appear in the timeline.
5. **Given** the home page is loaded, **When** a post has a non-null `deleted_at`, **Then** it does NOT appear in the timeline.

---

### User Story 2 - Author Creates and Publishes a Post (Priority: P2)

An authenticated author logs into the CMS, writes a short post in Markdown, saves it as a
draft, previews the rendered output, then explicitly publishes it. The post immediately
appears on the public home timeline and is accessible at its unique slug URL.

**Why this priority**: Content creation is the core reason the app exists. The entire public
surface depends on this workflow functioning correctly.

**Independent Test**: Log into CMS as an author. Create a post with Markdown body, save as
draft — verify it does NOT appear on `/`. Publish it — verify it immediately appears on `/`
and is accessible at `/posts/[slug]` with correctly rendered HTML.

**Acceptance Scenarios**:

1. **Given** the author is on the new post form, **When** they fill in title and body and click "Save Draft", **Then** the post is created with `status = draft` and does not appear on public pages.
2. **Given** a draft post exists in the CMS, **When** the author clicks "Publish", **Then** `status` becomes `published`, `published_at` is set to the current timestamp, and the post appears on the home timeline.
3. **Given** a post title is entered, **When** the post is saved, **Then** a URL-safe slug is automatically generated from the title.
4. **Given** a slug is auto-generated, **When** the author overrides it manually in the CMS, **Then** the custom slug is used instead.
5. **Given** a published post exists at `/posts/[slug]`, **When** a reader visits that URL, **Then** the Markdown body is rendered as sanitized HTML.
6. **Given** an unauthenticated user tries to access the CMS, **When** they request any `/admin/*` route, **Then** they are redirected to the login page before any content renders.

---

### User Story 3 - Author Attaches Tags & Reader Browses a Tag Page (Priority: P3)

An author attaches one or more tags to a post. A reader navigating to `/tags/[slug]` sees a
timeline of all published posts associated with that tag, newest first.

**Why this priority**: Tags are the sole navigation and classification system. Without working
tag pages, readers have no way to explore content by topic.

**Independent Test**: Create two published posts — one tagged "tech", one tagged "life". Visit
`/tags/tech` — only the first post appears. Visit `/tags/life` — only the second. Visit
`/tags/nonexistent` — an empty-state or 404 is shown, no crash.

**Acceptance Scenarios**:

1. **Given** the author is editing a post, **When** they type a new tag name, **Then** the tag is created automatically if it does not already exist.
2. **Given** a published post has tags, **When** a reader visits `/tags/[slug]`, **Then** only `published` posts with that tag appear, ordered by `published_at DESC`.
3. **Given** a tag page is visited, **When** a matching post is in `draft` state, **Then** it does NOT appear on the tag page.
4. **Given** a tag page is visited, **When** a matching post has a non-null `deleted_at`, **Then** it does NOT appear on the tag page.
5. **Given** a tag does not exist, **When** a reader visits `/tags/[slug]`, **Then** a clear not-found message is shown (no 500 error).

---

### User Story 4 - Reader Submits a Comment (Priority: P4)

A reader on a post detail page fills in their name, email, and comment body, then submits
the form without logging in. The system confirms the submission and informs the reader the
comment is awaiting moderation. The comment does NOT appear publicly yet.

**Why this priority**: Reader engagement via comments is a stated requirement. The moderation
queue (P5) has no purpose without comments being submitted first.

**Independent Test**: Visit any published post at `/posts/[slug]`. Submit the comment form
with valid name, email, and body. Confirm the comment does NOT appear on the page yet. Open
the CMS comments queue — the comment appears with `status = pending`.

**Acceptance Scenarios**:

1. **Given** a reader is on a post page, **When** they submit the comment form with a valid name, email, and non-empty body, **Then** a comment record is created with `status = pending`.
2. **Given** a comment is submitted successfully, **When** the form is sent, **Then** the reader sees a confirmation message (e.g., "Your comment is awaiting moderation").
3. **Given** a reader submits the comment form, **When** any required field is empty or the email format is invalid, **Then** a validation error is shown and no comment is created.
4. **Given** a comment has `status = pending`, **When** the post page is loaded by any reader, **Then** the pending comment is NOT visible.
5. **Given** a reader submits a comment, **When** the form is displayed, **Then** no account or login is required.

---

### User Story 5 - Author/Admin Moderates Comments via CMS (Priority: P5)

An authenticated author or admin opens the CMS comment moderation view, sees a list of
pending comments, and approves or rejects each one. Approved comments immediately appear
on the corresponding post page; rejected comments stay hidden forever.

**Why this priority**: Without moderation, submitted comments (P4) could theoretically bypass
the queue. This closes the comment lifecycle and enforces the constitutional requirement.

**Independent Test**: Submit two comments on a post (P4 complete). In the CMS, approve the
first and reject the second. Visit `/posts/[slug]` — only the approved comment is visible.

**Acceptance Scenarios**:

1. **Given** the CMS comments section is open, **When** `pending` comments exist, **Then** they are listed with commenter name, email, body, and associated post title.
2. **Given** a pending comment is shown, **When** the moderator clicks "Approve", **Then** `status` becomes `approved` and the comment appears on the public post page.
3. **Given** a pending comment is shown, **When** the moderator clicks "Reject", **Then** `status` becomes `rejected` and the comment never appears publicly.
4. **Given** a moderator is not authenticated, **When** they attempt to access the CMS comments view, **Then** they are redirected to the login page.

---

### User Story 6 - Author Manages Existing Posts in CMS (Priority: P6)

An authenticated author can edit a published post, unpublish it (revert to draft), or
soft-delete it. Soft-deleted posts disappear from all public pages immediately but remain
in the database with `deleted_at` set.

**Why this priority**: Full post lifecycle management is required for a functional CMS.
Builds directly on P2.

**Independent Test**: Publish a post — verify it appears on `/`. Soft-delete it — verify it
is gone from `/`. Query the database — the row still exists with `deleted_at` set. Unpublish
a different post — it moves back to draft and disappears from public pages.

**Acceptance Scenarios**:

1. **Given** a published post exists, **When** the author edits and saves changes in the CMS, **Then** the updated content is reflected on the public post page.
2. **Given** a published post exists, **When** the author clicks "Unpublish", **Then** `status` reverts to `draft` and the post disappears from all public pages.
3. **Given** any post exists, **When** the author clicks "Delete", **Then** `deleted_at` is set to the current timestamp and the post disappears from all public pages immediately.
4. **Given** a post has `deleted_at` set, **When** any public query runs, **Then** the post is never returned.
5. **Given** a post is deleted, **When** the database is inspected, **Then** the post row still exists (soft-delete only; hard-delete is forbidden).

---

### User Story 7 - Author/Admin Manages Tags in CMS (Priority: P7)

An authenticated author or admin views all tags, creates new ones, renames existing ones,
and deletes tags that are no longer associated with any post.

**Why this priority**: Tag hygiene supports tag-driven navigation (P3). Lower priority
because tags are also auto-created during post editing.

**Independent Test**: In the CMS tags list, create a new tag manually. Rename an existing
tag. Try to delete a tag still in use — the system refuses. Delete an unused tag — it is
removed successfully.

**Acceptance Scenarios**:

1. **Given** the CMS tags list is open, **When** the author creates a new tag with a unique name, **Then** the tag is saved with an auto-generated slug.
2. **Given** a tag exists, **When** the author renames it, **Then** the tag's name and slug are updated.
3. **Given** a tag is associated with at least one post, **When** the author tries to delete it, **Then** the system refuses with an explanatory error message.
4. **Given** a tag has no associated posts, **When** the author deletes it, **Then** the tag is permanently removed from the system.

---

### Edge Cases

- **Duplicate slug on create**: When two posts would generate the same slug, the system MUST append a numeric suffix (e.g., `-2`) to ensure uniqueness.
- **Very long titles**: Slug generation MUST truncate titles to a safe URL length without breaking words mid-character.
- **Markdown with embedded HTML**: When a post body contains raw `<script>` or `<iframe>` tags, the render pipeline MUST strip unsafe HTML — no XSS output.
- **Comment on a soft-deleted post**: When a reader tries to submit a comment on a soft-deleted post, the system MUST return a not-found response; no comment is accepted.
- **Tag page with only draft posts**: When all posts for a tag are in `draft` state, the tag page MUST show an empty state, not an error.
- **Slug collision on tag rename**: When a tag is renamed and the new slug already belongs to another tag, the system MUST reject the rename with a validation error.
- **Empty Markdown body**: When an author publishes a post with an empty body, the system MUST allow it — some posts may be title-only.
- **Concurrent publish**: When two CMS sessions publish the same draft simultaneously, neither session MUST result in data corruption; `published_at` reflects the actual publish time.

---

## Requirements *(mandatory)*

### Functional Requirements

**Posts**

- **FR-001**: System MUST allow authenticated authors to create posts with a `title` and a `body` written in Markdown.
- **FR-002**: System MUST save new posts as `draft` by default.
- **FR-003**: System MUST allow authors to explicitly publish a draft post, setting `status = published` and recording `published_at`.
- **FR-004**: System MUST allow authors to unpublish a published post, reverting it to `draft`.
- **FR-005**: System MUST soft-delete posts by setting `deleted_at`; hard-deleting rows is strictly forbidden.
- **FR-006**: System MUST auto-generate a unique, URL-safe slug from the post title; authors MAY override it manually in the CMS.
- **FR-007**: System MUST render post body from Markdown to sanitized HTML before displaying it to readers.
- **FR-008**: All public-facing queries against posts MUST filter `deleted_at IS NULL` AND `status = 'published'`.

**Tags**

- **FR-009**: System MUST allow authors to attach one or more tags to a post.
- **FR-010**: System MUST auto-create a tag when an author inputs a tag name that does not already exist.
- **FR-011**: System MUST provide a public tag timeline page at `/tags/[slug]` listing `published` posts for that tag, ordered by `published_at DESC`.
- **FR-012**: System MUST prevent deletion of a tag that is still referenced by at least one post.

**Comments**

- **FR-013**: System MUST allow any visitor to submit a comment on a published post without requiring an account.
- **FR-014**: Comment submission MUST require a non-empty `author_name`, a valid-format `author_email`, and a non-empty `body`; validation MUST be enforced server-side.
- **FR-015**: Every submitted comment MUST be created with `status = pending`; bypassing the moderation queue is strictly forbidden.
- **FR-016**: System MUST display only `approved` comments on public post pages.
- **FR-017**: CMS MUST provide a moderation view where authenticated users can approve or reject `pending` comments.

**CMS & Authentication**

- **FR-018**: All CMS routes MUST require authentication; unauthenticated requests MUST be redirected before any CMS content renders.
- **FR-019**: CMS MUST provide post management: create, edit, save draft, publish, unpublish, soft-delete.
- **FR-020**: CMS MUST provide tag management: list, create, rename, delete (only when unused).
- **FR-021**: CMS MUST provide comment moderation: list pending comments, approve, reject.

**Public Pages & UI/UX**

- **FR-022**: Home page (`/`) MUST display all `published` non-deleted posts ordered by `published_at DESC`.
- **FR-023**: Post detail page (`/posts/[slug]`) MUST display rendered Markdown content, all `approved` comments, and a comment submission form.
- **FR-024**: Tag page (`/tags/[slug]`) MUST display `published` posts for that tag, ordered by `published_at DESC`.
- **FR-025**: All public pages MUST be responsive and usable on desktop, tablet, and mobile screen sizes.
- **FR-026**: Navigation MUST provide clear, intuitive pathways between the Home page, Post detail pages, and Tag pages.

### Key Entities

- **User**: An authenticated CMS operator. Attributes: `id`, `name`, `email`, `role` (`admin` | `author`). Linked to the authentication system.
- **Post**: The central content unit. Attributes: `id`, `title`, `slug` (unique), `body_markdown`, `status` (`draft` | `published`), `author_id`, `created_at`, `published_at`, `deleted_at`. Belongs to one User; has many Tags via PostTag.
- **Tag**: A content label. Attributes: `id`, `name`, `slug` (unique), `created_at`. Belongs to many Posts via PostTag.
- **PostTag**: Junction entity linking Post ↔ Tag (many-to-many). Attributes: `post_id`, `tag_id`.
- **Comment**: A reader response to a Post. Attributes: `id`, `post_id`, `author_name`, `author_email`, `body`, `status` (`pending` | `approved` | `rejected`), `created_at`. Belongs to one Post.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader can navigate from the home page to a full post and back within 3 clicks.
- **SC-002**: A published post appears on the home timeline within 1 page refresh after the author clicks "Publish" in the CMS.
- **SC-003**: A submitted comment never appears publicly before a moderator approves it — zero exceptions under any circumstances.
- **SC-004**: A soft-deleted post is absent from all public pages (home timeline, tag page, direct URL) immediately after deletion; a direct URL access returns a not-found response.
- **SC-005**: All public pages render correctly and are usable at viewport widths of 320 px (mobile), 768 px (tablet), and 1280 px (desktop).
- **SC-006**: Post body Markdown is rendered to HTML with no raw Markdown visible to the reader and no XSS vectors in the output.
- **SC-007**: The comment submission form displays a validation error for any of: empty name, invalid email format, empty body — without creating any comment record.
- **SC-008**: An unauthenticated request to any CMS route results in a redirect to the login page — CMS content is never rendered to an unauthenticated user.
