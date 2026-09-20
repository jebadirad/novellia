'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useToast } from '@astryxdesign/core/Toast';
import { Plus, Stethoscope } from 'lucide-react';
import { providerKinds, type ProviderDto } from '@/domain/providers';
import { PageHeading } from './display';
import { ProviderDialog } from './provider-dialog';
import { DeleteAction, mutate } from './actions';

export function ProviderDirectory({ providers }: { providers: ProviderDto[] }) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('active');
  const router = useRouter();
  const entries = providers.filter(
    (p) =>
      (status === 'archived' ? !!p.archivedAt : !p.archivedAt) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  function saved(provider: ProviderDto) {
    setAdding(false);
    router.push(`/providers/${provider.id}`);
    router.refresh();
  }
  return (
    <>
      <PageHeading
        title="Your care providers"
        eyebrow="PROVIDERS"
        subtitle="The vets and clinics who are part of your pets’ stories."
        action={
          <Button
            label="Add provider"
            icon={<Plus size={17} />}
            variant="primary"
            onClick={() => setAdding(true)}
          />
        }
      />
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <TextInput
          label="Search providers"
          placeholder="Search by name"
          value={query}
          onChange={setQuery}
          width="100%"
        />
        <Selector
          label="Provider status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>
      <p className="mb-4 text-sm text-secondary">
        {entries.length} {entries.length === 1 ? 'provider' : 'providers'}
      </p>
      {entries.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 desk:grid-cols-3">
          {entries.map((provider) => (
            <Link
              key={provider.id}
              href={`/providers/${provider.id}`}
              className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <Stethoscope size={23} className="mb-4 text-accent" />
              <h2 className="text-lg font-semibold">{provider.name}</h2>
              <p className="mt-1 text-sm text-secondary">
                {providerKinds[provider.kind]}
                {provider.archivedAt ? ' · Archived' : ''}
              </p>
              <p className="mt-3 text-sm">
                {provider.recordCount} linked {provider.recordCount === 1 ? 'record' : 'records'}
              </p>
              {provider.address && (
                <p className="mt-2 text-sm text-secondary">{provider.address}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold">
            {query
              ? 'No matching providers'
              : status === 'archived'
                ? 'No archived providers'
                : 'Add your first care provider'}
          </h2>
          <p className="mt-2 text-sm text-secondary">
            {query
              ? 'Try another name or clear your search.'
              : status === 'archived'
                ? 'Archived providers remain linked to existing records.'
                : 'Save a vet or clinic here, or add one while recording a visit.'}
          </p>
          {query && <Button label="Clear search" onClick={() => setQuery('')} />}
        </div>
      )}
      {adding && (
        <ProviderDialog
          providers={providers}
          onSaved={saved}
          onSelect={saved}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  );
}

export function ProviderActions({
  provider,
  providers,
}: {
  provider: ProviderDto;
  providers: ProviderDto[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();
  async function archive() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await mutate(`/api/providers/${provider.id}/archive`, 'PATCH', {
        archived: !provider.archivedAt,
      });
      toast({
        body: provider.archivedAt
          ? 'Provider restored.'
          : 'Provider archived. Medical records were kept.',
      });
      setConfirm(false);
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button label="Edit provider" onClick={() => setEditing(true)} />
        <Button
          label={provider.archivedAt ? 'Restore provider' : 'Archive provider'}
          onClick={() => setConfirm(true)}
        />
      </div>
      <p className="text-sm text-secondary">
        Archiving hides this provider from new selections. Existing records keep their link and
        provider name.
      </p>
      {provider.recordCount === 0 ? (
        <DeleteAction
          url={`/api/providers/${provider.id}`}
          title="Delete provider"
          description={`Permanently delete ${provider.name}? This provider has no linked records.`}
          redirect="/providers"
        />
      ) : (
        <p className="text-sm text-secondary">
          Permanent deletion is unavailable while medical records are linked.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-care-error-text">
          {error}
        </p>
      )}
      <AlertDialog
        isOpen={confirm}
        onOpenChange={(open) => {
          if (!pending) setConfirm(open);
        }}
        title={provider.archivedAt ? 'Restore provider?' : 'Archive provider?'}
        description={`${provider.archivedAt ? 'Make' : 'Hide'} ${provider.name} ${provider.archivedAt ? 'available for new records again.' : 'from new selections.'} All ${provider.recordCount} linked records will stay.${error ? ` ${error}` : ''}`}
        actionLabel={provider.archivedAt ? 'Restore provider' : 'Archive provider'}
        isActionLoading={pending}
        onAction={archive}
      />
      {editing && (
        <ProviderDialog
          provider={provider}
          providers={providers}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
