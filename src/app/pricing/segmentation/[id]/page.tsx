import MainLayout from '@/components/layout/MainLayout';
import SegmentDetailPage from '@/components/pages/SegmentDetailPage';

interface SegmentDetailProps {
  params: Promise<{ id: string }>;
}

export default async function SegmentDetail({ params }: SegmentDetailProps) {
  const { id } = await params;
  return (
    <MainLayout>
      <SegmentDetailPage segmentId={id} />
    </MainLayout>
  );
} 