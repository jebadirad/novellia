import { listProviders } from '@/server/providers';
import { ProviderDirectory } from '@/components/provider-management';
export const metadata = { title: 'Care providers' };
export default async function ProvidersPage() {
  return <ProviderDirectory providers={await listProviders({ q: '', status: 'all' })} />;
}
