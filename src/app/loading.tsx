import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

export default function Loading() {
  return (
    <LoadingSpinner fullScreen message="Loading your inventory..." size={48} />
  );
}
