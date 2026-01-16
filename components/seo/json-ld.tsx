"use client";

import Script from 'next/script';

interface RealEstateJsonLdProps {
    type?: 'RealEstateAgent' | 'RealEstateListing' | 'Organization';
    name?: string;
    description?: string;
    url?: string;
    logo?: string;
    address?: {
        streetAddress?: string;
        addressLocality: string;
        addressRegion?: string;
        addressCountry: string;
    };
    telephone?: string;
    priceRange?: string;
    // For listings
    property?: {
        name: string;
        description: string;
        image: string[];
        price: number;
        priceCurrency: string;
        address: {
            streetAddress?: string;
            addressLocality: string;
            addressRegion?: string;
            addressCountry: string;
        };
        numberOfRooms?: number;
        floorSize?: {
            value: number;
            unitCode: string;
        };
    };
}

export function RealEstateJsonLd({
    type = 'RealEstateAgent',
    name = 'Dousell Immo',
    description = "Plateforme immobilière de confiance au Sénégal. Trouvez villas, appartements et terrains à Dakar et sur la Petite Côte.",
    url = 'https://dousell-immo.app',
    logo = 'https://dousell-immo.app/icons/icon-512.png',
    address = {
        addressLocality: 'Dakar',
        addressCountry: 'SN',
    },
    telephone,
    priceRange = 'CFA 50 000 - CFA 500 000 000',
    property,
}: RealEstateJsonLdProps) {
    // Schema for organization/agent
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': type,
        name,
        description,
        url,
        logo,
        address: {
            '@type': 'PostalAddress',
            ...address,
        },
        ...(telephone && { telephone }),
        priceRange,
        areaServed: {
            '@type': 'Country',
            name: 'Sénégal',
        },
        sameAs: [
            'https://www.facebook.com/dousellimmo',
            'https://www.instagram.com/dousellimmo',
            'https://twitter.com/dousell_immo',
        ],
    };

    // Schema for property listing
    const propertySchema = property ? {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: property.name,
        description: property.description,
        image: property.image,
        offers: {
            '@type': 'Offer',
            price: property.price,
            priceCurrency: property.priceCurrency,
        },
        address: {
            '@type': 'PostalAddress',
            ...property.address,
        },
        ...(property.numberOfRooms && { numberOfRooms: property.numberOfRooms }),
        ...(property.floorSize && {
            floorSize: {
                '@type': 'QuantitativeValue',
                value: property.floorSize.value,
                unitCode: property.floorSize.unitCode,
            },
        }),
    } : null;

    return (
        <>
            <Script
                id="organization-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            {propertySchema && (
                <Script
                    id="property-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(propertySchema),
                    }}
                />
            )}
        </>
    );
}

// Composant simplifié pour la landing page
export function LandingPageJsonLd() {
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Dousell Immo',
        url: 'https://dousell-immo.app',
        description: "Plateforme immobilière de confiance au Sénégal. Gestion locative et annonces immobilières.",
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://dousell-immo.app/recherche?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'Dousell Immo',
        description: "L'immobilier de confiance au Sénégal. Villas, terrains et appartements de luxe à Dakar et sur la Petite Côte.",
        url: 'https://dousell-immo.app',
        logo: 'https://dousell-immo.app/icons/icon-512.png',
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Dakar',
            addressCountry: 'SN',
        },
        areaServed: {
            '@type': 'Country',
            name: 'Sénégal',
        },
        priceRange: 'CFA 50 000 - CFA 500 000 000',
        serviceType: [
            'Location immobilière',
            'Vente immobilière',
            'Gestion locative',
            'Estimation immobilière',
        ],
    };

    const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dousell Immo',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'XOF',
        },
        description: 'Application de gestion locative et annonces immobilières au Sénégal.',
        featureList: [
            'Gestion des baux et contrats',
            'Suivi des paiements de loyer',
            'Publication d\'annonces immobilières',
            'Estimation de biens',
        ],
    };

    return (
        <>
            <Script
                id="website-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema),
                }}
            />
            <Script
                id="organization-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            <Script
                id="software-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(softwareSchema),
                }}
            />
        </>
    );
}
