export type CredentialType = 'github-pat' | 'aws' | 'generic-token';

export type CredentialErrorCode =
  | 'ENCRYPTION_UNAVAILABLE'
  | 'DUPLICATE_NAME'
  | 'VALIDATION_ERROR';

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
