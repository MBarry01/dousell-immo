import { Suspense } from "react";
import LandingPageContent from "./pro-client";

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}
