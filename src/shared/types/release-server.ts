import type { ProviderTypeKey } from '../constants/providers';

export type ReleaseServerErrorCode =
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_NAME'
  | 'QUERY_ERROR'
  | 'CREDENTIAL_NOT_FOUND';

export interface ReleaseServerError {
  code: ReleaseServerErrorCode;
  field?: string;
  message: string;
}

export interface AddReleaseServerArgs {
  name: string;
  provider_type: ProviderTypeKey;
  credential_id: number;
  config: Record<string, string>;
}

export interface ReleaseServer {
  id: number;
  name: string;
  provider_type: ProviderTypeKey;
  credential_id: number;
  credential_name: string;
  config: Record<string, string>;
  created_at: string;
}

export type AddReleaseServerResult =
  | { success: true; data: ReleaseServer }
  | { success: false; error: ReleaseServerError };

export type ListReleaseServersResult =
  | { success: true; data: ReleaseServer[] }
  | { success: false; error: ReleaseServerError };
