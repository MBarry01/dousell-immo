export default function EtatsLieuxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
            {children}
        </div>
    );
}
