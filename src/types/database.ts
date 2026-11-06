export type UnitStatus = 'Available' | 'Pending' | 'Sold';

export type FbListingStatus = 'Listed' | 'Unlisted';

export type BodyType = 'Pickup' | 'SUV' | 'Sedan' | 'Van' | 'Hatchback';

export type TransmissionType = 'Automatic' | 'Manual';

export type FuelType = 'Diesel' | 'Gasoline';

export interface UnitImage {
  id: string;
  unit_id: string;
  image_url: string;
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
  transmission: 'Automatic' | 'Manual';
  fuel: 'Diesel' | 'Gasoline';
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
  images?: UnitImage[];
}

export interface FinancingBreakdown {
  unitPrice: number;
  targetAllInDown: number;
  approvedLoan: number;
  processingFee: number;
  actualDownpayment: number;
  monthly24: number;
  monthly36: number;
  monthly48: number;
  isHighLtvWarning: boolean;
}

