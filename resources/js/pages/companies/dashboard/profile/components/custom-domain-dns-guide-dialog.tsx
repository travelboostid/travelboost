import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClipboard } from '@/hooks/use-clipboard';
import { Check, CircleHelp, Copy } from 'lucide-react';
import type React from 'react';
import { FormattedMessage } from 'react-intl';

const appHost = import.meta.env.VITE_APP_HOST;
const appIpHost = import.meta.env.VITE_APP_IP_HOST;

function getCustomSubdomainFqdn(domain: string, rootDomain: string): string {
    const normalized = domain.trim().toLowerCase();

    if (normalized && normalized.split('.').length > 2) {
        return normalized;
    }

    return `subdomain.${rootDomain}`;
}

function getAppSubdomainTarget(appSubdomain: string): string {
    const normalized = appSubdomain.trim();

    if (!normalized) {
        return `yoursubdomain.${appHost}`;
    }

    return `${normalized}.${appHost}`;
}

function getRootDomain(domain: string): string {
    const normalized = domain.trim().toLowerCase();

    if (!normalized) {
        return 'yourdomain.com';
    }

    const parts = normalized.split('.');

    if (parts.length <= 2) {
        return normalized;
    }

    return parts.slice(-2).join('.');
}

function DnsRecordRow({
    label,
    value,
    onCopy,
    copied,
}: {
    label: React.ReactNode;
    value: string;
    onCopy: (value: string) => void;
    copied: boolean;
}) {
    return (
        <div className="grid gap-1 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:gap-3">
            <span className="text-xs font-medium text-muted-foreground">
                {label}
            </span>
            <code className="rounded-md border bg-muted/60 px-2.5 py-1.5 font-mono text-xs break-all">
                {value}
            </code>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 justify-self-end sm:justify-self-auto"
                onClick={() => onCopy(value)}
            >
                {copied ? (
                    <Check className="size-3.5" />
                ) : (
                    <Copy className="size-3.5" />
                )}
                <span className="sr-only">
                    <FormattedMessage defaultMessage="Copy" />
                </span>
            </Button>
        </div>
    );
}

function DnsRecordGroup({
    title,
    records,
    onCopy,
    copiedText,
}: {
    title: React.ReactNode;
    records: Array<{
        type: string;
        host: string;
        target: string;
    }>;
    onCopy: (value: string) => void;
    copiedText: string | null;
}) {
    return (
        <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-foreground">{title}</p>
            {records.map((record) => (
                <div
                    key={`${record.type}-${record.host}`}
                    className="space-y-2.5"
                >
                    <DnsRecordRow
                        label={<FormattedMessage defaultMessage="Type" />}
                        value={record.type}
                        onCopy={onCopy}
                        copied={copiedText === record.type}
                    />
                    <DnsRecordRow
                        label={<FormattedMessage defaultMessage="Host" />}
                        value={record.host}
                        onCopy={onCopy}
                        copied={copiedText === record.host}
                    />
                    <DnsRecordRow
                        label={<FormattedMessage defaultMessage="Target" />}
                        value={record.target}
                        onCopy={onCopy}
                        copied={copiedText === record.target}
                    />
                </div>
            ))}
        </div>
    );
}

function SetupSteps({
    children,
    exampleDomain,
}: {
    children: React.ReactNode;
    exampleDomain: string;
}) {
    return (
        <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    1
                </span>
                <span>
                    <FormattedMessage defaultMessage="Open DNS settings for your domain at your registrar (Cloudflare, Niagahoster, Rumahweb, etc.)." />
                </span>
            </li>
            <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    2
                </span>
                <div className="min-w-0 flex-1 space-y-3">{children}</div>
            </li>
            <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    3
                </span>
                <span>
                    <FormattedMessage defaultMessage="Wait for DNS propagation (often a few minutes, sometimes up to 24 hours)." />
                </span>
            </li>
            <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    4
                </span>
                <span>
                    <FormattedMessage
                        defaultMessage="Enter {domain} in the field above and save your profile."
                        values={{
                            domain: (
                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                    {exampleDomain}
                                </code>
                            ),
                        }}
                    />
                </span>
            </li>
        </ol>
    );
}

