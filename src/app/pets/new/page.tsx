import { Breadcrumbs, PageHeading } from '@/components/display';
import { PetForm } from '@/components/pet-form';
import { today } from '@/server/context';
export const metadata = { title: 'Add pet' };
export default function NewPet() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Pets', href: '/pets' }, { label: 'Add pet' }]} />
      <PageHeading
        title="A new companion"
        subtitle="Let’s make a little space for someone special."
      />
      <PetForm today={today()} />
    </>
  );
}
