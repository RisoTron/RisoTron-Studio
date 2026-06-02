// eslint-disable-next-line import/no-unresolved
import { beforeEach, describe, expect, it } from 'vitest';
import { setStepValidity, toggleTargetPlatform, wizardStore } from './wizardStore.svelte';

describe('wizardStore', () => {
  beforeEach(() => {
    wizardStore.reset();
  });

  it('starts with the default wizard state', () => {
    expect(wizardStore.currentStep).toBe(1);
    expect(wizardStore.stepValidity).toEqual({
      1: false,
      2: true,
      3: true,
      4: true,
      5: true,
    });
    expect(wizardStore.isCurrentStepValid).toBe(false);
    expect(wizardStore.project).toEqual({
      name: '',
      path: '',
      description: '',
      author: '',
      template: 'blank',
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
    });
  });

  it('updates step validity and derives the current step validity', () => {
    setStepValidity(1, true);

    expect(wizardStore.stepValidity[1]).toBe(true);
    expect(wizardStore.isCurrentStepValid).toBe(true);

    wizardStore.currentStep = 3;
    expect(wizardStore.isCurrentStepValid).toBe(true);

    setStepValidity(3, false);
    expect(wizardStore.stepValidity[3]).toBe(false);
    expect(wizardStore.isCurrentStepValid).toBe(false);

    wizardStore.currentStep = 1;
    expect(wizardStore.isCurrentStepValid).toBe(true);
  });

  it('adds a target platform when it is not selected', () => {
    toggleTargetPlatform('windows');

    expect(wizardStore.project.targetPlatforms).toEqual(['macos', 'windows']);
  });

  it('removes a target platform when it is already selected', () => {
    wizardStore.project.targetPlatforms = ['macos', 'windows', 'linux'];

    toggleTargetPlatform('windows');

    expect(wizardStore.project.targetPlatforms).toEqual(['macos', 'linux']);
  });

  it('returns a project creation payload from the current state', () => {
    wizardStore.project.name = 'Poster Lab';
    wizardStore.project.path = '/tmp/poster-lab';
    wizardStore.project.description = 'Riso project workspace';
    wizardStore.project.author = 'Studio Ops';
    wizardStore.project.template = 'svelte-electron';
    wizardStore.project.releaseProvider = 'github';
    wizardStore.project.github.owner = 'risotron';
    wizardStore.project.github.repository = 'poster-lab';
    wizardStore.project.github.tokenEnvVar = 'POSTER_LAB_GITHUB_TOKEN';
    wizardStore.project.s3.bucket = 'poster-lab-releases';
    wizardStore.project.s3.region = 'ap-southeast-1';
    wizardStore.project.s3.prefix = 'desktop';
    wizardStore.project.targetPlatforms = ['macos', 'windows'];
    wizardStore.project.codeSigning.enabled = true;
    wizardStore.project.codeSigning.macCertificateName = 'Developer ID Application';
    wizardStore.project.codeSigning.windowsCertificatePath = '/certs/windows.pfx';
    wizardStore.project.codeSigning.certificatePasswordEnvVar = 'POSTER_LAB_CERT_PASSWORD';
    wizardStore.project.codeSigning.notarizeMac = true;
    wizardStore.project.initializeGit = false;
    wizardStore.project.installDependencies = false;

    const payload = wizardStore.submit();

    expect(payload).toEqual({
      name: 'Poster Lab',
      path: '/tmp/poster-lab',
      description: 'Riso project workspace',
      author: 'Studio Ops',
      template: 'svelte-electron',
      releaseProvider: 'github',
      github: {
        owner: 'risotron',
        repository: 'poster-lab',
        tokenEnvVar: 'POSTER_LAB_GITHUB_TOKEN',
      },
      s3: {
        bucket: 'poster-lab-releases',
        region: 'ap-southeast-1',
        prefix: 'desktop',
      },
      targetPlatforms: ['macos', 'windows'],
      codeSigning: {
        enabled: true,
        macCertificateName: 'Developer ID Application',
        windowsCertificatePath: '/certs/windows.pfx',
        certificatePasswordEnvVar: 'POSTER_LAB_CERT_PASSWORD',
        notarizeMac: true,
      },
      initializeGit: false,
      installDependencies: false,
    });
    expect(payload).not.toBe(wizardStore.project);
    expect(payload.github).not.toBe(wizardStore.project.github);
    expect(payload.s3).not.toBe(wizardStore.project.s3);
    expect(payload.targetPlatforms).not.toBe(wizardStore.project.targetPlatforms);
    expect(payload.codeSigning).not.toBe(wizardStore.project.codeSigning);
  });
});
