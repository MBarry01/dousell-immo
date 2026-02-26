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

// FAQ Item interface for FAQPage schema
interface FAQItem {
    question: string;
    answer: string;
}

export function RealEstateJsonLd({
    type = 'RealEstateAgent',
    name = 'Dousel',
    description = "Plateforme immobilière de confiance au Sénégal. Trouvez villas, appartements et terrains à Dakar et sur la Petite Côte.",
    url = 'https://dousel.com',
    logo = 'https://dousel.com/icons/icon-512.png',
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
        name: 'Dousel',
        url: 'https://dousel.com',
        description: "Plateforme immobilière de confiance au Sénégal. Gestion locative et annonces immobilières.",
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://dousel.com/recherche?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'Dousel',
        description: "L'immobilier de confiance au Sénégal. Villas, terrains et appartements de luxe à Dakar et sur la Petite Côte.",
        url: 'https://dousel.com',
        logo: 'https://dousel.com/icons/icon-512.png',
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
        name: 'Dousel',
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

// FAQPage JSON-LD pour rich snippets Google
export function FAQPageJsonLd({ faqs }: { faqs: FAQItem[] }) {
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    return (
        <Script
            id="faq-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(faqSchema),
            }}
        />
    );
}

// BreadcrumbList JSON-LD pour navigation
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <Script
            id="breadcrumb-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(breadcrumbSchema),
            }}
        />
    );
}

// HowTo JSON-LD pour guides et tutoriels (rich snippets Google)
interface HowToStep {
    name: string;
    text: string;
    image?: string;
}

export function HowToJsonLd({
    name,
    description,
    steps,
    totalTime,
    image
}: {
    name: string;
    description: string;
    steps: HowToStep[];
    totalTime?: string; // Format ISO 8601: PT30M = 30 minutes
    image?: string;
}) {
    const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        description,
        ...(image && { image }),
        ...(totalTime && { totalTime }),
        step: steps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name,
            text: step.text,
            ...(step.image && { image: step.image }),
        })),
    };

    return (
        <Script
            id="howto-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(howToSchema),
            }}
        />
    );
}

// Review/Aggregated Rating JSON-LD pour les avis
export function AggregateRatingJsonLd({
    itemName,
    itemType = 'Organization',
    ratingValue,
    reviewCount,
    bestRating = 5,
    worstRating = 1
}: {
    itemName: string;
    itemType?: string;
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
}) {
    const ratingSchema = {
        '@context': 'https://schema.org',
        '@type': itemType,
        name: itemName,
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue,
            reviewCount,
            bestRating,
            worstRating,
        },
    };

    return (
        <Script
            id="aggregate-rating-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(ratingSchema),
            }}
        />
    );
}

// LocalBusiness JSON-LD pour SEO local Sénégal
export function LocalBusinessJsonLd() {
    const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': 'https://dousel.com/#organization',
        name: 'Dousel',
        alternateName: 'Douselbilier Sénégal',
        description: "Plateforme de gestion locative et annonces immobilières au Sénégal. Villas, appartements et terrains à Dakar, Saly, Thiès.",
        url: 'https://dousel.com',
        logo: {
            '@type': 'ImageObject',
            url: 'https://dousel.com/icons/icon-512.png',
            width: 512,
            height: 512,
        },
        image: 'https://dousel.com/og-landing.png',
        telephone: '+221338600000',
        email: 'contact@dousell.immo',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Sacré-Cœur 3, VDN',
            addressLocality: 'Dakar',
            addressRegion: 'Dakar',
            postalCode: '10000',
            addressCountry: 'SN',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 14.7167,
            longitude: -17.4677,
        },
        areaServed: [
            {
                '@type': 'City',
                name: 'Dakar',
                '@id': 'https://www.wikidata.org/wiki/Q3718',
            },
            {
                '@type': 'City',
                name: 'Saly',
            },
            {
                '@type': 'City',
                name: 'Thiès',
            },
            {
                '@type': 'City',
                name: 'Saint-Louis',
            },
            {
                '@type': 'Country',
                name: 'Sénégal',
            },
        ],
        priceRange: 'CFA 50 000 - CFA 500 000 000',
        currenciesAccepted: 'XOF',
        paymentAccepted: 'Mobile Money, Carte bancaire, Virement',
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '08:00',
                closes: '18:00',
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Saturday',
                opens: '09:00',
                closes: '13:00',
            },
        ],
        sameAs: [
            'https://www.facebook.com/dousellimmo',
            'https://www.instagram.com/dousellimmo',
            'https://twitter.com/dousell_immo',
            'https://www.linkedin.com/company/dousell-immo',
        ],
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Services Immobiliers',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Gestion Locative',
                        description: 'Gestion complète de vos biens: loyers, contrats, quittances automatiques',
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Location Immobilière',
                        description: 'Appartements, villas et studios à louer à Dakar et Saly',
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Vente Immobilière',
                        description: 'Terrains et propriétés à vendre au Sénégal',
                    },
                },
            ],
        },
    };

    return (
        <Script
            id="local-business-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(localBusinessSchema),
            }}
        />
    );
}
