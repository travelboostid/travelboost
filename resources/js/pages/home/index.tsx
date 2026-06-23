import StdLayout from '@/components/layouts/std-layout';
import { lazy, Suspense } from 'react';
import { HeroSection } from './hero-section';

const StepsSection = lazy(() =>
    import('./steps-section').then((module) => ({
        default: module.StepsSection,
    })),
);
const BenefitsSection = lazy(() =>
    import('./benefits-section').then((module) => ({
        default: module.BenefitsSection,
    })),
);
const VisualsSection = lazy(() =>
    import('./visuals-section').then((module) => ({
        default: module.VisualsSection,
    })),
);
const EngagementSection = lazy(() =>
    import('./engagement-section').then((module) => ({
        default: module.EngagementSection,
    })),
);
const TestimonialsSection = lazy(() =>
    import('./testimonials-section').then((module) => ({
        default: module.TestimonialsSection,
    })),
);
const MarketingSection = lazy(() =>
    import('./marketing-section').then((module) => ({
        default: module.MarketingSection,
    })),
);
const IntegrationsSection = lazy(() =>
    import('./integrations-section').then((module) => ({
        default: module.IntegrationsSection,
    })),
);
const CommunitySection = lazy(() =>
    import('./community-section').then((module) => ({
        default: module.CommunitySection,
    })),
);
const CTASection = lazy(() =>
    import('./cta-section').then((module) => ({
        default: module.CTASection,
    })),
);

function BelowFoldSections() {
    return (
        <Suspense fallback={null}>
            <StepsSection />
            <BenefitsSection />
            <VisualsSection />
            <EngagementSection />
            <TestimonialsSection />
            <MarketingSection />
            <IntegrationsSection />
            <CommunitySection />
            <CTASection />
        </Suspense>
    );
}

export default function Page() {
    return (
        <StdLayout>
            <HeroSection />
            <BelowFoldSections />
        </StdLayout>
    );
}
