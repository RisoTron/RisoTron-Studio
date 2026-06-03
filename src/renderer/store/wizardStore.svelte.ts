import type {
  ProjectWizardState,
  ProjectWizardStep,
  ProjectWizardStepValidity,
  TargetPlatform,
} from '../../shared/types/wizard';

export const defaultProjectWizardState: ProjectWizardState = {
  name: '',
  path: '',
  description: '',
  author: '',
  template: 'electron-vanilla',
  releaseProvider: 'none',
  github: {
    owner: '',
    repository: '',
    tokenEnvVar: 'GITHUB_TOKEN',
  },
  s3: {
    bucket: '',
    region: 'us-east-1',
    prefix: '',
  },
  targetPlatforms: ['macos'],
  codeSigning: {
    enabled: false,
    macCertificateName: '',
    windowsCertificatePath: '',
    certificatePasswordEnvVar: 'CSC_KEY_PASSWORD',
    notarizeMac: false,
  },
  initializeGit: true,
  installDependencies: true,
};

function createWizardState(): ProjectWizardState {
  return {
    ...defaultProjectWizardState,
    github: { ...defaultProjectWizardState.github },
    s3: { ...defaultProjectWizardState.s3 },
    targetPlatforms: [...defaultProjectWizardState.targetPlatforms],
    codeSigning: { ...defaultProjectWizardState.codeSigning },
  };
}

function createStepValidity(): ProjectWizardStepValidity {
  return {
    1: false,
    2: true,
    3: true,
    4: true,
    5: true,
  };
}

export const wizardStore = $state({
  currentStep: 1,
  stepValidity: createStepValidity(),
  project: createWizardState(),
  get isCurrentStepValid() {
    return this.stepValidity[this.currentStep as ProjectWizardStep] ?? false;
  },
  reset() {
    resetWizardStore();
  },
  submit() {
    return {
      ...this.project,
      github: { ...this.project.github },
      s3: { ...this.project.s3 },
      targetPlatforms: [...this.project.targetPlatforms],
      codeSigning: { ...this.project.codeSigning },
    };
  },
});


export function setStepValidity(step: ProjectWizardStep, isValid: boolean): void {
  wizardStore.stepValidity[step] = isValid;
}

export function toggleTargetPlatform(platform: TargetPlatform): void {
  const platforms = wizardStore.project.targetPlatforms;

  if (platforms.includes(platform)) {
    wizardStore.project.targetPlatforms = platforms.filter((item) => item !== platform);
    return;
  }

  wizardStore.project.targetPlatforms = [...platforms, platform];
}

export function resetWizardStore(): void {
  wizardStore.currentStep = 1;
  wizardStore.stepValidity = createStepValidity();
  wizardStore.project = createWizardState();
}
