import { notFound } from 'next/navigation';
import { getStaple, staplesOf } from '@/src/lib/staples';
import StapleDetail, { buildStapleMetadata } from '@/src/components/StapleDetail';

const GROUP = 'omutsu';

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return staplesOf(GROUP).map((s) => ({ id: s.id }));
}

const find = (id) => {
  const s = getStaple(id);
  return s && s.group === GROUP ? s : null;
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  return buildStapleMetadata(find(id));
}

export default async function Page({ params }) {
  const { id } = await params;
  const staple = find(id);
  if (!staple) notFound();
  return <StapleDetail staple={staple} />;
}
