export type UnitStatus = 'Available' | 'Pending' | 'Sold';

export type FbListingStatus = 'Listed' | 'Unlisted';

export type BodyType = 'Pickup' | 'SUV' | 'Sedan' | 'Van' | 'Hatchback';

export type TransmissionType = 'Automatic' | 'Manual';

export type FuelType = 'Diesel' | 'Gasoline';

export interface UnitImage {
  id: string;
  unit_id: string;
  image_url: string;
  storage_path: string;
  display_order: number;
  created_at: string;
}

export interface VehicleUnit {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  variant: string;
  transmission: TransmissionType;
  fuel: FuelType;
  mileage: number;
  body_type: BodyType;
  plate_ending: string;
  cash_price: number;
  default_all_in_dp: number;
  status: UnitStatus;
  fb_status: FbListingStatus;
  boost_start: string | null;
  boost_end: string | null;
  last_relisted_at: string;
  description_notes: string | null;
  created_at: string;
  updated_at: string;
  images?: UnitImage[];
}

export type PublicVehicleUnit = Omit<
  VehicleUnit,
  'fb_status' | 'boost_start' | 'boost_end' | 'last_relisted_at'
>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      units: {
        Row: {
          id: string;
          slug: string;
          year: number;
          make: string;
          model: string;
          variant: string;
          transmission: TransmissionType;
          fuel: FuelType;
          mileage: number;
          body_type: BodyType;
          plate_ending: string;
          cash_price: number;
          default_all_in_dp: number;
          status: UnitStatus;
          fb_status: FbListingStatus;
          boost_start: string | null;
          boost_end: string | null;
          last_relisted_at: string;
          description_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          year: number;
          make: string;
          model: string;
          variant: string;
          transmission: TransmissionType;
          fuel: FuelType;
          mileage: number;
          body_type: BodyType;
          plate_ending: string;
          cash_price: number;
          default_all_in_dp: number;
          status?: UnitStatus;
          fb_status?: FbListingStatus;
          boost_start?: string | null;
          boost_end?: string | null;
          last_relisted_at?: string;
          description_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          year?: number;
          make?: string;
          model?: string;
          variant?: string;
          transmission?: TransmissionType;
          fuel?: FuelType;
          mileage?: number;
          body_type?: BodyType;
          plate_ending?: string;
          cash_price?: number;
          default_all_in_dp?: number;
          status?: UnitStatus;
          fb_status?: FbListingStatus;
          boost_start?: string | null;
          boost_end?: string | null;
          last_relisted_at?: string;
          description_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      unit_images: {
        Row: {
          id: string;
          unit_id: string;
          image_url: string;
          storage_path: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          image_url: string;
          storage_path: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          image_url?: string;
          storage_path?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'unit_images_unit_id_fkey';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'units';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      public_units: {
        Row: {
          id: string;
          slug: string;
          year: number;
          make: string;
          model: string;
          variant: string;
          transmission: TransmissionType;
          fuel: FuelType;
          mileage: number;
          body_type: BodyType;
          plate_ending: string;
          cash_price: number;
          default_all_in_dp: number;
          status: UnitStatus;
          description_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
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
