import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Login page: render without sidebar
  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
