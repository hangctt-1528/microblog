interface PostBodyProps {
  /** Pre-sanitized HTML string from renderMarkdown() */
  html: string
}

/**
 * Renders pre-sanitized HTML from Markdown.
 * The html prop MUST already be sanitized with DOMPurify before being passed here.
 */
export function PostBody({ html }: PostBodyProps) {
  return (
    <div
      className="prose prose-slate max-w-none"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
