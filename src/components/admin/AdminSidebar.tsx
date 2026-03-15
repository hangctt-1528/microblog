'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/admin/posts', label: 'Posts' },
  { href: '/admin/tags', label: 'Tags' },
  { href: '/admin/comments', label: 'Comments' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-border bg-card">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-border">
        <Link href="/" className="text-base font-bold hover:opacity-80 transition-opacity">
          Microblog
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">CMS</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-border">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
