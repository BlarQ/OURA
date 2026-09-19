export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MediaType = 'image' | 'video' | 'document' | 'audio' | 'none';

export type ActivityPriority = 'routine' | 'standard' | 'critical';

export interface Database {
  public: {
    Tables: {
      manuals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'manuals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      steps: {
        Row: {
          id: string;
          manual_id: string;
          step_order: number;
          title: string;
          description: string | null;
          media_url: string | null;
          media_type: MediaType | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          manual_id: string;
          step_order?: number;
          title: string;
          description?: string | null;
          media_url?: string | null;
          media_type?: MediaType | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          manual_id?: string;
          step_order?: number;
          title?: string;
          description?: string | null;
          media_url?: string | null;
          media_type?: MediaType | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'steps_manual_id_fkey';
            columns: ['manual_id'];
            isOneToOne: false;
            referencedRelation: 'manuals';
            referencedColumns: ['id'];
          }
        ];
      };
      weekly_activities: {
        Row: {
          id: string;
          user_id: string;
          manual_id: string | null;
          activity_date: string;
          title: string;
          description: string | null;
          time_slot: string | null;
          priority: ActivityPriority;
          is_completed: boolean;
          completion_notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          manual_id?: string | null;
          activity_date: string;
          title: string;
          description?: string | null;
          time_slot?: string | null;
          priority?: ActivityPriority;
          is_completed?: boolean;
          completion_notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          manual_id?: string | null;
          activity_date?: string;
          title?: string;
          description?: string | null;
          time_slot?: string | null;
          priority?: ActivityPriority;
          is_completed?: boolean;
          completion_notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'weekly_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'weekly_activities_manual_id_fkey';
            columns: ['manual_id'];
            isOneToOne: false;
            referencedRelation: 'manuals';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Manual = Database['public']['Tables']['manuals']['Row'];
export type ManualInsert = Database['public']['Tables']['manuals']['Insert'];
export type ManualUpdate = Database['public']['Tables']['manuals']['Update'];

export type Step = Database['public']['Tables']['steps']['Row'];
export type StepInsert = Database['public']['Tables']['steps']['Insert'];
export type StepUpdate = Database['public']['Tables']['steps']['Update'];

export type WeeklyActivity = Database['public']['Tables']['weekly_activities']['Row'] & {
  manual_title?: string | null;
};
export type WeeklyActivityInsert = Database['public']['Tables']['weekly_activities']['Insert'];
export type WeeklyActivityUpdate = Database['public']['Tables']['weekly_activities']['Update'];

