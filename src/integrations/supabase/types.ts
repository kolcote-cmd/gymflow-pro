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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: string
          detalle: string | null
          fecha_hora: string
          id: string
          tabla: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          detalle?: string | null
          fecha_hora?: string
          id?: string
          tabla?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          detalle?: string | null
          fecha_hora?: string
          id?: string
          tabla?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      caja_turnos: {
        Row: {
          apertura: string
          cierre: string | null
          id: string
          monto_cierre: number | null
          monto_inicial: number
          notas: string | null
          total_ventas: number | null
          usuario_id: string | null
        }
        Insert: {
          apertura?: string
          cierre?: string | null
          id?: string
          monto_cierre?: number | null
          monto_inicial?: number
          notas?: string | null
          total_ventas?: number | null
          usuario_id?: string | null
        }
        Update: {
          apertura?: string
          cierre?: string | null
          id?: string
          monto_cierre?: number | null
          monto_inicial?: number
          notas?: string | null
          total_ventas?: number | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      detalle_ventas_pos: {
        Row: {
          cantidad: number
          id: string
          precio_unitario: number
          producto_id: string | null
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          id?: string
          precio_unitario: number
          producto_id?: string | null
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          id?: string
          precio_unitario?: number
          producto_id?: string | null
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_ventas_pos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_ventas_pos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas_pos"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          brazo: number | null
          cadera: number | null
          cintura: number | null
          entrenador_id: string | null
          fecha: string
          grasa_pct: number | null
          id: string
          masa_muscular: number | null
          pecho: number | null
          peso: number | null
          pierna: number | null
          socio_id: string
        }
        Insert: {
          brazo?: number | null
          cadera?: number | null
          cintura?: number | null
          entrenador_id?: string | null
          fecha?: string
          grasa_pct?: number | null
          id?: string
          masa_muscular?: number | null
          pecho?: number | null
          peso?: number | null
          pierna?: number | null
          socio_id: string
        }
        Update: {
          brazo?: number | null
          cadera?: number | null
          cintura?: number | null
          entrenador_id?: string | null
          fecha?: string
          grasa_pct?: number | null
          id?: string
          masa_muscular?: number | null
          pecho?: number | null
          peso?: number | null
          pierna?: number | null
          socio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_config: {
        Row: {
          descripcion: string | null
          direccion: string | null
          email: string | null
          id: number
          nombre: string
          telefono: string | null
        }
        Insert: {
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          nombre?: string
          telefono?: string | null
        }
        Update: {
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      planes_membresia: {
        Row: {
          activo: boolean
          descripcion: string | null
          duracion_dias: number
          id: string
          nombre: string
          precio: number
        }
        Insert: {
          activo?: boolean
          descripcion?: string | null
          duracion_dias: number
          id?: string
          nombre: string
          precio: number
        }
        Update: {
          activo?: boolean
          descripcion?: string | null
          duracion_dias?: number
          id?: string
          nombre?: string
          precio?: number
        }
        Relationships: []
      }
      productos: {
        Row: {
          categoria: string
          codigo_barras: string | null
          descripcion: string | null
          id: string
          imagen: string | null
          nombre: string
          precio_venta: number
          stock_actual: number
          stock_minimo: number
        }
        Insert: {
          categoria: string
          codigo_barras?: string | null
          descripcion?: string | null
          id?: string
          imagen?: string | null
          nombre: string
          precio_venta: number
          stock_actual?: number
          stock_minimo?: number
        }
        Update: {
          categoria?: string
          codigo_barras?: string | null
          descripcion?: string | null
          id?: string
          imagen?: string | null
          nombre?: string
          precio_venta?: number
          stock_actual?: number
          stock_minimo?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      registros_acceso: {
        Row: {
          estado: string
          fecha_hora: string
          id: string
          motivo_denegado: string | null
          salida: string | null
          socio_id: string | null
        }
        Insert: {
          estado: string
          fecha_hora?: string
          id?: string
          motivo_denegado?: string | null
          salida?: string | null
          socio_id?: string | null
        }
        Update: {
          estado?: string
          fecha_hora?: string
          id?: string
          motivo_denegado?: string | null
          salida?: string | null
          socio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_acceso_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      rutinas: {
        Row: {
          created_at: string
          descanso_seg: number
          dia: string
          ejercicio: string
          entrenador_id: string | null
          grupo_muscular: string
          id: string
          repeticiones: string
          series: number
          socio_id: string
        }
        Insert: {
          created_at?: string
          descanso_seg?: number
          dia: string
          ejercicio: string
          entrenador_id?: string | null
          grupo_muscular: string
          id?: string
          repeticiones?: string
          series?: number
          socio_id: string
        }
        Update: {
          created_at?: string
          descanso_seg?: number
          dia?: string
          ejercicio?: string
          entrenador_id?: string | null
          grupo_muscular?: string
          id?: string
          repeticiones?: string
          series?: number
          socio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rutinas_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios: {
        Row: {
          activo: boolean
          alergias: string | null
          apellidos: string
          codigo_socio: string
          contacto_emergencia: string | null
          created_at: string
          dni: string | null
          email: string | null
          foto_url: string | null
          id: string
          nombres: string
          notas_medicas: string | null
          observaciones: string | null
          profile_id: string | null
          qr_code: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          alergias?: string | null
          apellidos: string
          codigo_socio?: string
          contacto_emergencia?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nombres: string
          notas_medicas?: string | null
          observaciones?: string | null
          profile_id?: string | null
          qr_code?: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          alergias?: string | null
          apellidos?: string
          codigo_socio?: string
          contacto_emergencia?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nombres?: string
          notas_medicas?: string | null
          observaciones?: string | null
          profile_id?: string | null
          qr_code?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          created_at: string
          descuento: number
          estado: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          metodo_pago: string | null
          plan_id: string
          socio_id: string
          total_pagado: number
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descuento?: number
          estado?: string
          fecha_fin: string
          fecha_inicio?: string
          id?: string
          metodo_pago?: string | null
          plan_id: string
          socio_id: string
          total_pagado?: number
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descuento?: number
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          metodo_pago?: string | null
          plan_id?: string
          socio_id?: string
          total_pagado?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_membresia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      ventas_pos: {
        Row: {
          fecha_hora: string
          id: string
          metodo_pago: string
          socio_id: string | null
          total: number
          usuario_id: string | null
        }
        Insert: {
          fecha_hora?: string
          id?: string
          metodo_pago?: string
          socio_id?: string | null
          total: number
          usuario_id?: string | null
        }
        Update: {
          fecha_hora?: string
          id?: string
          metodo_pago?: string
          socio_id?: string | null
          total?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_pos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      asignar_rol: {
        Args: { nuevo: Database["public"]["Enums"]["app_role"]; target: string }
        Returns: undefined
      }
      cerrar_caja: {
        Args: { contado: number; turno: string }
        Returns: undefined
      }
      cobrar_venta: {
        Args: { items: Json; metodo: string; recibido?: number; socio?: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_front: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      renovar_membresia: {
        Args: { metodo: string; plan: string; rebaja?: number; socio: string }
        Returns: {
          created_at: string
          descuento: number
          estado: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          metodo_pago: string | null
          plan_id: string
          socio_id: string
          total_pagado: number
          usuario_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "suscripciones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "ADMIN" | "RECEPCION" | "ENTRENADOR" | "SOCIO"
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
      app_role: ["ADMIN", "RECEPCION", "ENTRENADOR", "SOCIO"],
    },
  },
} as const
