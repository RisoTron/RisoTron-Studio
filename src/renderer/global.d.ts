export {};

import type { WindowState } from '../main/utils/window-state';
import type { AppSettings } from '../shared/types/settings';
import type { Project } from '../shared/types/project';
import type { PipelineProgress } from '../shared/types/pipeline';
import type { AddCredentialArgs, Credential, CredentialError, CredentialListItem, DeleteCredentialResult, ListCredentialsResult, UpdateCredentialArgs, UpdateCredentialResult } from '../shared/types/credential';
import type { AddReleaseServerArgs, AddReleaseServerResult, ListReleaseServersResult } from '../shared/types/release-server';

declare global {
  interface AppInfo {
    version: string;
    state: WindowState;
  }

  interface Window {
    api: {
      getAppInfo: () => Promise<AppInfo>;
      ping: () => Promise<string>;
      onMenuNewProject: (callback: () => void) => () => void;
      onMenuPreferences: (callback: () => void) => () => void;
      settings: {
        getAll: () => Promise<AppSettings>;
        get: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>;
        set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
      };
      project: {
        list: (includeArchived?: boolean) => Promise<Project[]>;
        create: (payload: Record<string, unknown>) => Promise<{ success: boolean; data?: Project; error?: string }>;
        get: (id: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
        update: (id: string, payload: Record<string, unknown>) => Promise<{ success: boolean; data?: Project; error?: string }>;
        delete: (id: string) => Promise<{ success: boolean; data?: Project; error?: string }>;
        onScaffoldProgress: (callback: (progress: PipelineProgress) => void) => () => void;
      };
      os: {
        showItemInFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
        openInIDE: (path: string) => Promise<{ success: boolean; error?: string }>;
      };
      credential: {
        add: (args: AddCredentialArgs) => Promise<{ success: boolean; data?: Credential; error?: CredentialError }>;
        list: () => Promise<ListCredentialsResult>;
        update: (args: UpdateCredentialArgs) => Promise<UpdateCredentialResult>;
        delete: (args: { id: number }) => Promise<DeleteCredentialResult>;
      };
      releaseServer: {
        add: (args: AddReleaseServerArgs) => Promise<AddReleaseServerResult>;
        list: () => Promise<ListReleaseServersResult>;
      };
    };
  }
}

