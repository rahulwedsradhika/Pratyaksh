import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import WarmPublicHeader from '../components/public/WarmPublicHeader';
import WarmHeroSection from '../components/public/WarmHeroSection';
import WarmPlatformBenefits from '../components/public/WarmPlatformBenefits';
import WarmPricingSection from '../components/public/WarmPricingSection';
import WarmPublicFooter from '../components/public/WarmPublicFooter';
import '../styles/editorialHomepage.css';
import InstallAppButton from '../components/InstallAppButton';

export default function PublicHomePage() {
  const location = useLocation();

  useEffect(() => {
    // If navigated with hash or /pricing
    if (location.pathname === '/pricing' || location.hash === '#pricing') {
      const el = document.getElementById('pricing');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  return (
    <div className="v3-public-root">
      <div className="v3-ambient-glow" />
      <WarmPublicHeader />
      <main>
        <WarmHeroSection />
        <InstallAppButton />
        <WarmPricingSection />
        <WarmPlatformBenefits />
      </main>
      <WarmPublicFooter />
    </div>
  );
}

