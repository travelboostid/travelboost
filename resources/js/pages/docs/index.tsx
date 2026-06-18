'use client';

import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    audienceLabels,
    defaultDocFeatureId,
    docFeatures,
    findDocFeature,
    type DocAudience,
} from './content';

type PageProps = {
    topic?: string | null;
};

function AudienceBadge({ audience }: { audience: DocAudience }) {
    return (
        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {audienceLabels[audience]}
        </span>
    );
}

export default function Docs({ topic }: PageProps) {
    const initialTopic = topic ?? defaultDocFeatureId;
    const [selectedId, setSelectedId] = useState(
        findDocFeature(initialTopic).id,
    );

    const selected = useMemo(() => findDocFeature(selectedId), [selectedId]);
    const SelectedIcon = selected.icon;

    const selectTopic = (id: string) => {
        setSelectedId(id);
        const url = new URL(window.location.href);
        url.searchParams.set('topic', id);
        window.history.replaceState({}, '', url);
    };

    return (
        <StdLayout>
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-10 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                        Dokumentasi{' '}
                        <span className="text-primary">TravelBoost</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-foreground/70">
                        Pilih fitur untuk melihat apa yang dapat Anda lakukan
                        sebagai vendor, agen, atau pelanggan.
                    </p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    <aside className="lg:w-72 lg:shrink-0">
                        <div className="rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-24">
                            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Fitur
                            </p>
                            <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                                {docFeatures.map((feature) => {
                                    const Icon = feature.icon;
                                    const isActive = feature.id === selected.id;

                                    return (
                                        <button
                                            key={feature.id}
                                            type="button"
                                            onClick={() =>
                                                selectTopic(feature.id)
                                            }
                                            className={cn(
                                                'flex min-w-[12rem] shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors lg:min-w-0 lg:w-full',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-foreground/80 hover:bg-muted',
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-4 w-4 shrink-0',
                                                    isActive
                                                        ? 'text-primary-foreground'
                                                        : 'text-primary',
                                                )}
                                            />
                                            <span className="font-medium">
                                                {feature.title}
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    <div className="min-w-0 flex-1">
                        <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                            <div className="mb-6 flex flex-wrap items-start gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <SelectedIcon className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                                        {selected.title}
                                    </h2>
                                    <p className="mt-2 text-foreground/70">
                                        {selected.summary}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8 flex flex-wrap gap-2">
                                {selected.audiences.map((audience) => (
                                    <AudienceBadge
                                        key={audience}
                                        audience={audience}
                                    />
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Yang dapat Anda lakukan
                                </h3>
                                <ul className="space-y-3">
                                    {selected.capabilities.map((capability) => (
                                        <li
                                            key={capability.title}
                                            className="flex gap-3 rounded-xl border border-border bg-background/60 p-4"
                                        >
                                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                                                <Check className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {capability.title}
                                                </p>
                                                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                                                    {capability.description}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>

                        <div className="mt-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-6 sm:p-8">
                            <h3 className="text-lg font-semibold text-foreground">
                                Butuh bantuan lebih lanjut?
                            </h3>
                            <p className="mt-2 text-sm text-foreground/70">
                                Tim support kami siap membantu onboarding,
                                pertanyaan produk, dan partnership.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Link href="/contact">Hubungi Support</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/learn-more">
                                        Lihat Ringkasan Fitur
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </StdLayout>
    );
}
