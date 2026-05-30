export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          locale: string;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          locale?: string;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          locale?: string;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          status: Database["public"]["Enums"]["tenant_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          timezone?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_memberships: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          status: Database["public"]["Enums"]["member_status"];
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["member_status"];
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["member_status"];
          invited_by?: string | null;
          accepted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_admins: {
        Row: {
          user_id: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          granted_by?: string | null;
          created_at?: string;
        };
        Update: {
          granted_by?: string | null;
        };
        Relationships: [];
      };
      user_tenant_preferences: {
        Row: {
          user_id: string;
          active_tenant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          active_tenant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          active_tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_tenant_preferences_active_tenant_id_fkey";
            columns: ["active_tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_tenant_for_current_user: {
        Args: {
          tenant_name: string;
          tenant_slug?: string | null;
          tenant_timezone?: string | null;
        };
        Returns: string;
      };
      set_active_tenant: {
        Args: {
          selected_tenant_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role:
        | "super_admin"
        | "owner"
        | "service_advisor"
        | "mechanic"
        | "customer";
      member_status: "active" | "invited" | "disabled";
      tenant_status: "active" | "suspended" | "archived";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type AppRole = Database["public"]["Enums"]["app_role"];
export type TenantStatus = Database["public"]["Enums"]["tenant_status"];
export type MemberStatus = Database["public"]["Enums"]["member_status"];
