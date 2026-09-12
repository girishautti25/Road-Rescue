export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor: string
          actor_role: string
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string
          actor_role?: string
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string
          actor_role?: string
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      emergency_buttons: {
        Row: {
          battery: number
          created_at: string
          highway: string
          id: string
          km: number
          last_heartbeat_at: string
          last_triggered_at: string | null
          lat: number
          lng: number
          location_name: string
          presses: number
          station_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          battery?: number
          created_at?: string
          highway?: string
          id: string
          km: number
          last_heartbeat_at?: string
          last_triggered_at?: string | null
          lat: number
          lng: number
          location_name: string
          presses?: number
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          battery?: number
          created_at?: string
          highway?: string
          id?: string
          km?: number
          last_heartbeat_at?: string
          last_triggered_at?: string | null
          lat?: number
          lng?: number
          location_name?: string
          presses?: number
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_buttons_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_requests: {
        Row: {
          amount: number
          button_id: string | null
          completed_at: string | null
          created_at: string
          details: string | null
          distance_km: number
          driver_id: string | null
          driver_name: string
          eta_min: number
          id: string
          kit_unlocked: boolean
          km: number
          lat: number
          lng: number
          mechanic_id: string | null
          mechanic_progress: number
          paid: boolean
          pod_id: string | null
          pod_progress: number
          problem_type: string
          source: string
          station_id: string | null
          status: string
          updated_at: string
          vehicle_label: string
        }
        Insert: {
          amount?: number
          button_id?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          distance_km?: number
          driver_id?: string | null
          driver_name?: string
          eta_min?: number
          id: string
          kit_unlocked?: boolean
          km: number
          lat: number
          lng: number
          mechanic_id?: string | null
          mechanic_progress?: number
          paid?: boolean
          pod_id?: string | null
          pod_progress?: number
          problem_type: string
          source?: string
          station_id?: string | null
          status?: string
          updated_at?: string
          vehicle_label: string
        }
        Update: {
          amount?: number
          button_id?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          distance_km?: number
          driver_id?: string | null
          driver_name?: string
          eta_min?: number
          id?: string
          kit_unlocked?: boolean
          km?: number
          lat?: number
          lng?: number
          mechanic_id?: string | null
          mechanic_progress?: number
          paid?: boolean
          pod_id?: string | null
          pod_progress?: number
          problem_type?: string
          source?: string
          station_id?: string | null
          status?: string
          updated_at?: string
          vehicle_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_requests_button_id_fkey"
            columns: ["button_id"]
            isOneToOne: false
            referencedRelation: "emergency_buttons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_access: {
        Row: {
          closed_at: string | null
          created_at: string
          granted_at: string | null
          id: string
          pod_id: string | null
          request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          granted_at?: string | null
          id?: string
          pod_id?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          granted_at?: string | null
          id?: string
          pod_id?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_access_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_access_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          performed_at: string
          pod_id: string | null
          record_type: string
          station_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_at?: string
          pod_id?: string | null
          record_type?: string
          station_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_at?: string
          pod_id?: string | null
          record_type?: string
          station_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_assignments: {
        Row: {
          accepted_at: string | null
          arrived_at: string | null
          assigned_at: string
          completed_at: string | null
          created_at: string
          id: string
          mechanic_id: string | null
          request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          arrived_at?: string | null
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          mechanic_id?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          arrived_at?: string | null
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          mechanic_id?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_assignments_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          available: boolean
          created_at: string
          earnings: number
          id: string
          jobs: number
          km: number
          lat: number
          lng: number
          name: string
          phone: string
          rating: number
          skills: string[]
          updated_at: string
          vehicle_types: string[]
          workload: number
        }
        Insert: {
          available?: boolean
          created_at?: string
          earnings?: number
          id: string
          jobs?: number
          km: number
          lat: number
          lng: number
          name: string
          phone: string
          rating?: number
          skills?: string[]
          updated_at?: string
          vehicle_types?: string[]
          workload?: number
        }
        Update: {
          available?: boolean
          created_at?: string
          earnings?: number
          id?: string
          jobs?: number
          km?: number
          lat?: number
          lng?: number
          name?: string
          phone?: string
          rating?: number
          skills?: string[]
          updated_at?: string
          vehicle_types?: string[]
          workload?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          id: string
          read: boolean
          request_id: string | null
          title: string
        }
        Insert: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          request_id?: string | null
          title: string
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          request_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          provider: string
          reference: string | null
          request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          reference?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          reference?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pods: {
        Row: {
          battery: number
          created_at: string
          current_request_id: string | null
          destination_km: number | null
          health: number
          id: string
          kit_seal: string
          km: number
          last_maintenance_at: string | null
          obstacle_clear: boolean
          progress: number
          station_id: string
          status: string
          updated_at: string
        }
        Insert: {
          battery?: number
          created_at?: string
          current_request_id?: string | null
          destination_km?: number | null
          health?: number
          id: string
          kit_seal?: string
          km: number
          last_maintenance_at?: string | null
          obstacle_clear?: boolean
          progress?: number
          station_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          battery?: number
          created_at?: string
          current_request_id?: string | null
          destination_km?: number | null
          health?: number
          id?: string
          kit_seal?: string
          km?: number
          last_maintenance_at?: string | null
          obstacle_clear?: boolean
          progress?: number
          station_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pods_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stations: {
        Row: {
          created_at: string
          highway: string
          id: string
          km: number
          lat: number
          lng: number
          name: string
          rail_length_km: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          highway?: string
          id: string
          km: number
          lat: number
          lng: number
          name: string
          rail_length_km?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          highway?: string
          id?: string
          km?: number
          lat?: number
          lng?: number
          name?: string
          rail_length_km?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          label: string
          plate: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          label: string
          plate: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          label?: string
          plate?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_request_code: { Args: never; Returns: string }
    }
    Enums: {
      app_role:
        | "DRIVER"
        | "MECHANIC"
        | "STATION_OPERATOR"
        | "ADMIN"
        | "SUPER_ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "DRIVER",
        "MECHANIC",
        "STATION_OPERATOR",
        "ADMIN",
        "SUPER_ADMIN",
      ],
    },
  },
} as const
