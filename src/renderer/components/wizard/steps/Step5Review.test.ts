// eslint-disable-next-line import/no-unresolved
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Step5Review from './Step5Review.svelte';
import { wizardStore } from '../../../store/wizardStore.svelte';

function getRowValue(label: string): string {
  const row = screen.getByText(label).closest('div');
  expect(row).not.toBeNull();
  if (!row) throw new Error(`Row for label "${label}" not found`);

  const value = row.querySelector('dd');
  expect(value).not.toBeNull();
  if (!value) throw new Error(`dd element for label "${label}" not found`);

  return value.textContent ?? '';
}

describe('Step5Review', () => {
  beforeEach(() => {
    wizardStore.reset();
  });

  it('renders the full project configuration when all fields are filled', () => {
    wizardStore.project.name = 'Poster Lab';
    wizardStore.project.path = '/workspace/poster-lab';
    wizardStore.project.author = 'Studio Ops';
    wizardStore.project.description = 'A riso poster production workspace';
    wizardStore.project.template = 'electron-react';
    wizardStore.project.releaseProvider = 'github';
    wizardStore.project.github.owner = 'risotron';
    wizardStore.project.github.repository = 'poster-lab';
    wizardStore.project.github.tokenEnvVar = 'POSTER_LAB_GITHUB_TOKEN';
    wizardStore.project.targetPlatforms = ['macos', 'windows', 'linux'];
    wizardStore.project.codeSigning.enabled = true;
    wizardStore.project.codeSigning.notarizeMac = true;
    wizardStore.project.codeSigning.macCertificateName = 'Developer ID Application: Studio Ops';
    wizardStore.project.codeSigning.windowsCertificatePath = 'C:\\certs\\studio-ops.pfx';
    wizardStore.project.codeSigning.certificatePasswordEnvVar = 'CSC_KEY_PASSWORD';
    wizardStore.project.initializeGit = true;
    wizardStore.project.installDependencies = true;

    render(Step5Review);

    expect(screen.getByRole('heading', { name: 'Confirm project setup' })).toBeTruthy();
    expect(screen.getByText('Poster Lab')).toBeTruthy();
    expect(screen.getByText('/workspace/poster-lab')).toBeTruthy();
    expect(screen.getByText('Studio Ops')).toBeTruthy();
    expect(screen.getByText('A riso poster production workspace')).toBeTruthy();
    expect(screen.getByText('Electron + React')).toBeTruthy();
    expect(screen.getByText('GitHub Releases')).toBeTruthy();
    expect(getRowValue('Repository')).toBe('risotron/poster-lab');
    expect(getRowValue('Token')).toBe('POSTER_LAB_GITHUB_TOKEN');
    expect(getRowValue('Platforms')).toBe('macOS, Windows, Linux');
    expect(getRowValue('Code signing')).toBe('Enabled');
    expect(getRowValue('macOS notarization')).toBe('Enabled');
    expect(getRowValue('macOS certificate')).toBe('Developer ID Application: Studio Ops');
    expect(getRowValue('Windows certificate')).toBe('C:\\certs\\studio-ops.pfx');
    expect(getRowValue('Password env var')).toBe('CSC_KEY_PASSWORD');
    expect(getRowValue('Git')).toBe('Initialize repository');
    expect(getRowValue('Dependencies')).toBe('Install after creation');
  });

  it('derives labels for template, release provider, and selected platforms', () => {
    wizardStore.project.template = 'electron-svelte';
    wizardStore.project.releaseProvider = 'none';
    wizardStore.project.targetPlatforms = ['windows', 'linux'];

    render(Step5Review);

    expect(screen.getByText('Electron + Svelte')).toBeTruthy();
    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.getByText('Windows, Linux')).toBeTruthy();
  });

  it('renders GitHub release details and hides S3 fields for github provider', () => {
    wizardStore.project.releaseProvider = 'github';
    wizardStore.project.github.owner = 'risotron';
    wizardStore.project.github.repository = 'print-suite';
    wizardStore.project.github.tokenEnvVar = 'PRINT_SUITE_GITHUB_TOKEN';
    wizardStore.project.s3.bucket = 'print-suite-releases';
    wizardStore.project.s3.region = 'ap-southeast-1';
    wizardStore.project.s3.prefix = 'desktop';

    render(Step5Review);

    expect(screen.getByText('GitHub Releases')).toBeTruthy();
    expect(screen.getByText('Repository')).toBeTruthy();
    expect(screen.getByText('risotron/print-suite')).toBeTruthy();
    expect(screen.getByText('PRINT_SUITE_GITHUB_TOKEN')).toBeTruthy();
    expect(screen.queryByText('Bucket')).toBeNull();
    expect(screen.queryByText('print-suite-releases')).toBeNull();
    expect(screen.queryByText('Region')).toBeNull();
    expect(screen.queryByText('ap-southeast-1')).toBeNull();
    expect(screen.queryByText('Prefix')).toBeNull();
    expect(screen.queryByText('desktop')).toBeNull();
  });

  it('renders S3 release details and hides GitHub fields for s3 provider', () => {
    wizardStore.project.releaseProvider = 's3';
    wizardStore.project.github.owner = 'risotron';
    wizardStore.project.github.repository = 'print-suite';
    wizardStore.project.github.tokenEnvVar = 'PRINT_SUITE_GITHUB_TOKEN';
    wizardStore.project.s3.bucket = 'print-suite-releases';
    wizardStore.project.s3.region = 'ap-southeast-1';
    wizardStore.project.s3.prefix = 'desktop';

    render(Step5Review);

    expect(screen.getByText('Amazon S3')).toBeTruthy();
    expect(screen.getByText('Bucket')).toBeTruthy();
    expect(screen.getByText('print-suite-releases')).toBeTruthy();
    expect(screen.getByText('Region')).toBeTruthy();
    expect(screen.getByText('ap-southeast-1')).toBeTruthy();
    expect(screen.getByText('Prefix')).toBeTruthy();
    expect(screen.getByText('desktop')).toBeTruthy();
    expect(screen.queryByText('Repository')).toBeNull();
    expect(screen.queryByText('risotron/print-suite')).toBeNull();
    expect(screen.queryByText('Token')).toBeNull();
    expect(screen.queryByText('PRINT_SUITE_GITHUB_TOKEN')).toBeNull();
  });

  it('renders fallback values when the store is in default/reset state', () => {
    wizardStore.reset();
    wizardStore.project.name = '   ';
    wizardStore.project.path = '   ';
    wizardStore.project.author = '   ';
    wizardStore.project.description = '   ';
    wizardStore.project.targetPlatforms = [];
    (wizardStore.project as unknown as { template: string }).template = '   ';

    render(Step5Review);

    expect(getRowValue('Name')).toBe('Untitled project');
    expect(getRowValue('Path')).toBe('Not set');
    expect(getRowValue('Author')).toBe('Not set');
    expect(getRowValue('Description')).toBe('No description');
    expect(getRowValue('Selected template')).toBe('Unknown template');
    expect(getRowValue('Platforms')).toBe('No platforms selected');
  });

  it('hides code signing details when codeSigning.enabled is false', () => {
    wizardStore.project.codeSigning.enabled = false;
    wizardStore.project.codeSigning.notarizeMac = true;
    wizardStore.project.codeSigning.macCertificateName = 'My Cert';
    wizardStore.project.codeSigning.windowsCertificatePath = 'C:\\cert.pfx';
    wizardStore.project.codeSigning.certificatePasswordEnvVar = 'MY_PASS';

    render(Step5Review);

    expect(getRowValue('Code signing')).toBe('Disabled');
    expect(screen.queryByText('macOS notarization')).toBeNull();
    expect(screen.queryByText('macOS certificate')).toBeNull();
    expect(screen.queryByText('Windows certificate')).toBeNull();
    expect(screen.queryByText('Password env var')).toBeNull();
    expect(screen.queryByText('My Cert')).toBeNull();
    expect(screen.queryByText('C:\\cert.pfx')).toBeNull();
    expect(screen.queryByText('MY_PASS')).toBeNull();
  });

  it('hides provider-specific rows when releaseProvider is none', () => {
    wizardStore.project.releaseProvider = 'none';
    wizardStore.project.github.owner = 'should-not-show';
    wizardStore.project.github.repository = 'hidden-repo';
    wizardStore.project.github.tokenEnvVar = 'SECRET_TOKEN';
    wizardStore.project.s3.bucket = 'hidden-bucket';
    wizardStore.project.s3.region = 'eu-west-1';
    wizardStore.project.s3.prefix = 'hidden-prefix';

    render(Step5Review);

    expect(getRowValue('Provider')).toBe('None');
    expect(screen.queryByText('Repository')).toBeNull();
    expect(screen.queryByText('Token')).toBeNull();
    expect(screen.queryByText('Bucket')).toBeNull();
    expect(screen.queryByText('Region')).toBeNull();
    expect(screen.queryByText('Prefix')).toBeNull();
    expect(screen.queryByText('should-not-show/hidden-repo')).toBeNull();
    expect(screen.queryByText('SECRET_TOKEN')).toBeNull();
    expect(screen.queryByText('hidden-bucket')).toBeNull();
    expect(screen.queryByText('eu-west-1')).toBeNull();
    expect(screen.queryByText('hidden-prefix')).toBeNull();
  });
});
