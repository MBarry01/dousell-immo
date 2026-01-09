import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dousell Immo - Plateforme de Gestion Immobilière",
  description: "Découvrez la puissance de Dousell Immo pour gérer votre patrimoine immobilier au Sénégal",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
