import HomeLayout from '@/components/layouts/home-layout';
import { BenefitsSection } from './benefits-section';
import { CommunitySection } from './community-section';
import { CTASection } from './cta-section';
import { EngagementSection } from './engagement-section';
import { Footer } from './footer';
import { HeroSection } from './hero-section';
import { IntegrationsSection } from './integrations-section';
import { MarketingSection } from './marketing-section';
import { StepsSection } from './steps-section';
import { TestimonialsSection } from './testimonials-section';
import { VisualsSection } from './visuals-section';

export default function Page() {
  return (
    <HomeLayout>
      <HeroSection />
      <StepsSection />
      <BenefitsSection />
      <VisualsSection />
      <EngagementSection />
      <TestimonialsSection />
      <MarketingSection />
      <IntegrationsSection />
      <CommunitySection />
      <CTASection />
      <Footer />
    </HomeLayout>
  );
}
