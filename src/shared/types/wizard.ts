export type ProjectTemplateId =
  | 'electron-vanilla'   // Plain Electron Forge webpack (default, no UI framework)
  | 'electron-svelte'    // Electron Forge + Svelte renderer (future — US #119)
  | 'electron-react'     // Electron Forge + React renderer (future — US #120)
  | 'risotron';          // RisoTron framework (future — US #38, blocked)


export type ReleaseProvider = 'none' | 'github' | 's3';

export type TargetPlatform = 'macos' | 'windows' | 'linux';

export interface GitHubReleaseConfig {
  owner: string;
  repository: string;
  tokenEnvVar: string;
}

export interface S3ReleaseConfig {
  bucket: string;
  region: string;
  prefix: string;
}

export interface CodeSigningConfig {
  enabled: boolean;
  macCertificateName: string;
  windowsCertificatePath: string;
  certificatePasswordEnvVar: string;
  notarizeMac: boolean;
}

export interface ProjectWizardState {
  name: string;
  path: string;
  description: string;
  author: string;
  template: ProjectTemplateId;
  releaseProvider: ReleaseProvider;
  releaseServerId?: number;
  github: GitHubReleaseConfig;
  s3: S3ReleaseConfig;
  targetPlatforms: TargetPlatform[];
  codeSigning: CodeSigningConfig;
  initializeGit: boolean;
  installDependencies: boolean;
}

export type ProjectWizardStep = 1 | 2 | 3 | 4 | 5;

export type ProjectWizardStepValidity = Record<ProjectWizardStep, boolean>;
