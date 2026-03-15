// Auto-generated types matching supabase/migrations/20260315000001_initial_schema.sql
// Regenerate with: supabase gen types typescript --local > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'author'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'admin' | 'author'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'author'
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          body_markdown: string
          status: 'draft' | 'published'
          author_id: string
          created_at: string
          published_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          body_markdown?: string
          status?: 'draft' | 'published'
          author_id: string
          created_at?: string
          published_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          body_markdown?: string
          status?: 'draft' | 'published'
          author_id?: string
          created_at?: string
          published_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_tags_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_name: string
          author_email: string
          body: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_name: string
          author_email: string
          body: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_name?: string
          author_email?: string
          body?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']

export type Tables<
  T extends keyof PublicSchema['Tables'],
> = PublicSchema['Tables'][T]['Row']

export type TablesInsert<
  T extends keyof PublicSchema['Tables'],
> = PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<
  T extends keyof PublicSchema['Tables'],
> = PublicSchema['Tables'][T]['Update']
