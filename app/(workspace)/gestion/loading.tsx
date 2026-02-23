import dynamic from "next/dynamic";

const LoadingClient = dynamic(() => import("./LoadingClient"), {
    ssr: true,
});

export default function Loading() {
    return <LoadingClient />;
}
