export type CredentialType = 'github-pat' | 'aws' | 'generic-token';

export type CredentialErrorCode =
  | 'ENCRYPTION_UNAVAILABLE'
  | 'DUPLICATE_NAME'
  | 'VALIDATION_ERROR'
  | 'QUERY_ERROR'
  | 'CREDENTIAL_IN_USE';

export type CredentialPayload =
  | { value: string }
  | { accessKeyId: string; secretAccessKey: string };

export interface AddCredentialArgs {
  name: string;
  type: CredentialType;
  payload: CredentialPayload;
}

export interface Credential {
  id: number;
  name: string;
  type: CredentialType;
  masked: string;
  created_at: string;
}

export type AddCredentialResult = Credential;

export interface CredentialError {
  code: CredentialErrorCode;
  field?: string;
  message: string;
}

export interface CredentialListItem {
  id: number;
  name: string;
  type: CredentialType;
  masked: string;
  created_at: string;
  linked_server_count: number; // always 0 for this US
}

export type ListCredentialsResult =
  | { success: true; data: CredentialListItem[] }
  | { success: false; error: CredentialError };

export interface UpdateCredentialArgs {
  id: number;
  name: string;
  type: CredentialType;
  payload: CredentialPayload;
}

export type UpdateCredentialResult =
  | { success: true; data: CredentialListItem }
  | { success: false; error: CredentialError };

export type DeleteCredentialResult =
  | { success: true }
  | { success: false; error: CredentialError };
