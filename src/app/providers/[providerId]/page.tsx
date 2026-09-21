import { formatAddress } from '@/domain/contact';
import Link from 'next/link';
import { getProvider, listProviders } from '@/server/providers';
import { pageData, pageId } from '@/server/page-data';
import { providerKinds } from '@/domain/providers';
import { Breadcrumbs, PageHeading } from '@/components/display';
import { ProviderActions } from '@/components/provider-management';
export default async function ProviderPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const provider = await pageData(() => getProvider(pageId(providerId)));
  const providers = await listProviders({ q: '', status: 'all' });
  return (
    <>
      <Breadcrumbs items={[{ label: 'Providers', href: '/providers' }, { label: provider.name }]} />
      <PageHeading
        title={provider.name}
        subtitle={`${providerKinds[provider.kind]}${provider.archivedAt ? ' · Archived' : ''}`}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-5 text-lg font-semibold">Contact details</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-secondary">Phone</dt>
              <dd>{provider.phone || 'Not recorded'}</dd>
            </div>
            <div>
              <dt className="text-secondary">Address</dt>
              <dd className="whitespace-pre-wrap">{formatAddress(provider) || 'Not recorded'}</dd>
            </div>
            <div>
              <dt className="text-secondary">Timezone from address</dt>
              <dd>
                {provider.timeZone?.replaceAll('_', ' ') ||
                  'Address not resolved for appointment scheduling'}
              </dd>
            </div>
            <div>
              <dt className="text-secondary">Notes</dt>
              <dd className="whitespace-pre-wrap">{provider.notes || 'Not recorded'}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm">
            {provider.recordCount} linked medical{' '}
            {provider.recordCount === 1 ? 'record' : 'records'}
          </p>
          <p className="mt-2 text-sm">{provider.followUpCount} linked follow-ups</p>
          {provider.recordCount > 0 && (
            <Link
              className="mt-2 inline-block text-sm text-accent underline"
              href={`/records?providerId=${provider.id}`}
            >
              View linked records
            </Link>
          )}
        </section>
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-5 text-lg font-semibold">Manage provider</h2>
          <ProviderActions provider={provider} providers={providers} />
        </section>
      </div>
    </>
  );
}
