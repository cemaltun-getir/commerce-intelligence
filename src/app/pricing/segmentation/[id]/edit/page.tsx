import MainLayout from '@/components/layout/MainLayout';
import SegmentFormPage from '@/components/pages/SegmentFormPage';

interface EditSegmentProps {
  params: Promise<{ id: string }>;
}

export default async function EditSegment({ params }: EditSegmentProps) {
  const { id } = await params;
  return (
    <MainLayout>
      <SegmentFormPage segmentId={id} />
    </MainLayout>
  );
}
