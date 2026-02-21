import { PageHeaderSkeleton, TerminalSkeleton, BentoGridSkeleton } from "./components/TenantSkeletons";

export default function TenantPortalLoading() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
            <PageHeaderSkeleton />
            <TerminalSkeleton />
            <BentoGridSkeleton />
        </div>
    );
}

