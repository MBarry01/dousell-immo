"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function PresentationPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("showcase");
    const [isScrolled, setIsScrolled] = useState(false);
    const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

    const observerRef = useRef<IntersectionObserver | null>(null);

    // Scroll effect for header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Intersection Observer for animations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setVisibleElements(prev => {
                        const newSet = new Set(prev);
                        newSet.add(entry.target.id);
                        return newSet;
                    });
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        observerRef.current = observer;

        const items = document.querySelectorAll('[data-animate]');
        items.forEach(item => observer.observe(item));

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const getAnimationClass = (id: string) => {
        return visibleElements.has(id) ? styles.visible : "";
    };

    return (
        <div className={styles.landingContainer}>
            {/* Header */}
            <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}>
                <div className={styles.container}>
                    <nav className={styles.navbar}>
                        <Link href="/" className={styles.logo}>
                            Immo<span>Pro</span>
                        </Link>

                        <div className={styles.navLinks}>
                            <a href="#features">Fonctionnalités</a>
                            <a href="#platform">Plateforme</a>
                            <a href="#pricing">Tarifs</a>
                            <a href="#contact">Contact</a>
                            <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>
                                Essai Gratuit
                            </Link>
                        </div>

                        <button
                            className={styles.mobileMenuBtn}
                            onClick={toggleMobileMenu}
                        >
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                            {/* Fallback to text if icons don't load or use SVG */}
                            <span style={{ fontSize: '1.5rem' }}>{mobileMenuOpen ? '✕' : '☰'}</span>
                        </button>
                    </nav>

                    {/* Mobile menu */}
                    <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuActive : ""}`}>
                        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
                        <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Plateforme</a>
                        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Tarifs</a>
                        <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                        <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setMobileMenuOpen(false)}>
                            Essai Gratuit
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className={styles.hero} id="hero">
                <div className={styles.container}>
                    <div className={styles.heroContent}>
                        <div className={styles.heroText}>
                            <h1>Révolutionnez la gestion immobilière</h1>
                            <p>Combine une vitrine de dépôt immobilière professionnelle avec un SaaS de gestion complet. Simplifiez vos opérations, augmentez votre visibilité et maximisez vos revenus.</p>
                            <div className={styles.heroBtns}>
                                <a href="#pricing" className={`${styles.btn} ${styles.btnPrimary}`}>Commencer maintenant</a>
                                <a href="#platform" className={`${styles.btn} ${styles.btnSecondary}`}>Voir la démo</a>
                            </div>
                        </div>

                        <div className={styles.heroVisual}>
                            <div className={`${styles.floatingElement} ${styles.dashboardPreview}`}>
                                {/* Dashboard preview */}
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', padding: '15px', background: 'white', borderBottom: '1px solid #eee' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#00b0ff', marginRight: '10px' }}></div>
                                        <div style={{ width: '60px', height: '20px', background: '#e0e0e0', borderRadius: '4px' }}></div>
                                        <div style={{ flex: 1 }}></div>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1a237e', marginLeft: '10px' }}></div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex' }}>
                                        <div style={{ width: '30%', background: '#f8f9fa', padding: '15px' }}>
                                            <div style={{ width: '100%', height: '15px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }}></div>
                                            <div style={{ width: '80%', height: '15px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }}></div>
                                            <div style={{ width: '90%', height: '15px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }}></div>
                                        </div>
                                        <div style={{ flex: 1, padding: '15px' }}>
                                            <div style={{ display: 'flex', marginBottom: '20px' }}>
                                                <div style={{ flex: 1, height: '100px', background: 'white', borderRadius: '8px', marginRight: '10px', borderLeft: '4px solid #1a237e' }}></div>
                                                <div style={{ flex: 1, height: '100px', background: 'white', borderRadius: '8px', marginRight: '10px', borderLeft: '4px solid #00b0ff' }}></div>
                                                <div style={{ flex: 1, height: '100px', background: 'white', borderRadius: '8px', borderLeft: '4px solid #ff4081' }}></div>
                                            </div>
                                            <div style={{ width: '100%', height: '200px', background: 'white', borderRadius: '8px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles.floatingElement} ${styles.propertyCard}`}>
                                {/* Property card preview */}
                                <div style={{ width: '100%', height: '100%', background: 'white' }}>
                                    <div style={{ height: '60%', background: 'linear-gradient(135deg, #6a11cb, #2575fc)' }}></div>
                                    <div style={{ padding: '15px' }}>
                                        <div style={{ width: '80%', height: '15px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '10px' }}></div>
                                        <div style={{ width: '60%', height: '12px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ width: '30%', height: '25px', background: '#1a237e', borderRadius: '4px' }}></div>
                                            <div style={{ width: '30%', height: '25px', background: '#00b0ff', borderRadius: '4px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles.floatingElement} ${styles.statsCard}`}>
                                <h4>+85%</h4>
                                <p>Efficacité accrue</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features} id="features">
                <div className={styles.container}>
                    <div className={styles.sectionTitle}>
                        <h2>Fonctionnalités <span>puissantes</span></h2>
                        <p>Découvrez comment ImmoPro transforme votre activité immobilière</p>
                    </div>

                    <div className={styles.featuresGrid}>
                        {[
                            { icon: 'fa-home', title: "Vitrine Professionnelle", desc: "Présentez vos biens avec des galeries photos haute qualité, visites virtuelles et descriptions optimisées pour le référencement." },
                            { icon: 'fa-chart-line', title: "Analytique Avancée", desc: "Suivez les performances de vos annonces, analysez le comportement des visiteurs et optimisez vos stratégies de vente." },
                            { icon: 'fa-tasks', title: "Gestion Simplifiée", desc: "Centralisez la gestion des contrats, paiements, maintenance et communication avec les locataires/propriétaires." },
                            { icon: 'fa-mobile-alt', title: "Application Mobile", desc: "Gérez votre activité depuis n'importe où avec notre application iOS et Android dédiée." },
                            { icon: 'fa-file-contract', title: "Contrats Automatisés", desc: "Générez et signez électroniquement des contrats professionnels en quelques clics." },
                            { icon: 'fa-shield-alt', title: "Sécurité Maximale", desc: "Vos données sont protégées par un chiffrement de niveau bancaire et des sauvegardes automatiques." },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className={`${styles.featureCard} ${styles.animateOnScroll} ${getAnimationClass('feat-' + idx)}`}
                                id={'feat-' + idx}
                                data-animate="true"
                            >
                                <div className={styles.featureIcon}>
                                    {/* Using simplified circle for icon placeholder if font awesome not loaded */}
                                    <i className={`fas ${feature.icon}`}></i>
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Showcase */}
            <section className={styles.platformShowcase} id="platform">
                <div className={styles.container}>
                    <div className={styles.sectionTitle}>
                        <h2>Une <span>plateforme double</span></h2>
                        <p>Découvrez nos deux piliers complémentaires</p>
                    </div>

                    <div className={styles.platformTabs}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'showcase' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('showcase')}
                        >
                            Vitrine Immobilière
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'saas' ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab('saas')}
                        >
                            SaaS de Gestion
                        </button>
                    </div>

                    <div className={`${styles.tabContent} ${activeTab === 'showcase' ? styles.tabContentActive : ''}`}>
                        <div className={styles.showcaseContent}>
                            <div className={`${styles.showcaseText} ${styles.animateOnScroll} ${getAnimationClass('showcase-text')}`} id="showcase-text" data-animate="true">
                                <h3>Présentez vos biens sous leur meilleur jour</h3>
                                <p>Notre vitrine immobilière est conçue pour mettre en valeur vos propriétés avec des présentations modernes et engageantes. Augmentez votre taux de conversion avec des galeries interactives, des visites virtuelles à 360° et des fiches techniques détaillées.</p>
                                <ul className="list-none pl-0">
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Design responsive et moderne</li>
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Référencement SEO optimisé</li>
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Intégration aux portails immobiliers</li>
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Système de rendez-vous en ligne</li>
                                </ul>
                            </div>
                            <div className={`${styles.showcaseVisual} ${styles.animateOnScroll} ${getAnimationClass('showcase-vis')}`} id="showcase-vis" data-animate="true">
                                {/* Vitrine preview */}
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f5f7ff, #e3e9ff)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ height: '50px', background: 'white', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #eee' }}>
                                        <div style={{ width: '100px', height: '20px', background: '#1a237e', borderRadius: '4px' }}></div>
                                        <div style={{ flex: 1 }}></div>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e0e0e0', marginLeft: '10px' }}></div>
                                    </div>
                                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ width: '100%', height: '180px', background: 'linear-gradient(135deg, #6a11cb, #2575fc)', borderRadius: '8px', marginBottom: '20px' }}></div>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                            <div style={{ flex: 1, height: '80px', background: 'white', borderRadius: '8px' }}></div>
                                            <div style={{ flex: 1, height: '80px', background: 'white', borderRadius: '8px' }}></div>
                                            <div style={{ flex: 1, height: '80px', background: 'white', borderRadius: '8px' }}></div>
                                        </div>
                                        <div style={{ width: '100%', height: '100px', background: 'white', borderRadius: '8px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.tabContent} ${activeTab === 'saas' ? styles.tabContentActive : ''}`}>
                        <div className={`${styles.showcaseContent} ${styles.showcaseContentReverse}`}>
                            <div className={styles.showcaseText}>
                                <h3>Gérez efficacement votre portefeuille</h3>
                                <p>Notre SaaS de gestion offre tous les outils nécessaires pour administrer votre activité immobilière. Suivez les paiements, planifiez les maintenances, gérez les documents et communiquez avec toutes les parties prenantes depuis une interface unique.</p>
                                <ul className="list-none pl-0">
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Tableau de bord personnalisable</li>
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Gestion financière intégrée</li>
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Calendrier de maintenance</li>
                                    <li className="mb-2 flex items-center"><span style={{ color: '#00b0ff', marginRight: '10px' }}>✓</span> Rapports automatisés</li>
                                </ul>
                            </div>
                            <div className={styles.showcaseVisual}>
                                {/* SaaS preview */}
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', display: 'flex' }}>
                                    <div style={{ width: '30%', background: 'white', padding: '15px' }}>
                                        <div style={{ width: '100%', height: '30px', background: '#1a237e', borderRadius: '4px', marginBottom: '20px' }}></div>
                                        <div style={{ width: '80%', height: '15px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }}></div>
                                        <div style={{ width: '90%', height: '15px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }}></div>
                                        <div style={{ width: '70%', height: '15px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }}></div>
                                    </div>
                                    <div style={{ flex: 1, padding: '15px' }}>
                                        <div style={{ width: '100%', height: '40px', background: 'white', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                                            <div style={{ width: '150px', height: '20px', background: '#e0e0e0', borderRadius: '4px' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                            <div style={{ flex: 1, height: '100px', background: 'white', borderRadius: '8px', borderTop: '4px solid #1a237e' }}></div>
                                            <div style={{ flex: 1, height: '100px', background: 'white', borderRadius: '8px', borderTop: '4px solid #00b0ff' }}></div>
                                        </div>
                                        <div style={{ width: '100%', height: '200px', background: 'white', borderRadius: '8px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className={styles.pricing} id="pricing">
                <div className={styles.container}>
                    <div className={styles.sectionTitle}>
                        <h2>Des tarifs <span>adaptés</span></h2>
                        <p>Choisissez l'offre qui correspond à vos besoins</p>
                    </div>

                    <div className={styles.pricingCards}>
                        <div className={`${styles.pricingCard} ${styles.animateOnScroll} ${getAnimationClass('price-1')}`} id="price-1" data-animate="true">
                            <div className={styles.pricingHeader}>
                                <h3>Starter</h3>
                                <div className={styles.price}>49€<span>/mois</span></div>
                                <p>Parfait pour les indépendants</p>
                            </div>
                            <ul className={styles.pricingFeatures}>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Jusqu'à 10 propriétés</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Vitrine basique</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Gestion des locataires</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Support par email</li>
                                <li><span style={{ marginRight: '10px', color: '#ccc' }}>✕</span> Analytics avancés</li>
                                <li><span style={{ marginRight: '10px', color: '#ccc' }}>✕</span> Contrats automatisés</li>
                            </ul>
                            <a href="#" className={`${styles.btn} ${styles.btnSecondary}`} style={{ width: '100%', textAlign: 'center' }}>Commencer</a>
                        </div>

                        <div className={`${styles.pricingCard} ${styles.pricingCardFeatured} ${styles.animateOnScroll} ${getAnimationClass('price-2')}`} id="price-2" data-animate="true">
                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#00b0ff', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>POPULAIRE</div>
                            <div className={styles.pricingHeader}>
                                <h3>Pro</h3>
                                <div className={styles.price}>99€<span>/mois</span></div>
                                <p>Idéal pour les agences</p>
                            </div>
                            <ul className={styles.pricingFeatures}>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Jusqu'à 50 propriétés</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Vitrine premium</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Gestion complète</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Support prioritaire</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Analytics avancés</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Contrats automatisés</li>
                            </ul>
                            <a href="#" className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%', textAlign: 'center' }}>Essai gratuit 14 jours</a>
                        </div>

                        <div className={`${styles.pricingCard} ${styles.animateOnScroll} ${getAnimationClass('price-3')}`} id="price-3" data-animate="true">
                            <div className={styles.pricingHeader}>
                                <h3>Enterprise</h3>
                                <div className={styles.price}>Sur mesure</div>
                                <p>Pour les grands portefeuilles</p>
                            </div>
                            <ul className={styles.pricingFeatures}>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Propriétés illimitées</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Vitrine sur mesure</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Gestion avancée</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Support dédié 24/7</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> Analytics personnalisés</li>
                                <li><span style={{ marginRight: '10px', color: '#00b0ff' }}>✓</span> API complète</li>
                            </ul>
                            <a href="#contact" className={`${styles.btn} ${styles.btnSecondary}`} style={{ width: '100%', textAlign: 'center' }}>Nous contacter</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta} id="cta">
                <div className={styles.container}>
                    <h2 className={`${styles.animateOnScroll} ${getAnimationClass('cta-title')}`} id="cta-title" data-animate="true">
                        Prêt à transformer votre activité immobilière ?
                    </h2>
                    <p className={`${styles.animateOnScroll} ${getAnimationClass('cta-desc')}`} id="cta-desc" data-animate="true">
                        Rejoignez plus de 500 professionnels qui ont déjà optimisé leur gestion avec ImmoPro. Commencez votre essai gratuit aujourd&apos;hui.
                    </p>
                    <a href="#" className={`${styles.btn} ${styles.btnPrimary} ${styles.animateOnScroll} ${getAnimationClass('cta-btn')}`} id="cta-btn" data-animate="true">
                        Essai gratuit 14 jours
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer} id="contact">
                <div className={styles.container}>
                    <div className={styles.footerContent}>
                        <div className={styles.footerColumn}>
                            <h3>Immo<span style={{ color: '#00b0ff' }}>Pro</span></h3>
                            <p>La plateforme tout-en-un pour les professionnels de l'immobilier. Combinez vitrine de dépôt et gestion complète de votre activité.</p>
                            <div className={styles.socialLinks}>
                                <a href="#"><i className="fab fa-twitter"></i></a>
                                <a href="#"><i className="fab fa-facebook-f"></i></a>
                                <a href="#"><i className="fab fa-linkedin-in"></i></a>
                                <a href="#"><i className="fab fa-instagram"></i></a>
                            </div>
                        </div>

                        <div className={styles.footerColumn}>
                            <h3>Liens rapides</h3>
                            <ul className={styles.footerLinks}>
                                <li><a href="#features">Fonctionnalités</a></li>
                                <li><a href="#platform">Plateforme</a></li>
                                <li><a href="#pricing">Tarifs</a></li>
                                <li><a href="#">Documentation</a></li>
                                <li><a href="#">Blog</a></li>
                            </ul>
                        </div>

                        <div className={styles.footerColumn}>
                            <h3>Support</h3>
                            <ul className={styles.footerLinks}>
                                <li><a href="#">Centre d'aide</a></li>
                                <li><a href="#">Contactez-nous</a></li>
                                <li><a href="#">Statut du service</a></li>
                                <li><a href="#">Politique de confidentialité</a></li>
                                <li><a href="#">Conditions d'utilisation</a></li>
                            </ul>
                        </div>

                        <div className={styles.footerColumn}>
                            <h3>Contact</h3>
                            <ul className={styles.footerLinks}>
                                <li><i className="fas fa-map-marker-alt" style={{ marginRight: '10px' }}></i> Paris, France</li>
                                <li><i className="fas fa-phone" style={{ marginRight: '10px' }}></i> +33 1 23 45 67 89</li>
                                <li><i className="fas fa-envelope" style={{ marginRight: '10px' }}></i> contact@immopro.fr</li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.copyright}>
                        <p>&copy; 2023 ImmoPro. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
