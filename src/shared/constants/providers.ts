export const PROVIDER_TYPES = {
  'github-releases': {
    label: 'GitHub Releases',
    icon: 'codicon-github',
    description: 'Publish builds via GitHub Releases API.',
    requiredCredential: 'github-pat' as const,
    configFields: [
      { key: 'owner', label: 'Owner', placeholder: 'organization' },
      { key: 'repo', label: 'Repository', placeholder: 'my-app' },
    ],
  },
  's3': {
    label: 'Amazon S3',
    icon: 'codicon-cloud-upload',
    description: 'Upload artifacts to an S3 bucket.',
    requiredCredential: 'aws' as const,
    configFields: [
      { key: 'bucket', label: 'Bucket', placeholder: 'release-artifacts' },
      { key: 'region', label: 'Region', placeholder: 'us-east-1' },
      { key: 'prefix', label: 'Prefix', placeholder: 'apps/my-app' },
    ],
  },
  'generic-url': {
    label: 'Custom URL',
    icon: 'codicon-globe',
    description: 'Point to a self-hosted update server.',
    requiredCredential: 'generic-token' as const,
    configFields: [
      { key: 'url', label: 'Server URL', placeholder: 'https://releases.example.com' },
    ],
  },
} as const;

export type ProviderTypeKey = keyof typeof PROVIDER_TYPES;
export const PROVIDER_TYPE_KEYS = Object.keys(PROVIDER_TYPES) as ProviderTypeKey[];
