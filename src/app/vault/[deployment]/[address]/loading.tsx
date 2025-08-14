import { PageLayout } from "@/components/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function VaultLoading() {
  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Vault Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-10 w-20" />
        </div>

        {/* Tab Content Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </PageLayout>
  );
}
