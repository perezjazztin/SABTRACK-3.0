export type SupportedIdType =
  | 'PHILIPPINE_NATIONAL_ID'
  | 'DRIVERS_LICENSE'
  | 'PASSPORT'
  | 'UMID';

export interface ExtractedIdData {
  full_name: string;
  dob?: string | null;
  age?: number | null;
  address?: string | null;
  id_number_masked: string;
  id_type: SupportedIdType;
}

export interface ScanIdResponse {
  temp_verification_id: string;
  extracted_data: ExtractedIdData;
  message: string;
}

export interface VerifyFaceResponse {
  verification_token: string;
  match_score: number;
  status: 'VERIFIED' | 'REJECTED';
  message: string;
  details?: string;
}