export function CustomDomainDnsGuideDialog({
    domain,
    subdomain,
}: {
    domain: string;
    subdomain: string;
}) {
    const [copiedText, copy] = useClipboard();
    const rootDomain = getRootDomain(domain);
    const customSubdomainFqdn = getCustomSubdomainFqdn(domain, rootDomain);
    const appSubdomainTarget = getAppSubdomainTarget(subdomain);
    const subdomainExample = domain.trim() || customSubdomainFqdn;
    const normalizedDomain = domain.trim().toLowerCase();
    const rootExample =
        normalizedDomain.split('.').length === 2
            ? normalizedDomain
            : rootDomain;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                    <CircleHelp className="size-3.5" />
                    <FormattedMessage defaultMessage="DNS setup" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        <FormattedMessage defaultMessage="Point your domain to Travelboost" />
                    </DialogTitle>
                    <DialogDescription>
                        <FormattedMessage defaultMessage="Choose how you want to use your domain, then add the matching DNS records at your registrar." />
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="root">
                    <TabsList variant="line" className="w-full">
                        <TabsTrigger value="root" className="flex-1">
                            <FormattedMessage defaultMessage="Root domain" />
                        </TabsTrigger>
                        <TabsTrigger value="subdomain" className="flex-1">
                            <FormattedMessage defaultMessage="Subdomain" />
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="root" className="mt-4">
                        <SetupSteps exampleDomain={rootExample}>
                            <p>
                                <FormattedMessage
                                    defaultMessage="Use this when you want visitors to reach {rootDomain}."
                                    values={{ rootDomain }}
                                />
                            </p>
                            <div className="space-y-3">
                                <DnsRecordGroup
                                    title={
                                        <FormattedMessage defaultMessage="A record (root domain)" />
                                    }
                                    records={[
                                        {
                                            type: 'A',
                                            host: '@',
                                            target: appIpHost,
                                        },
                                    ]}
                                    onCopy={copy}
                                    copiedText={copiedText}
                                />
                                <DnsRecordGroup
                                    title={
                                        <FormattedMessage defaultMessage="CNAME record (www, optional)" />
                                    }
                                    records={[
                                        {
                                            type: 'CNAME',
                                            host: 'www',
                                            target: rootDomain,
                                        },
                                    ]}
                                    onCopy={copy}
                                    copiedText={copiedText}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="The www CNAME is optional if you only want {rootDomain} without www. Enter {rootDomain} as your custom domain."
                                    values={{
                                        rootDomain: (
                                            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                                {rootExample}
                                            </code>
                                        ),
                                    }}
                                />
                            </p>
                        </SetupSteps>
                    </TabsContent>

                    <TabsContent value="subdomain" className="mt-4">
                        <SetupSteps exampleDomain={subdomainExample}>
                            <p>
                                <FormattedMessage
                                    defaultMessage="Use this when you want a custom subdomain such as {subdomainFqdn}."
                                    values={{
                                        subdomainFqdn: customSubdomainFqdn,
                                    }}
                                />
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="Choose one of the options below." />
                            </p>
                            <div className="space-y-3">
                                <DnsRecordGroup
                                    title={
                                        <FormattedMessage defaultMessage="Option 1: A record" />
                                    }
                                    records={[
                                        {
                                            type: 'A',
                                            host: customSubdomainFqdn,
                                            target: appIpHost,
                                        },
                                    ]}
                                    onCopy={copy}
                                    copiedText={copiedText}
                                />
                                <DnsRecordGroup
                                    title={
                                        <FormattedMessage defaultMessage="Option 2: CNAME record" />
                                    }
                                    records={[
                                        {
                                            type: 'CNAME',
                                            host: customSubdomainFqdn,
                                            target: appSubdomainTarget,
                                        },
                                    ]}
                                    onCopy={copy}
                                    copiedText={copiedText}
                                />
                            </div>
                        </SetupSteps>
                    </TabsContent>
                </Tabs>

                <DialogFooter showCloseButton />
            </DialogContent>
        </Dialog>
    );
}
