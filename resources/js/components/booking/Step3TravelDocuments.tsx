import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { GuestEntry, TravelDocumentEntry } from '@/types/booking';
import { motion } from 'framer-motion';
import {
    FileTextIcon,
    HelpCircleIcon,
    InfoIcon,
    UploadCloudIcon,
    XIcon,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENT_LABEL = '5 MB';

function storageUrlFromPath(path: string | null): string | null {
    if (!path) {
        return null;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    if (path.startsWith('/storage/')) {
        return path;
    }

    if (path.startsWith('storage/')) {
        return `/${path}`;
    }

    return `/storage/${path.replace(/^\/+/, '')}`;
}

type Step3Props = {
    guests: GuestEntry[];
    travelDocuments: TravelDocumentEntry[];
    onTravelDocumentsChange: (docs: TravelDocumentEntry[]) => void;
    departureDate: string;
    readOnly?: boolean;
};

// ─── Travel Document Card ───────────────────────────────────────────────────────

function TravelDocumentCard({
    doc,
    guestIndex,
    guestName,
    guestType,
    onChange,
    departureDate,
    readOnly,
}: {
    doc: TravelDocumentEntry;
    guestIndex: number;
    guestName: string;
    guestType: 'adult' | 'child' | 'infant';
    onChange: (updated: TravelDocumentEntry) => void;
    departureDate: string;
    readOnly: boolean;
}) {
    const passportInputRef = useRef<HTMLInputElement>(null);
    const visaInputRef = useRef<HTMLInputElement>(null);
    const [fileErrors, setFileErrors] = useState<{
        passportFile?: string;
        visaFile?: string;
    }>({});

    const isAdult = guestType === 'adult';
    const passportFileUrl = storageUrlFromPath(doc.passportFilePath);
    const visaFileUrl = storageUrlFromPath(doc.visaFilePath);

    const handleFileSelect = (
        field: 'passportFile' | 'visaFile',
        nameField: 'passportFileName' | 'visaFileName',
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (readOnly) {
            return;
        }

        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_ATTACHMENT_BYTES) {
                setFileErrors((current) => ({
                    ...current,
                    [field]: `Maximum file size is ${MAX_ATTACHMENT_LABEL}.`,
                }));
                e.target.value = '';
                return;
            }

            const pathField =
                field === 'passportFile' ? 'passportFilePath' : 'visaFilePath';

            setFileErrors((current) => ({ ...current, [field]: undefined }));
            onChange({
                ...doc,
                [field]: file,
                [nameField]: file.name,
                [pathField]: null,
            });
        }
    };

    const handleFileRemove = (
        field: 'passportFile' | 'visaFile',
        nameField: 'passportFileName' | 'visaFileName',
        pathField: 'passportFilePath' | 'visaFilePath',
        inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
        if (readOnly) {
            return;
        }

        onChange({ ...doc, [field]: null, [nameField]: '', [pathField]: null });
        setFileErrors((current) => ({ ...current, [field]: undefined }));
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: guestIndex * 0.05 }}
            className="w-full max-w-full overflow-hidden rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/50"
        >
            <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
                <div
                    className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        isAdult
                            ? 'bg-primary/10 text-primary'
                            : guestType === 'child'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-purple-500/10 text-purple-600',
                    )}
                >
                    {guestIndex + 1}
                </div>
                <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {guestName || `Guest ${guestIndex + 1}`}
                </h4>
                <Badge
                    variant="secondary"
                    className={cn(
                        'shrink-0 px-2 py-0 text-[10px] font-bold uppercase',
                        isAdult
                            ? 'bg-primary/10 text-primary'
                            : guestType === 'child'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-purple-500/10 text-purple-600',
                    )}
                >
                    {guestType}
                </Badge>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {/* Left: Passport */}
                <div className="flex min-w-0 flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Passport
                    </p>
                    <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                            Passport Number
                        </Label>
                        <Input
                            placeholder="e.g. A12345678"
                            value={doc.passportNumber}
                            onChange={(e) =>
                                onChange({
                                    ...doc,
                                    passportNumber: e.target.value,
                                })
                            }
                            disabled={readOnly}
                            className="h-9 w-full min-w-0 max-w-full text-sm"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                            Issue Date
                        </Label>
                        <Input
                            type="date"
                            value={doc.passportIssueDate}
                            onChange={(e) =>
                                onChange({
                                    ...doc,
                                    passportIssueDate: e.target.value,
                                })
                            }
                            disabled={readOnly}
                            className="h-9 w-full min-w-0 max-w-full text-sm"
                        />
                    </div>
                    <div className="grid gap-1">
                        <div className="flex items-center gap-1">
                            <Label className="text-[11px] text-muted-foreground">
                                Expiry Date
                            </Label>
                            <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircleIcon className="size-3.5 cursor-help text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="right"
                                        className="max-w-[220px] text-xs"
                                    >
                                        Passport must be valid for at least 6
                                        months beyond the departure date.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Input
                            type="date"
                            value={doc.passportExpiryDate}
                            onChange={(e) =>
                                onChange({
                                    ...doc,
                                    passportExpiryDate: e.target.value,
                                })
                            }
                            disabled={readOnly}
                            className={cn(
                                'h-9 w-full min-w-0 max-w-full text-sm',
                                doc.passportExpiryDate &&
                                    departureDate &&
                                    (() => {
                                        const expiry = new Date(
                                            doc.passportExpiryDate,
                                        );
                                        const departure = new Date(
                                            departureDate,
                                        );
                                        const sixMonthsAfter = new Date(
                                            departure,
                                        );
                                        sixMonthsAfter.setMonth(
                                            sixMonthsAfter.getMonth() + 6,
                                        );
                                        return expiry < sixMonthsAfter;
                                    })() &&
                                    'border-destructive focus-visible:ring-destructive',
                            )}
                        />
                        {doc.passportExpiryDate &&
                            departureDate &&
                            (() => {
                                const expiry = new Date(doc.passportExpiryDate);
                                const departure = new Date(departureDate);
                                const sixMonthsAfter = new Date(departure);
                                sixMonthsAfter.setMonth(
                                    sixMonthsAfter.getMonth() + 6,
                                );
                                return expiry < sixMonthsAfter;
                            })() && (
                                <span className="text-[10px] text-destructive">
                                    Passport must be valid for at least 6 months
                                    beyond departure.
                                </span>
                            )}
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                            Passport Scan / Photo
                        </Label>
                        <input
                            ref={passportInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) =>
                                handleFileSelect(
                                    'passportFile',
                                    'passportFileName',
                                    e,
                                )
                            }
                        />
                        {doc.passportFileName ? (
                            <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border bg-muted/30 px-3 py-2">
                                <FileTextIcon className="size-4 shrink-0 text-primary" />
                                {passportFileUrl ? (
                                    <a
                                        href={passportFileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="min-w-0 flex-1 truncate text-xs font-semibold text-primary hover:underline"
                                    >
                                        {doc.passportFileName}
                                    </a>
                                ) : (
                                    <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                                        {doc.passportFileName}
                                    </span>
                                )}
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleFileRemove(
                                                'passportFile',
                                                'passportFileName',
                                                'passportFilePath',
                                                passportInputRef,
                                            )
                                        }
                                        className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <XIcon className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={readOnly}
                                onClick={() =>
                                    passportInputRef.current?.click()
                                }
                                className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-60"
                            >
                                <UploadCloudIcon className="size-3.5 shrink-0" />
                                <span className="truncate">Upload file</span>
                            </button>
                        )}
                        {fileErrors.passportFile && (
                            <p className="text-[10px] text-destructive">
                                {fileErrors.passportFile}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Visa */}
                <div className="flex min-w-0 flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Visa
                    </p>
                    <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                            Visa Number
                        </Label>
                        <Input
                            placeholder="e.g. V98765432"
                            value={doc.visaNumber}
                            onChange={(e) =>
                                onChange({ ...doc, visaNumber: e.target.value })
                            }
                            disabled={readOnly}
                            className="h-9 w-full min-w-0 max-w-full text-sm"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-[11px] text-muted-foreground">
                            Visa Scan / Photo
                        </Label>
                        <input
                            ref={visaInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) =>
                                handleFileSelect('visaFile', 'visaFileName', e)
                            }
                        />
                        {doc.visaFileName ? (
                            <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border bg-muted/30 px-3 py-2">
                                <FileTextIcon className="size-4 shrink-0 text-primary" />
                                {visaFileUrl ? (
                                    <a
                                        href={visaFileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="min-w-0 flex-1 truncate text-xs font-semibold text-primary hover:underline"
                                    >
                                        {doc.visaFileName}
                                    </a>
                                ) : (
                                    <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                                        {doc.visaFileName}
                                    </span>
                                )}
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleFileRemove(
                                                'visaFile',
                                                'visaFileName',
                                                'visaFilePath',
                                                visaInputRef,
                                            )
                                        }
                                        className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <XIcon className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={readOnly}
                                onClick={() => visaInputRef.current?.click()}
                                className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-60"
                            >
                                <UploadCloudIcon className="size-3.5 shrink-0" />
                                <span className="truncate">Upload file</span>
                            </button>
                        )}
                        {fileErrors.visaFile && (
                            <p className="text-[10px] text-destructive">
                                {fileErrors.visaFile}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Step 3 ────────────────────────────────────────────────────────────────

export default function Step3TravelDocuments({
    guests,
    travelDocuments,
    onTravelDocumentsChange,
    departureDate,
    readOnly = false,
}: Step3Props) {
    const handleDocUpdate = useCallback(
        (updated: TravelDocumentEntry) => {
            const newDocs = travelDocuments.map((d) =>
                d.guestId === updated.guestId ? updated : d,
            );
            onTravelDocumentsChange(newDocs);
        },
        [travelDocuments, onTravelDocumentsChange],
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-full space-y-6 overflow-hidden"
        >
            <div className="flex min-w-0 items-center gap-2">
                <FileTextIcon className="size-5 shrink-0 text-primary" />
                <h2 className="min-w-0 truncate text-lg font-semibold">
                    Travel Documents
                </h2>
            </div>

            <div className="flex min-w-0 max-w-full items-start gap-3 overflow-hidden rounded-lg border border-blue-200/50 bg-blue-50/50 px-4 py-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-blue-500" />
                <div className="min-w-0 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                    <p className="font-semibold">
                        These documents are optional and can be submitted later.
                    </p>
                    <p className="mt-1 text-blue-600/80 dark:text-blue-400/80">
                        Please ensure all travel documents (passport, visa) are
                        valid for at least 6 months from your departure date.
                        You can upload scans or photos of your documents here,
                        or provide them at a later time through your booking
                        dashboard.
                    </p>
                </div>
            </div>

            <div className="w-full max-w-full space-y-4 overflow-hidden">
                {guests.map((guest, idx) => {
                    const doc = travelDocuments.find(
                        (d) => d.guestId === guest.id,
                    );
                    if (!doc) return null;

                    const guestName = [guest.firstName, guest.lastName]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <TravelDocumentCard
                            key={guest.id}
                            doc={doc}
                            guestIndex={idx}
                            guestName={guestName}
                            guestType={guest.type}
                            onChange={handleDocUpdate}
                            departureDate={departureDate}
                            readOnly={readOnly}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}
