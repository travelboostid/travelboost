import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { GuestEntry } from '@/types/booking';
import { motion } from 'framer-motion';
import {
    AlertTriangleIcon,
    Baby,
    BedDoubleIcon,
    BedSingleIcon,
    CheckIcon,
    LayoutGridIcon,
    RefreshCwIcon,
    UserIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type BedType =
    | 'single'
    | 'single_extra_bed'
    | 'double'
    | 'twin'
    | 'extra_bed'
    | 'triple'
    | 'quad'
    | 'double_extra_bed'
    | 'twin_extra_bed';

export type RoomConfig = {
    id: string;
    type: BedType;
    label: string;
    capacity: number;
    guestIds: string[];
    sharingGuestIds: string[]; // child no bed, infant — no bed slot
};

export type BedAssignment = {
    bedIndex: number;
    guestId: string | null;
};

export function getRoomNumberByGuestId(
    rooms: RoomConfig[],
): Map<string, string> {
    const roomNumberByGuestId = new Map<string, string>();

    rooms.forEach((room, index) => {
        const roomNumber = String(index + 1);
        [...room.guestIds, ...(room.sharingGuestIds ?? [])]
            .filter(Boolean)
            .forEach((guestId) => {
                if (!roomNumberByGuestId.has(guestId)) {
                    roomNumberByGuestId.set(guestId, roomNumber);
                }
            });
    });

    return roomNumberByGuestId;
}

export function serializeRoomsForBooking(rooms: RoomConfig[]) {
    return rooms.map((room) => ({
        room_type: room.type,
        room_label: room.label,
        bed_layout: room.guestIds
            .map((guestId, index) => ({
                bedType: room.type,
                guestId,
                position: { x: index, y: 0 },
            }))
            .filter((bed) => Boolean(bed.guestId)),
    }));
}

type PhysicalBed = {
    label: string;
    icon: typeof BedSingleIcon;
    slots: number;
};

type BedTypeInfo = {
    label: string;
    capacity: number;
    icon: typeof BedSingleIcon;
    description: string;
    physicalBeds: PhysicalBed[];
};

const BED_TYPES: Record<BedType, BedTypeInfo> = {
    single: {
        label: 'Single Room',
        capacity: 1,
        icon: BedSingleIcon,
        description: '1 single bed',
        physicalBeds: [{ label: 'Single Bed', icon: BedSingleIcon, slots: 1 }],
    },
    single_extra_bed: {
        label: 'Single Room',
        capacity: 2,
        icon: BedSingleIcon,
        description: 'Single + extra bed',
        physicalBeds: [
            { label: 'Single Bed', icon: BedSingleIcon, slots: 1 },
            { label: 'Extra Bed', icon: BedSingleIcon, slots: 1 },
        ],
    },
    double: {
        label: 'Double Room',
        capacity: 2,
        icon: BedDoubleIcon,
        description: '1 double bed (2 pax)',
        physicalBeds: [{ label: 'Double Bed', icon: BedDoubleIcon, slots: 2 }],
    },
    twin: {
        label: 'Twin Room',
        capacity: 2,
        icon: BedSingleIcon,
        description: '2 single beds',
        physicalBeds: [
            { label: 'Single Bed 1', icon: BedSingleIcon, slots: 1 },
            { label: 'Single Bed 2', icon: BedSingleIcon, slots: 1 },
        ],
    },
    extra_bed: {
        label: 'Triple Room',
        capacity: 3,
        icon: BedDoubleIcon,
        description: 'Double + extra bed',
        physicalBeds: [
            { label: 'Double Bed', icon: BedDoubleIcon, slots: 2 },
            { label: 'Extra Bed', icon: BedSingleIcon, slots: 1 },
        ],
    },
    double_extra_bed: {
        label: 'Double Room',
        capacity: 3,
        icon: BedDoubleIcon,
        description: 'Double + extra bed',
        physicalBeds: [
            { label: 'Double Bed', icon: BedDoubleIcon, slots: 2 },
            { label: 'Extra Bed', icon: BedSingleIcon, slots: 1 },
        ],
    },
    twin_extra_bed: {
        label: 'Twin Room',
        capacity: 3,
        icon: BedSingleIcon,
        description: 'Twin + extra bed',
        physicalBeds: [
            { label: 'Single Bed 1', icon: BedSingleIcon, slots: 1 },
            { label: 'Single Bed 2', icon: BedSingleIcon, slots: 1 },
            { label: 'Extra Bed', icon: BedSingleIcon, slots: 1 },
        ],
    },
    triple: {
        label: 'Triple Room',
        capacity: 3,
        icon: BedSingleIcon,
        description: '3 single beds',
        physicalBeds: [
            { label: 'Single Bed 1', icon: BedSingleIcon, slots: 1 },
            { label: 'Single Bed 2', icon: BedSingleIcon, slots: 1 },
            { label: 'Single Bed 3', icon: BedSingleIcon, slots: 1 },
        ],
    },
    quad: {
        label: 'Quad Room',
        capacity: 4,
        icon: BedSingleIcon,
        description: '4 single beds',
        physicalBeds: [
            { label: 'Single Bed 1', icon: BedSingleIcon, slots: 1 },
            { label: 'Single Bed 2', icon: BedSingleIcon, slots: 1 },
            { label: 'Single Bed 3', icon: BedSingleIcon, slots: 1 },
            { label: 'Single Bed 4', icon: BedSingleIcon, slots: 1 },
        ],
    },
};

const NO_BED_CATEGORIES = ['child no bed', 'infant'];
const SINGLE_BED_CATEGORIES = ['Adult Single', 'Single', 'adult_single'];
const DOUBLE_BED_CATEGORIES = ['Adult Double', 'Double', 'adult_double'];
const TWIN_BED_CATEGORIES = ['Adult Twin', 'Twin', 'adult_twin'];
const TRIPLE_BED_CATEGORIES = ['Adult Triple', 'Triple'];
const QUAD_BED_CATEGORIES = ['Adult Quad', 'Quad'];
const CHILD_WITH_BED_CATEGORIES = ['Child With Bed', 'Child With Extra Bed'];
const ADULT_EXTRA_BED_CATEGORIES = [
    'Adult Extra Bed',
    'Extra Bed',
    'extra_bed',
];
const EXTRA_BED_CATEGORIES = [
    ...CHILD_WITH_BED_CATEGORIES,
    ...ADULT_EXTRA_BED_CATEGORIES,
];

const normalizeCategoryName = (value: string | null | undefined): string =>
    (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const isCategoryMatch = (
    priceCategory: string | null | undefined,
    categories: string[],
) =>
    categories
        .map((category) => normalizeCategoryName(category))
        .includes(normalizeCategoryName(priceCategory));

const isNoBedCategory = (priceCategory: string | null | undefined): boolean =>
    NO_BED_CATEGORIES.includes((priceCategory ?? '').trim().toLowerCase());

type PersistedBookingRoom = {
    room_type?: string | null;
    room_label?: string | null;
    bed_layout?: unknown;
};

type PersistedBookingPassenger = {
    id?: number | string | null;
    room_number?: string | number | null;
    room_type?: string | null;
    price_category?: string | null;
};

type PersistedBed = {
    guestId?: string | null;
    position?: { x?: number | string | null } | null;
};

const isBedType = (value: string): value is BedType =>
    Object.prototype.hasOwnProperty.call(BED_TYPES, value);

const parsePersistedBedLayout = (bedLayout: unknown): PersistedBed[] => {
    if (Array.isArray(bedLayout)) {
        return bedLayout as PersistedBed[];
    }

    if (typeof bedLayout === 'string' && bedLayout.trim() !== '') {
        try {
            const parsed = JSON.parse(bedLayout);

            return Array.isArray(parsed) ? (parsed as PersistedBed[]) : [];
        } catch {
            return [];
        }
    }

    return [];
};

const resolvePersistedGuestId = (
    persistedGuestId: string | number | null | undefined,
    guests: GuestEntry[],
): string | null => {
    if (persistedGuestId === null || persistedGuestId === undefined) {
        return null;
    }

    const rawGuestId = String(persistedGuestId);
    const directGuest = guests.find((guest) => guest.id === rawGuestId);

    if (directGuest) {
        return directGuest.id;
    }

    const numericGuestId = Number(rawGuestId);

    if (!Number.isFinite(numericGuestId)) {
        return null;
    }

    return (
        guests.find(
            (guest) =>
                guest.bookingPassengerId !== null &&
                guest.bookingPassengerId !== undefined &&
                Number(guest.bookingPassengerId) === numericGuestId,
        )?.id ?? null
    );
};

const resolvePassengerGuest = (
    passenger: PersistedBookingPassenger,
    guests: GuestEntry[],
): GuestEntry | null => {
    if (passenger.id === null || passenger.id === undefined) {
        return null;
    }

    const passengerId = Number(passenger.id);

    if (!Number.isFinite(passengerId)) {
        return null;
    }

    return (
        guests.find(
            (guest) =>
                guest.bookingPassengerId !== null &&
                guest.bookingPassengerId !== undefined &&
                Number(guest.bookingPassengerId) === passengerId,
        ) ?? null
    );
};

const placeGuestInFirstEmptyBed = (
    guestIds: string[],
    guestId: string,
): void => {
    if (guestIds.includes(guestId)) {
        return;
    }

    const emptySlot = guestIds.findIndex((id) => id === '');

    if (emptySlot >= 0) {
        guestIds[emptySlot] = guestId;
    }
};

const nextUnassignedBedGuest = (
    guests: GuestEntry[],
    assignedGuestIds: Set<string>,
): string | null =>
    guests.find(
        (guest) =>
            !assignedGuestIds.has(guest.id) &&
            !isNoBedCategory(guest.priceCategory),
    )?.id ?? null;

const roomTypeFromPassengers = (
    roomPassengers: PersistedBookingPassenger[],
    matchedGuests: GuestEntry[],
): BedType => {
    const persistedRoomType = roomPassengers
        .map((passenger) => String(passenger.room_type ?? '').trim())
        .find((roomType) => isBedType(roomType));

    if (persistedRoomType && isBedType(persistedRoomType)) {
        return persistedRoomType;
    }

    if (matchedGuests.length <= 1) {
        return 'single';
    }

    if (matchedGuests.length === 2) {
        return 'twin';
    }

    if (matchedGuests.length === 3) {
        return 'triple';
    }

    return 'quad';
};

const deserializeRoomsFromPassengerRoomNumbers = (
    guests: GuestEntry[],
    passengers: PersistedBookingPassenger[] | null | undefined,
): RoomConfig[] => {
    const passengersByRoom = new Map<string, PersistedBookingPassenger[]>();

    (passengers ?? []).forEach((passenger) => {
        const roomNumber = String(passenger.room_number ?? '').trim();

        if (roomNumber === '') {
            return;
        }

        passengersByRoom.set(roomNumber, [
            ...(passengersByRoom.get(roomNumber) ?? []),
            passenger,
        ]);
    });

    return Array.from(passengersByRoom.entries()).map(
        ([roomNumber, roomPassengers], roomIndex) => {
            const matchedGuests = roomPassengers
                .map((passenger) => resolvePassengerGuest(passenger, guests))
                .filter(Boolean) as GuestEntry[];
            const bedGuests = matchedGuests.filter(
                (guest) => !isNoBedCategory(guest.priceCategory),
            );
            const sharingGuestIds = matchedGuests
                .filter((guest) => isNoBedCategory(guest.priceCategory))
                .map((guest) => guest.id);
            const type = roomTypeFromPassengers(roomPassengers, bedGuests);
            const capacity = Math.max(
                BED_TYPES[type].capacity,
                bedGuests.length,
            );

            return {
                id: `room-${roomIndex + 1}`,
                type,
                label: `Room ${roomNumber}`,
                capacity,
                guestIds: Array.from(
                    { length: capacity },
                    (_, index) => bedGuests[index]?.id ?? '',
                ),
                sharingGuestIds,
            };
        },
    );
};

export function deserializeRoomsFromBooking(
    bookingRooms: PersistedBookingRoom[] | null | undefined,
    guests: GuestEntry[],
    passengers: PersistedBookingPassenger[] | null | undefined = [],
): RoomConfig[] {
    if (!Array.isArray(bookingRooms) || bookingRooms.length === 0) {
        return deserializeRoomsFromPassengerRoomNumbers(guests, passengers);
    }

    const assignedGuestIds = new Set<string>();

    return bookingRooms.map((room, roomIndex) => {
        const rawRoomType = String(room.room_type ?? '');
        const type = isBedType(rawRoomType) ? rawRoomType : 'twin';
        const capacity = BED_TYPES[type].capacity;
        const bedLayout = parsePersistedBedLayout(room.bed_layout);
        const highestSlot = bedLayout.reduce((highest, bed, index) => {
            const slot = Number(bed.position?.x ?? index);

            return Number.isFinite(slot) ? Math.max(highest, slot) : highest;
        }, -1);
        const guestIds = Array.from(
            { length: Math.max(capacity, highestSlot + 1) },
            () => '',
        );

        bedLayout.forEach((bed, index) => {
            const resolvedGuestId =
                resolvePersistedGuestId(bed.guestId, guests) ??
                nextUnassignedBedGuest(guests, assignedGuestIds);

            if (!resolvedGuestId) {
                return;
            }

            const slot = Number(bed.position?.x ?? index);
            const safeSlot = Number.isFinite(slot) && slot >= 0 ? slot : index;

            while (guestIds.length <= safeSlot) {
                guestIds.push('');
            }

            guestIds[safeSlot] = resolvedGuestId;
            assignedGuestIds.add(resolvedGuestId);
        });

        const roomNumber = String(roomIndex + 1);
        const sharingGuestIds: string[] = [];

        (passengers ?? [])
            .filter(
                (passenger) =>
                    String(passenger.room_number ?? '') === roomNumber,
            )
            .forEach((passenger) => {
                const matchedGuest = resolvePassengerGuest(passenger, guests);

                if (!matchedGuest) {
                    return;
                }

                if (isNoBedCategory(matchedGuest.priceCategory)) {
                    if (!guestIds.includes(matchedGuest.id)) {
                        sharingGuestIds.push(matchedGuest.id);
                        assignedGuestIds.add(matchedGuest.id);
                    }

                    return;
                }

                placeGuestInFirstEmptyBed(guestIds, matchedGuest.id);
                assignedGuestIds.add(matchedGuest.id);
            });

        return {
            id: `room-${roomIndex + 1}`,
            type,
            label: room.room_label || `Room ${roomIndex + 1}`,
            capacity,
            guestIds,
            sharingGuestIds: Array.from(new Set(sharingGuestIds)),
        };
    });
}

const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

// ─── Auto Recommendation Logic ──────────────────────────────────────────────────

const DEPENDENT_BED_ROOM_TYPES: BedType[] = [
    'double_extra_bed',
    'twin_extra_bed',
];

const EXTRA_BED_COMPATIBLE_ROOM_TYPES: BedType[] = [
    'twin',
    'double',
    'twin_extra_bed',
    'double_extra_bed',
];

const getExtraBedSlotIndex = (roomType: BedType): number | null => {
    if (roomType === 'twin_extra_bed' || roomType === 'double_extra_bed') {
        return 2;
    }

    if (roomType === 'single_extra_bed') {
        return 1;
    }

    if (roomType === 'twin' || roomType === 'double') {
        return BED_TYPES[roomType].capacity;
    }

    return null;
};

const buildBedSlotMapping = (room: RoomConfig) => {
    const config = BED_TYPES[room.type];
    const bedSlotMapping: {
        bed: PhysicalBed;
        slotIndices: number[];
    }[] = [];
    let cursor = 0;

    for (const bed of config.physicalBeds) {
        const indices: number[] = [];
        for (let slot = 0; slot < bed.slots; slot++) {
            indices.push(cursor);
            cursor++;
        }
        bedSlotMapping.push({ bed, slotIndices: indices });
    }

    const extraBedSlotIndex = getExtraBedSlotIndex(room.type);
    if (
        extraBedSlotIndex !== null &&
        room.guestIds[extraBedSlotIndex] &&
        !bedSlotMapping.some(({ slotIndices }) =>
            slotIndices.includes(extraBedSlotIndex),
        )
    ) {
        bedSlotMapping.push({
            bed: {
                label: 'Extra Bed',
                icon: BedSingleIcon,
                slots: 1,
            },
            slotIndices: [extraBedSlotIndex],
        });
    }

    return bedSlotMapping;
};

export function moveExtraBedGuestToRoom(
    rooms: RoomConfig[],
    guestId: string,
    targetRoomIdx: number,
    guests: GuestEntry[],
): RoomConfig[] {
    const newRooms = rooms.map((room) => ({
        ...room,
        guestIds: [...room.guestIds],
        sharingGuestIds: [...(room.sharingGuestIds ?? [])],
    }));

    for (const room of newRooms) {
        room.guestIds = room.guestIds.map((id) => (id === guestId ? '' : id));
        room.sharingGuestIds = room.sharingGuestIds.filter(
            (id) => id !== guestId,
        );
    }

    const targetRoom = newRooms[targetRoomIdx];
    const extraBedSlotIndex = getExtraBedSlotIndex(targetRoom.type);

    if (extraBedSlotIndex === null) {
        return rooms;
    }

    while (targetRoom.guestIds.length <= extraBedSlotIndex) {
        targetRoom.guestIds.push('');
    }

    const existingExtraBedGuestId =
        targetRoom.guestIds[extraBedSlotIndex] || null;

    if (existingExtraBedGuestId && existingExtraBedGuestId !== guestId) {
        for (const room of newRooms) {
            if (room.id === targetRoom.id) {
                continue;
            }

            const roomExtraBedSlotIndex = getExtraBedSlotIndex(room.type);
            if (roomExtraBedSlotIndex === null) {
                continue;
            }

            while (room.guestIds.length <= roomExtraBedSlotIndex) {
                room.guestIds.push('');
            }

            if (!room.guestIds[roomExtraBedSlotIndex]) {
                room.guestIds[roomExtraBedSlotIndex] = existingExtraBedGuestId;
                break;
            }
        }
    }

    targetRoom.guestIds[extraBedSlotIndex] = guestId;

    return normalizeRooms(newRooms, guests);
}

export type RoomArrangementValidationIssue = {
    message: string;
};

export type RoomArrangementValidationResult = {
    isValid: boolean;
    issues: RoomArrangementValidationIssue[];
};

const isEligibleDependentBaseCategory = (
    priceCategory: string | null | undefined,
): boolean =>
    isCategoryMatch(priceCategory, [
        ...DOUBLE_BED_CATEGORIES,
        ...TWIN_BED_CATEGORIES,
    ]);

const isExtraBedCategory = (priceCategory: string | null | undefined) =>
    isCategoryMatch(priceCategory, EXTRA_BED_CATEGORIES);

export function countEligibleExtraBedSlots(guests: GuestEntry[]): number {
    const doubleGuests = guests.filter((guest) =>
        isCategoryMatch(guest.priceCategory, DOUBLE_BED_CATEGORIES),
    ).length;
    const twinGuests = guests.filter((guest) =>
        isCategoryMatch(guest.priceCategory, TWIN_BED_CATEGORIES),
    ).length;

    return Math.ceil(doubleGuests / 2) + Math.ceil(twinGuests / 2);
}

export function validateDependentBedPassengerMix(
    guests: GuestEntry[],
): RoomArrangementValidationResult {
    const dependentBedGuests = guests.filter((guest) =>
        isExtraBedCategory(guest.priceCategory),
    );

    if (dependentBedGuests.length === 0) {
        return { isValid: true, issues: [] };
    }

    const eligibleExtraBedSlots = countEligibleExtraBedSlots(guests);

    if (
        eligibleExtraBedSlots === 0 ||
        dependentBedGuests.length > eligibleExtraBedSlots
    ) {
        return {
            isValid: false,
            issues: [
                {
                    message:
                        'Adult Extra Bed and Child With Bed guests must share an Adult Twin or Adult Double room, with only one extra-bed guest per room.',
                },
            ],
        };
    }

    return { isValid: true, issues: [] };
}

export function validateRoomArrangement(
    rooms: RoomConfig[],
    guests: GuestEntry[],
): RoomArrangementValidationResult {
    const issues: RoomArrangementValidationIssue[] = [
        ...validateDependentBedPassengerMix(guests).issues,
    ];
    const dependentBedGuestIds = new Set(
        guests
            .filter((guest) => isExtraBedCategory(guest.priceCategory))
            .map((guest) => guest.id),
    );
    const assignedDependentBedGuestIds = new Set<string>();

    rooms.forEach((room) => {
        const roomGuests = room.guestIds
            .filter(Boolean)
            .map((id) => guests.find((guest) => guest.id === id))
            .filter(Boolean) as GuestEntry[];
        const dependentBedGuests = roomGuests.filter((guest) =>
            isExtraBedCategory(guest.priceCategory),
        );

        const invalidSharingGuests = (room.sharingGuestIds ?? [])
            .filter((id) => dependentBedGuestIds.has(id))
            .map((id) => guests.find((guest) => guest.id === id))
            .filter(Boolean) as GuestEntry[];

        if (invalidSharingGuests.length > 0) {
            issues.push({
                message: `${invalidSharingGuests
                    .map((guest) =>
                        [guest.firstName, guest.lastName]
                            .filter(Boolean)
                            .join(' '),
                    )
                    .filter(Boolean)
                    .join(
                        ', ',
                    )} must be placed in an extra-bed slot, not in Sharing Guests.`,
            });
        }

        if (dependentBedGuests.length === 0) {
            return;
        }

        if (!DEPENDENT_BED_ROOM_TYPES.includes(room.type)) {
            issues.push({
                message: `${room.label}: Adult Extra Bed and Child With Bed can only be placed in an Adult Twin or Adult Double extra-bed room.`,
            });
        }

        const hasEligibleBase = roomGuests.some((guest) =>
            isEligibleDependentBaseCategory(guest.priceCategory),
        );

        if (!hasEligibleBase) {
            issues.push({
                message: `${room.label}: Extra-bed guests need an Adult Twin or Adult Double base guest in the same room.`,
            });
        }

        if (dependentBedGuests.length > 1) {
            issues.push({
                message: `${room.label}: Only one Adult Extra Bed or Child With Bed guest is allowed per Twin/Double room.`,
            });
        }

        dependentBedGuests.forEach((guest) =>
            assignedDependentBedGuestIds.add(guest.id),
        );
    });

    if (assignedDependentBedGuestIds.size < dependentBedGuestIds.size) {
        issues.push({
            message:
                'Every Adult Extra Bed and Child With Bed guest must be assigned to an eligible Twin/Double extra-bed room.',
        });
    }

    return {
        isValid: issues.length === 0,
        issues,
    };
}

const getRoomTypeForOccupants = (guests: GuestEntry[]): BedType => {
    const categories = guests
        .map((g) => g.priceCategory)
        .filter(Boolean) as string[];

    if (categories.some((cat) => QUAD_BED_CATEGORIES.includes(cat))) {
        return 'quad';
    }

    if (categories.some((cat) => TWIN_BED_CATEGORIES.includes(cat))) {
        return categories.some((cat) => isExtraBedCategory(cat))
            ? 'twin_extra_bed'
            : 'twin';
    }

    if (categories.some((cat) => DOUBLE_BED_CATEGORIES.includes(cat))) {
        return categories.some((cat) => isExtraBedCategory(cat))
            ? 'double_extra_bed'
            : 'double';
    }

    if (categories.some((cat) => TRIPLE_BED_CATEGORIES.includes(cat))) {
        return 'triple';
    }

    if (categories.some((cat) => SINGLE_BED_CATEGORIES.includes(cat))) {
        return categories.some((cat) => isExtraBedCategory(cat))
            ? 'single_extra_bed'
            : 'single';
    }

    return 'single';
};

const normalizeRoom = (room: RoomConfig, guests: GuestEntry[]): RoomConfig => {
    const roomGuests = room.guestIds
        .filter(Boolean)
        .map((id) => guests.find((guest) => guest.id === id))
        .filter(Boolean) as GuestEntry[];

    const roomType = getRoomTypeForOccupants(roomGuests);
    const orderedGuestIds = [...roomGuests.map((guest) => guest.id)];

    if (roomType === 'quad') {
        return {
            ...room,
            type: roomType,
            capacity: BED_TYPES[roomType].capacity,
            guestIds: orderedGuestIds.slice(0, 4),
        };
    }

    if (roomType === 'single_extra_bed') {
        const baseGuest = roomGuests.find(
            (guest) => !isExtraBedCategory(guest.priceCategory),
        );
        const extraGuest = roomGuests.find((guest) =>
            isExtraBedCategory(guest.priceCategory),
        );

        return {
            ...room,
            type: roomType,
            capacity: BED_TYPES[roomType].capacity,
            guestIds: [baseGuest?.id ?? '', extraGuest?.id ?? ''],
        };
    }

    if (roomType === 'double_extra_bed' || roomType === 'twin_extra_bed') {
        const baseGuests = roomGuests.filter(
            (guest) => !isExtraBedCategory(guest.priceCategory),
        );
        const extraGuest = roomGuests.find((guest) =>
            isExtraBedCategory(guest.priceCategory),
        );

        return {
            ...room,
            type: roomType,
            capacity: BED_TYPES[roomType].capacity,
            guestIds:
                baseGuests.length > 0
                    ? baseGuests.length === 1
                        ? [baseGuests[0].id, '', extraGuest?.id ?? '']
                        : [
                              ...baseGuests
                                  .slice(0, 2)
                                  .map((guest) => guest.id),
                              extraGuest?.id ?? '',
                          ]
                    : extraGuest
                      ? ['', '', extraGuest.id]
                      : [],
        };
    }

    return {
        ...room,
        type: roomType,
        capacity: BED_TYPES[roomType].capacity,
        guestIds: orderedGuestIds.slice(0, BED_TYPES[roomType].capacity),
    };
};

const normalizeRooms = (
    rooms: RoomConfig[],
    guests: GuestEntry[],
): RoomConfig[] => rooms.map((room) => normalizeRoom(room, guests));

const inferBedGroupFromCategory = (
    priceCategory: string | null | undefined,
):
    | 'single'
    | 'double'
    | 'twin'
    | 'triple'
    | 'quad'
    | 'childWithBed'
    | 'adultExtraBed'
    | 'noBed'
    | null => {
    if (isNoBedCategory(priceCategory)) {
        return 'noBed';
    }

    if (isCategoryMatch(priceCategory, CHILD_WITH_BED_CATEGORIES)) {
        return 'childWithBed';
    }

    if (isCategoryMatch(priceCategory, ADULT_EXTRA_BED_CATEGORIES)) {
        return 'adultExtraBed';
    }

    if (isCategoryMatch(priceCategory, SINGLE_BED_CATEGORIES)) {
        return 'single';
    }

    if (isCategoryMatch(priceCategory, DOUBLE_BED_CATEGORIES)) {
        return 'double';
    }

    if (isCategoryMatch(priceCategory, TWIN_BED_CATEGORIES)) {
        return 'twin';
    }

    if (isCategoryMatch(priceCategory, TRIPLE_BED_CATEGORIES)) {
        return 'triple';
    }

    if (isCategoryMatch(priceCategory, QUAD_BED_CATEGORIES)) {
        return 'quad';
    }

    const normalized = normalizeCategoryName(priceCategory);

    if (normalized.includes('twin')) {
        return 'twin';
    }

    if (normalized.includes('double')) {
        return 'double';
    }

    if (normalized.includes('single')) {
        return 'single';
    }

    if (normalized.includes('triple')) {
        return 'triple';
    }

    if (normalized.includes('quad')) {
        return 'quad';
    }

    if (
        normalized.includes('extra bed') ||
        normalized.includes('with bed') ||
        normalized.includes('extrabed')
    ) {
        return normalized.includes('child') || normalized.includes('infant')
            ? 'childWithBed'
            : 'adultExtraBed';
    }

    if (normalized.includes('no bed')) {
        return 'noBed';
    }

    return null;
};

const groupGuestsForRoomRecommendation = (guests: GuestEntry[]) => {
    const singles: GuestEntry[] = [];
    const doubles: GuestEntry[] = [];
    const twins: GuestEntry[] = [];
    const triples: GuestEntry[] = [];
    const quads: GuestEntry[] = [];
    const childWithBed: GuestEntry[] = [];
    const adultExtraBed: GuestEntry[] = [];
    const noBedGuests: GuestEntry[] = [];
    const uncategorized: GuestEntry[] = [];

    guests.forEach((guest) => {
        const group = inferBedGroupFromCategory(guest.priceCategory);

        switch (group) {
            case 'single':
                singles.push(guest);
                break;
            case 'double':
                doubles.push(guest);
                break;
            case 'twin':
                twins.push(guest);
                break;
            case 'triple':
                triples.push(guest);
                break;
            case 'quad':
                quads.push(guest);
                break;
            case 'childWithBed':
                childWithBed.push(guest);
                break;
            case 'adultExtraBed':
                adultExtraBed.push(guest);
                break;
            case 'noBed':
                noBedGuests.push(guest);
                break;
            default:
                uncategorized.push(guest);
                break;
        }
    });

    return {
        singles,
        doubles,
        twins,
        triples,
        quads,
        childWithBed,
        adultExtraBed,
        noBedGuests,
        uncategorized,
    };
};

const roomHasAssignedGuests = (room: RoomConfig): boolean =>
    room.guestIds.some(Boolean) || (room.sharingGuestIds?.length ?? 0) > 0;

export function buildRoomsGuestFingerprint(guests: GuestEntry[]): string {
    return JSON.stringify({
        count: guests.length,
        guests: guests.map((guest) => `${guest.id}-${guest.priceCategory}`),
    });
}

export function isRoomArrangementComplete(
    rooms: RoomConfig[],
    guests: GuestEntry[],
): boolean {
    if (guests.length === 0) {
        return true;
    }

    if (rooms.some((room) => !roomHasAssignedGuests(room))) {
        return false;
    }

    const assignedGuestIds = new Set([
        ...rooms.flatMap((room) => room.guestIds.filter(Boolean)),
        ...rooms.flatMap((room) => room.sharingGuestIds ?? []),
    ]);

    if (!guests.every((guest) => assignedGuestIds.has(guest.id))) {
        return false;
    }

    return validateRoomArrangement(rooms, guests).isValid;
}

export function recommendRoomsForGuests(guests: GuestEntry[]): RoomConfig[] {
    if (guests.length === 0) {
        return [];
    }

    return normalizeRooms(autoRecommendRooms(guests), guests);
}

export function loadRoomsFromBooking(
    bookingRooms: PersistedBookingRoom[] | null | undefined,
    guests: GuestEntry[],
    passengers: PersistedBookingPassenger[] | null | undefined = [],
): RoomConfig[] {
    const hasPersistedRooms =
        Array.isArray(bookingRooms) && bookingRooms.length > 0;
    const hasGuestCategories = guests.some((guest) => guest.priceCategory);

    if (!hasGuestCategories) {
        return [];
    }

    if (!hasPersistedRooms) {
        const fromPassengers = deserializeRoomsFromPassengerRoomNumbers(
            guests,
            passengers,
        );

        if (
            fromPassengers.length > 0 &&
            isRoomArrangementComplete(fromPassengers, guests)
        ) {
            return normalizeRooms(fromPassengers, guests);
        }

        return recommendRoomsForGuests(guests);
    }

    const deserialized = deserializeRoomsFromBooking(
        bookingRooms,
        guests,
        passengers,
    );

    if (isRoomArrangementComplete(deserialized, guests)) {
        return normalizeRooms(deserialized, guests);
    }

    return recommendRoomsForGuests(guests);
}

export function autoRecommendRooms(guests: GuestEntry[]): RoomConfig[] {
    const rooms: RoomConfig[] = [];
    let roomIdx = 0;

    const makeRoom = (type: BedType, ids: string[]): RoomConfig => {
        roomIdx++;
        return {
            id: `room-${roomIdx}`,
            type,
            label: `Room ${roomIdx}`,
            capacity: BED_TYPES[type].capacity,
            guestIds: ids,
            sharingGuestIds: [],
        };
    };

    const {
        singles,
        doubles,
        twins,
        triples,
        quads,
        childWithBed,
        adultExtraBed,
        noBedGuests,
        uncategorized,
    } = groupGuestsForRoomRecommendation(guests);

    // Single rooms
    for (const g of singles) rooms.push(makeRoom('single', [g.id]));

    // Triple rooms (groups of 3)
    for (let i = 0; i < triples.length; i += 3) {
        rooms.push(
            makeRoom(
                'triple',
                triples.slice(i, i + 3).map((g) => g.id),
            ),
        );
    }

    // Quad rooms (groups of 4, with empty slots allowed)
    for (let i = 0; i < quads.length; i += 4) {
        rooms.push(
            makeRoom(
                'quad',
                quads.slice(i, i + 4).map((g) => g.id),
            ),
        );
    }

    const assignedGuestIds = new Set(rooms.flatMap((room) => room.guestIds));
    const dependentBedGuests = [...childWithBed, ...adultExtraBed];

    const makeSharedRooms = (
        baseGuests: GuestEntry[],
        dependentGuests: GuestEntry[],
        baseType: 'double' | 'twin',
    ) => {
        const baseQueue = [...baseGuests].filter(
            (guest) => !assignedGuestIds.has(guest.id),
        );
        const dependentQueue = [...dependentGuests].filter(
            (guest) => !assignedGuestIds.has(guest.id),
        );
        const extraBedType =
            baseType === 'twin' ? 'twin_extra_bed' : 'double_extra_bed';
        let dependentIdx = 0;

        for (let i = 0; i < baseQueue.length; i += 2) {
            const pairedGuests = baseQueue.slice(i, i + 2);

            if (pairedGuests.length === 2) {
                if (dependentIdx < dependentQueue.length) {
                    const dependentGuest = dependentQueue[dependentIdx++];
                    rooms.push(
                        makeRoom(extraBedType, [
                            pairedGuests[0].id,
                            pairedGuests[1].id,
                            dependentGuest.id,
                        ]),
                    );
                    pairedGuests.forEach((guest) =>
                        assignedGuestIds.add(guest.id),
                    );
                    assignedGuestIds.add(dependentGuest.id);
                    continue;
                }

                rooms.push(
                    makeRoom(
                        baseType,
                        pairedGuests.map((guest) => guest.id),
                    ),
                );
                pairedGuests.forEach((guest) => assignedGuestIds.add(guest.id));
                continue;
            }

            const leftoverBase = pairedGuests[0];
            if (dependentIdx < dependentQueue.length) {
                const dependentGuest = dependentQueue[dependentIdx++];
                rooms.push(
                    makeRoom(extraBedType, [
                        leftoverBase.id,
                        '',
                        dependentGuest.id,
                    ]),
                );
                assignedGuestIds.add(leftoverBase.id);
                assignedGuestIds.add(dependentGuest.id);
                continue;
            }

            rooms.push(makeRoom(baseType, [leftoverBase.id]));
            assignedGuestIds.add(leftoverBase.id);
        }
    };

    makeSharedRooms(twins, dependentBedGuests, 'twin');
    makeSharedRooms(doubles, dependentBedGuests, 'double');

    const attachDependentToEligibleRoom = (dependentGuest: GuestEntry) => {
        for (const room of rooms) {
            const roomGuests = room.guestIds
                .filter(Boolean)
                .map((id) => guests.find((guest) => guest.id === id))
                .filter(Boolean) as GuestEntry[];
            const dependentInRoom = roomGuests.some((guest) =>
                isExtraBedCategory(guest.priceCategory),
            );

            if (dependentInRoom) {
                continue;
            }

            const baseGuests = roomGuests.filter(
                (guest) =>
                    !isExtraBedCategory(guest.priceCategory) &&
                    isEligibleDependentBaseCategory(guest.priceCategory),
            );

            if (baseGuests.length === 0) {
                continue;
            }

            const usesTwinBase =
                baseGuests.some((guest) =>
                    isCategoryMatch(guest.priceCategory, TWIN_BED_CATEGORIES),
                ) ||
                room.type === 'twin' ||
                room.type === 'twin_extra_bed';
            const extraBedType: BedType = usesTwinBase
                ? 'twin_extra_bed'
                : 'double_extra_bed';
            const extraBedSlotIndex = getExtraBedSlotIndex(extraBedType) ?? 2;

            room.type = extraBedType;
            room.capacity = BED_TYPES[extraBedType].capacity;

            if (baseGuests.length === 1) {
                room.guestIds = [baseGuests[0].id, '', dependentGuest.id];
            } else {
                room.guestIds = [
                    baseGuests[0].id,
                    baseGuests[1]?.id ?? '',
                    dependentGuest.id,
                ];
            }

            while (room.guestIds.length <= extraBedSlotIndex) {
                room.guestIds.push('');
            }

            room.guestIds[extraBedSlotIndex] = dependentGuest.id;
            assignedGuestIds.add(dependentGuest.id);

            return true;
        }

        return false;
    };

    const pairDependentWithLeftoverBase = (
        dependentGuest: GuestEntry,
        baseGuests: GuestEntry[],
        baseType: 'double' | 'twin',
    ) => {
        const leftoverBase = baseGuests.find(
            (guest) => !assignedGuestIds.has(guest.id),
        );

        if (!leftoverBase) {
            return false;
        }

        const extraBedType =
            baseType === 'twin' ? 'twin_extra_bed' : 'double_extra_bed';
        rooms.push(
            makeRoom(extraBedType, [leftoverBase.id, '', dependentGuest.id]),
        );
        assignedGuestIds.add(leftoverBase.id);
        assignedGuestIds.add(dependentGuest.id);

        return true;
    };

    dependentBedGuests
        .filter((guest) => !assignedGuestIds.has(guest.id))
        .forEach((dependentGuest) => {
            if (attachDependentToEligibleRoom(dependentGuest)) {
                return;
            }

            if (
                pairDependentWithLeftoverBase(dependentGuest, twins, 'twin') ||
                pairDependentWithLeftoverBase(dependentGuest, doubles, 'double')
            ) {
                return;
            }

            const fallbackBase =
                twins.find((guest) => !assignedGuestIds.has(guest.id)) ??
                doubles.find((guest) => !assignedGuestIds.has(guest.id));

            if (fallbackBase) {
                const baseType = twins.some(
                    (guest) => guest.id === fallbackBase.id,
                )
                    ? 'twin'
                    : 'double';
                pairDependentWithLeftoverBase(
                    dependentGuest,
                    [fallbackBase],
                    baseType,
                );
            }
        });

    [...twins, ...doubles, ...uncategorized]
        .filter((guest) => !assignedGuestIds.has(guest.id))
        .forEach((guest) => {
            const group = inferBedGroupFromCategory(guest.priceCategory);

            if (group === 'twin' || group === 'double') {
                rooms.push(makeRoom(group, [guest.id]));
            } else {
                rooms.push(makeRoom('single', [guest.id]));
            }

            assignedGuestIds.add(guest.id);
        });

    // No-bed guests → share across rooms evenly
    noBedGuests.forEach((g, i) => {
        if (rooms.length > 0) {
            const targetRoom = rooms[i % rooms.length];
            targetRoom.sharingGuestIds = [
                ...new Set([...(targetRoom.sharingGuestIds ?? []), g.id]),
            ];
            assignedGuestIds.add(g.id);
        } else {
            const r = makeRoom('single', []);
            r.sharingGuestIds.push(g.id);
            rooms.push(r);
            assignedGuestIds.add(g.id);
        }
    });

    return rooms;
}

// ─── Helper: get guest display name ─────────────────────────────────────────────

function getGuestDisplayName(guests: GuestEntry[], guestId: string | null) {
    if (!guestId) return 'Empty';
    const g = guests.find((gu) => gu.id === guestId);
    if (!g) return 'Unknown';
    const name = [g.firstName, g.lastName].filter(Boolean).join(' ');
    return name || `Guest ${guests.indexOf(g) + 1}`;
}

// ─── Bed Arrangement Modal ──────────────────────────────────────────────────────

function BedArrangementModal({
    open,
    onOpenChange,
    rooms,
    guests,
    onRoomsChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rooms: RoomConfig[];
    guests: GuestEntry[];
    onRoomsChange: (rooms: RoomConfig[]) => void;
}) {
    const [swapSource, setSwapSource] = useState<{
        roomIdx: number;
        slotIdx: number;
    } | null>(null);

    const isArrangementValid = (proposedRooms: RoomConfig[]) => {
        for (const r of proposedRooms) {
            const occupiedGuestCount = r.guestIds.filter((id) => !!id).length;
            if (occupiedGuestCount > BED_TYPES[r.type].capacity) {
                toast.error(
                    `Room ${r.label}: Too many guests for a ${BED_TYPES[r.type].label}.`,
                );
                return false;
            }

            if (r.type === 'single_extra_bed') {
                const mainBedOccupied = !!r.guestIds[0];
                const extraBedOccupied = !!r.guestIds[1];
                if (!mainBedOccupied && extraBedOccupied) {
                    toast.error(
                        `Room ${r.label}: Extra bed cannot be occupied if the main bed is empty.`,
                    );
                    return false;
                }
            }

            if (r.type === 'double_extra_bed' || r.type === 'twin_extra_bed') {
                const mainBedOccupied = !!r.guestIds[0] || !!r.guestIds[1];
                const extraBedOccupied = !!r.guestIds[2];
                if (!mainBedOccupied && extraBedOccupied) {
                    toast.error(
                        `Room ${r.label}: Extra bed cannot be occupied if the main bed is empty.`,
                    );
                    return false;
                }
            }

            // Check if guest's priceCategory matches the room type
            for (const gid of r.guestIds) {
                if (!gid) continue;
                const g = guests.find((gu) => gu.id === gid);
                if (!g || !g.priceCategory) continue;

                const cat = g.priceCategory;
                const name =
                    [g.firstName, g.lastName].filter(Boolean).join(' ') ||
                    'Guest';

                if (
                    isCategoryMatch(cat, SINGLE_BED_CATEGORIES) &&
                    !['single', 'single_extra_bed'].includes(r.type)
                ) {
                    toast.error(
                        `${name} purchased a Single room but is sharing with invalid guests in ${r.label}.`,
                    );
                    return false;
                }
                if (
                    isCategoryMatch(cat, DOUBLE_BED_CATEGORIES) &&
                    r.type !== 'double'
                ) {
                    if (!['double_extra_bed', 'extra_bed'].includes(r.type)) {
                        toast.error(
                            `${name} purchased a Double room but is placed in a ${r.label}.`,
                        );
                        return false;
                    }
                }
                if (
                    isCategoryMatch(cat, TWIN_BED_CATEGORIES) &&
                    r.type !== 'twin'
                ) {
                    if (!['twin_extra_bed'].includes(r.type)) {
                        toast.error(
                            `${name} purchased a Twin room but is placed in a ${r.label}.`,
                        );
                        return false;
                    }
                }
                if (
                    isCategoryMatch(cat, TRIPLE_BED_CATEGORIES) &&
                    r.type !== 'triple'
                ) {
                    toast.error(
                        `${name} purchased a Triple room but is placed in a ${r.label}.`,
                    );
                    return false;
                }
                if (
                    isCategoryMatch(cat, QUAD_BED_CATEGORIES) &&
                    r.type !== 'quad'
                ) {
                    toast.error(
                        `${name} purchased a Quad room but is placed in a ${r.label}.`,
                    );
                    return false;
                }
                if (isExtraBedCategory(cat)) {
                    if (
                        ![
                            'single_extra_bed',
                            'double_extra_bed',
                            'twin_extra_bed',
                            'extra_bed',
                        ].includes(r.type)
                    ) {
                        toast.error(
                            `${name} (${cat}) must be placed in a room with an extra bed.`,
                        );
                        return false;
                    }
                }
            }
        }

        const validation = validateRoomArrangement(proposedRooms, guests);

        if (!validation.isValid) {
            toast.error(
                validation.issues[0]?.message ?? 'Invalid room arrangement.',
            );
            return false;
        }

        return true;
    };

    const handleSlotClick = (roomIdx: number, slotIdx: number) => {
        if (swapSource === null) {
            setSwapSource({ roomIdx, slotIdx });
        } else {
            // Swap guests between slots (can be across rooms)
            const newRooms = rooms.map((r) => ({
                ...r,
                guestIds: [...r.guestIds],
            }));
            const srcRoom = newRooms[swapSource.roomIdx];
            const dstRoom = newRooms[roomIdx];

            const srcGuestId = srcRoom.guestIds[swapSource.slotIdx] ?? null;
            const dstGuestId = dstRoom.guestIds[slotIdx] ?? null;

            if (srcRoom.id === dstRoom.id) {
                // Same room swap
                srcRoom.guestIds[swapSource.slotIdx] = dstGuestId ?? '';
                srcRoom.guestIds[slotIdx] = srcGuestId ?? '';
            } else {
                srcRoom.guestIds[swapSource.slotIdx] = dstGuestId ?? '';
                dstRoom.guestIds[slotIdx] = srcGuestId ?? '';
            }

            const normalizedRooms = normalizeRooms(newRooms, guests);

            if (isArrangementValid(normalizedRooms)) {
                onRoomsChange(normalizedRooms);
            }
            setSwapSource(null);
        }
    };

    const handleSelectGuest = (
        roomIdx: number,
        slotIdx: number,
        guestId: string | null,
    ) => {
        const newRooms = rooms.map((r) => ({
            ...r,
            guestIds: [...r.guestIds],
        }));

        // Remove guest from any other slot first
        if (guestId) {
            for (const room of newRooms) {
                room.guestIds = room.guestIds.map((id) =>
                    id === guestId ? '' : id,
                );
            }
        }

        // Assign to target slot
        const targetRoom = newRooms[roomIdx];
        while (targetRoom.guestIds.length <= slotIdx) {
            targetRoom.guestIds.push('');
        }
        targetRoom.guestIds[slotIdx] = guestId ?? '';

        const normalizedRooms = normalizeRooms(newRooms, guests);

        if (isArrangementValid(normalizedRooms)) {
            onRoomsChange(normalizedRooms);
        }
    };

    const handleAutoAssign = () => {
        onRoomsChange(recommendRoomsForGuests(guests));
        setSwapSource(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 p-0 sm:max-w-3xl">
                <DialogHeader className="shrink-0 border-b px-6 py-4">
                    <DialogTitle className="flex items-center gap-2">
                        <LayoutGridIcon className="size-5 text-primary" />
                        Bed Arrangement
                    </DialogTitle>
                    <DialogDescription>
                        Click any slot to select it, then click another slot to
                        swap.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                    {rooms.map((room, roomIdx) => {
                        const config = BED_TYPES[room.type];
                        const bedSlotMapping = buildBedSlotMapping(room);
                        const extraBedSlotIndex = getExtraBedSlotIndex(
                            room.type,
                        );

                        return (
                            <div
                                key={room.id}
                                className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-4"
                            >
                                <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {room.label} - {config.label}
                                </p>

                                <div
                                    className={cn(
                                        'mx-auto grid gap-3',
                                        config.physicalBeds.length === 1
                                            ? 'max-w-[260px] grid-cols-1'
                                            : config.physicalBeds.length === 2
                                              ? 'max-w-[440px] grid-cols-2'
                                              : config.physicalBeds.length === 4
                                                ? 'max-w-[680px] grid-cols-2 sm:grid-cols-4'
                                                : 'max-w-[540px] grid-cols-3',
                                    )}
                                >
                                    {bedSlotMapping.map(
                                        ({ bed, slotIndices }, bedIdx) => {
                                            const BedIcon = bed.icon;
                                            const isDoubleBed = bed.slots >= 2;

                                            return (
                                                <div
                                                    key={bedIdx}
                                                    className="flex flex-col items-center gap-2 rounded-xl border bg-card px-3 py-3 shadow-sm"
                                                >
                                                    <BedIcon
                                                        className={cn(
                                                            'text-muted-foreground transition-colors',
                                                            isDoubleBed
                                                                ? 'size-9'
                                                                : 'size-7',
                                                        )}
                                                    />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                                        {bed.label}
                                                    </span>

                                                    <div className="grid w-full grid-cols-1 gap-1.5">
                                                        {slotIndices.map(
                                                            (slotIdx) => {
                                                                const guestId =
                                                                    room
                                                                        .guestIds[
                                                                        slotIdx
                                                                    ] || null;
                                                                const isSelected =
                                                                    swapSource?.roomIdx ===
                                                                        roomIdx &&
                                                                    swapSource?.slotIdx ===
                                                                        slotIdx;
                                                                const hasGuest =
                                                                    !!guestId;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            slotIdx
                                                                        }
                                                                        className="flex flex-col gap-1"
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleSlotClick(
                                                                                    roomIdx,
                                                                                    slotIdx,
                                                                                )
                                                                            }
                                                                            className={cn(
                                                                                'group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all',
                                                                                isSelected
                                                                                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                                                                    : hasGuest
                                                                                      ? 'border-primary/30 bg-primary/5'
                                                                                      : 'border-dashed border-border hover:border-primary/30 hover:bg-muted/50',
                                                                            )}
                                                                        >
                                                                            <div
                                                                                className={cn(
                                                                                    'flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                                                                                    isSelected
                                                                                        ? 'bg-primary text-primary-foreground'
                                                                                        : hasGuest
                                                                                          ? 'bg-primary/10 text-primary'
                                                                                          : 'bg-muted text-muted-foreground',
                                                                                )}
                                                                            >
                                                                                {slotIdx +
                                                                                    1}
                                                                            </div>
                                                                            <span
                                                                                className={cn(
                                                                                    'truncate text-[11px] font-medium',
                                                                                    isSelected
                                                                                        ? 'text-primary'
                                                                                        : hasGuest
                                                                                          ? 'text-primary'
                                                                                          : 'text-muted-foreground',
                                                                                )}
                                                                            >
                                                                                {getGuestDisplayName(
                                                                                    guests,
                                                                                    guestId,
                                                                                )}
                                                                            </span>
                                                                        </button>
                                                                        <div
                                                                            onClick={(
                                                                                e,
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                        >
                                                                            <Select
                                                                                value={
                                                                                    guestId ??
                                                                                    '__empty__'
                                                                                }
                                                                                onValueChange={(
                                                                                    val,
                                                                                ) =>
                                                                                    handleSelectGuest(
                                                                                        roomIdx,
                                                                                        slotIdx,
                                                                                        val ===
                                                                                            '__empty__'
                                                                                            ? null
                                                                                            : val,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="h-6 w-full text-[10px]">
                                                                                    <SelectValue placeholder="Assign..." />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="__empty__">
                                                                                        Empty
                                                                                    </SelectItem>
                                                                                    {guests
                                                                                        .filter(
                                                                                            (
                                                                                                g,
                                                                                            ) => {
                                                                                                if (
                                                                                                    extraBedSlotIndex ===
                                                                                                    slotIdx
                                                                                                ) {
                                                                                                    return isExtraBedCategory(
                                                                                                        g.priceCategory,
                                                                                                    );
                                                                                                }

                                                                                                if (
                                                                                                    isExtraBedCategory(
                                                                                                        g.priceCategory,
                                                                                                    )
                                                                                                ) {
                                                                                                    return false;
                                                                                                }

                                                                                                return true;
                                                                                            },
                                                                                        )
                                                                                        .map(
                                                                                            (
                                                                                                g,
                                                                                                gi,
                                                                                            ) => (
                                                                                                <SelectItem
                                                                                                    key={
                                                                                                        g.id
                                                                                                    }
                                                                                                    value={
                                                                                                        g.id
                                                                                                    }
                                                                                                >
                                                                                                    Guest{' '}
                                                                                                    {gi +
                                                                                                        1}

                                                                                                    :{' '}
                                                                                                    {[
                                                                                                        g.firstName,
                                                                                                        g.lastName,
                                                                                                    ]
                                                                                                        .filter(
                                                                                                            Boolean,
                                                                                                        )
                                                                                                        .join(
                                                                                                            ' ',
                                                                                                        ) ||
                                                                                                        '(unnamed)'}
                                                                                                </SelectItem>
                                                                                            ),
                                                                                        )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Extra bed guests */}
                    {(() => {
                        const extraBedGuests = guests.filter((g) =>
                            isExtraBedCategory(g.priceCategory),
                        );
                        if (extraBedGuests.length === 0) {
                            return null;
                        }

                        const extraBedRoomOptions = rooms
                            .map((room, ri) => ({ room, ri }))
                            .filter(({ room }) =>
                                EXTRA_BED_COMPATIBLE_ROOM_TYPES.includes(
                                    room.type,
                                ),
                            );

                        if (extraBedRoomOptions.length === 0) {
                            return null;
                        }

                        const findCurrentRoomIdx = (guestId: string) =>
                            rooms.findIndex((room) => {
                                const slotIdx = getExtraBedSlotIndex(room.type);
                                return (
                                    slotIdx !== null &&
                                    room.guestIds[slotIdx] === guestId
                                );
                            });

                        return (
                            <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4">
                                <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-primary">
                                    Extra Bed Guests
                                </p>
                                <div className="space-y-2">
                                    {extraBedGuests.map((guest) => {
                                        const currentRoomIdx =
                                            findCurrentRoomIdx(guest.id);

                                        return (
                                            <div
                                                key={guest.id}
                                                className="flex items-center gap-3 rounded-lg bg-background/80 px-3 py-2"
                                            >
                                                <BedSingleIcon className="size-4 shrink-0 text-primary" />
                                                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                                    {[
                                                        guest.firstName,
                                                        guest.lastName,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' ') || 'Unnamed'}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="shrink-0 px-1.5 py-0 text-[9px] uppercase text-primary"
                                                >
                                                    {guest.priceCategory ??
                                                        'Extra Bed'}
                                                </Badge>
                                                <Select
                                                    value={String(
                                                        currentRoomIdx >= 0
                                                            ? currentRoomIdx
                                                            : (extraBedRoomOptions[0]
                                                                  ?.ri ?? 0),
                                                    )}
                                                    onValueChange={(val) => {
                                                        const targetIdx =
                                                            Number(val);
                                                        if (
                                                            targetIdx ===
                                                            currentRoomIdx
                                                        ) {
                                                            return;
                                                        }
                                                        const updatedRooms =
                                                            moveExtraBedGuestToRoom(
                                                                rooms,
                                                                guest.id,
                                                                targetIdx,
                                                                guests,
                                                            );
                                                        if (
                                                            isArrangementValid(
                                                                updatedRooms,
                                                            )
                                                        ) {
                                                            onRoomsChange(
                                                                updatedRooms,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-6 w-[140px] shrink-0 text-[10px]">
                                                        <SelectValue placeholder="Choose room..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {extraBedRoomOptions.map(
                                                            ({ room, ri }) => (
                                                                <SelectItem
                                                                    key={
                                                                        room.id
                                                                    }
                                                                    value={String(
                                                                        ri,
                                                                    )}
                                                                >
                                                                    {room.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Sharing guests (no bed) */}
                    {rooms.some(
                        (r) => (r.sharingGuestIds ?? []).length > 0,
                    ) && (
                        <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4">
                            <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-primary">
                                Sharing Guests (No Bed)
                            </p>
                            <div className="space-y-2">
                                {rooms.map((room, roomIdx) =>
                                    (room.sharingGuestIds ?? []).map(
                                        (guestId) => {
                                            const guest = guests.find(
                                                (g) => g.id === guestId,
                                            );
                                            if (!guest) return null;
                                            return (
                                                <div
                                                    key={guestId}
                                                    className="flex items-center gap-3 rounded-lg bg-background/80 px-3 py-2"
                                                >
                                                    <Baby className="size-4 shrink-0 text-primary" />
                                                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                                        {[
                                                            guest.firstName,
                                                            guest.lastName,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ') ||
                                                            'Unnamed'}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="shrink-0 px-1.5 py-0 text-[9px] uppercase text-primary"
                                                    >
                                                        {guest.priceCategory ??
                                                            'No Bed'}
                                                    </Badge>
                                                    <Select
                                                        value={String(roomIdx)}
                                                        onValueChange={(
                                                            val,
                                                        ) => {
                                                            const newRooms =
                                                                rooms.map(
                                                                    (r) => ({
                                                                        ...r,
                                                                        sharingGuestIds:
                                                                            [
                                                                                ...(r.sharingGuestIds ??
                                                                                    []),
                                                                            ],
                                                                    }),
                                                                );
                                                            // Remove from current room
                                                            newRooms[
                                                                roomIdx
                                                            ].sharingGuestIds =
                                                                newRooms[
                                                                    roomIdx
                                                                ].sharingGuestIds.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        guestId,
                                                                );
                                                            // Add to target room
                                                            newRooms[
                                                                Number(val)
                                                            ].sharingGuestIds.push(
                                                                guestId,
                                                            );
                                                            onRoomsChange(
                                                                newRooms,
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-6 w-[120px] shrink-0 text-[10px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {rooms.map(
                                                                (r, ri) => (
                                                                    <SelectItem
                                                                        key={
                                                                            r.id
                                                                        }
                                                                        value={String(
                                                                            ri,
                                                                        )}
                                                                    >
                                                                        {
                                                                            r.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            );
                                        },
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    {swapSource !== null && (
                        <p className="text-center text-xs font-medium text-primary">
                            {rooms[swapSource.roomIdx]?.label} - Slot{' '}
                            {swapSource.slotIdx + 1} selected - click another
                            slot to swap
                        </p>
                    )}
                </div>

                <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-3 sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoAssign}
                        className="gap-1.5"
                    >
                        <RefreshCwIcon className="size-3.5" />
                        Auto-Assign
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="gap-1.5"
                    >
                        <CheckIcon className="size-3.5" />
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Room Card ──────────────────────────────────────────────────────────────────

function RoomCard({
    room,
    guests,
}: {
    room: RoomConfig;
    guests: GuestEntry[];
}) {
    const info = BED_TYPES[room.type];
    const Icon = info.icon;
    const sharingGuests = (room.sharingGuestIds ?? [])
        .filter((id) => !!id)
        .map((id) => guests.find((g) => g.id === id))
        .filter(Boolean);

    return (
        <motion.div
            variants={itemVariants}
            className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">
                            {room.label} - {info.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {info.description}
                        </p>
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    'mt-3 grid gap-2',
                    info.physicalBeds.length === 1
                        ? 'grid-cols-1'
                        : info.physicalBeds.length === 2
                          ? 'grid-cols-2'
                          : info.physicalBeds.length === 4
                            ? 'grid-cols-2 sm:grid-cols-4'
                            : 'grid-cols-3',
                )}
            >
                {buildBedSlotMapping(room).map(
                    ({ bed, slotIndices }, bedIdx) => {
                        const BedIcon = bed.icon;

                        return (
                            <div
                                key={bedIdx}
                                className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-2"
                            >
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <BedIcon className="size-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">
                                        {bed.label}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {slotIndices.map((slotIdx) => {
                                        const guestId =
                                            room.guestIds[slotIdx] || null;
                                        const guest = guestId
                                            ? guests.find(
                                                  (g) => g.id === guestId,
                                              )
                                            : null;

                                        return guest ? (
                                            <div
                                                key={slotIdx}
                                                className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
                                            >
                                                <UserIcon className="size-3 text-muted-foreground" />
                                                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                                                    {[
                                                        guest.firstName,
                                                        guest.lastName,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' ') ||
                                                        'Unnamed guest'}
                                                </span>
                                            </div>
                                        ) : (
                                            <div
                                                key={slotIdx}
                                                className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground"
                                            >
                                                <UserIcon className="size-3" />
                                                Empty slot
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    },
                )}
            </div>

            {/* Sharing guests (no bed) */}
            {sharingGuests.length > 0 && (
                <div className="mt-3 border-t border-dashed border-border/60 pt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                        Sharing (No Bed)
                    </p>
                    <div className="space-y-1">
                        {sharingGuests.map((guest) => (
                            <div
                                key={guest!.id}
                                className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5"
                            >
                                <Baby className="size-3.5 text-primary" />
                                <span className="text-xs font-medium text-primary">
                                    {[guest!.firstName, guest!.lastName]
                                        .filter(Boolean)
                                        .join(' ') || 'Unnamed guest'}
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="ml-auto px-1.5 py-0 text-[9px] font-bold uppercase text-primary"
                                >
                                    {guest!.priceCategory ?? 'No Bed'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ─── Main Step 2 ────────────────────────────────────────────────────────────────

type Step2Props = {
    guests: GuestEntry[];
    rooms: RoomConfig[];
    onRoomsChange: (rooms: RoomConfig[]) => void;
    readOnly?: boolean;
};

export default function Step2RoomConfiguration({
    guests,
    rooms,
    onRoomsChange,
    readOnly = false,
}: Step2Props) {
    const [bedModalOpen, setBedModalOpen] = useState(false);

    const assignedGuestIds = [
        ...rooms.flatMap((r) => r.guestIds),
        ...rooms.flatMap((r) => r.sharingGuestIds ?? []),
    ];
    const unassignedGuests = guests.filter(
        (g) => !assignedGuestIds.includes(g.id),
    );
    const roomArrangementValidation = useMemo(
        () => validateRoomArrangement(rooms, guests),
        [guests, rooms],
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-2">
                <LayoutGridIcon className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Room Arrangement</h2>
            </div>

            {unassignedGuests.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
                >
                    <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
                    <div className="text-sm">
                        <p className="font-bold text-destructive">
                            Unassigned Guests Detected
                        </p>
                        <p className="mt-1 leading-relaxed text-destructive/80">
                            There are {unassignedGuests.length} guest(s) not yet
                            assigned to any room.{' '}
                            {readOnly
                                ? 'This paid booking uses the saved room arrangement and cannot be edited from this review step.'
                                : 'Please open the Bed Arrangement editor to assign all guests before proceeding.'}
                        </p>
                        <ul className="mt-2 list-inside list-disc text-xs text-destructive/70">
                            {unassignedGuests.map((g) => (
                                <li key={g.id}>
                                    {[g.firstName, g.lastName]
                                        .filter(Boolean)
                                        .join(' ') || 'Unnamed guest'}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            )}

            {!roomArrangementValidation.isValid && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
                >
                    <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
                    <div className="text-sm">
                        <p className="font-bold text-destructive">
                            Invalid Room Arrangement
                        </p>
                        <p className="mt-1 leading-relaxed text-destructive/80">
                            Adult Extra Bed and Child With Bed guests must share
                            an Adult Twin or Adult Double room, with only one
                            extra-bed guest per room.
                        </p>
                        <ul className="mt-2 list-inside list-disc text-xs text-destructive/70">
                            {roomArrangementValidation.issues.map(
                                (issue, index) => (
                                    <li key={`${issue.message}-${index}`}>
                                        {issue.message}
                                    </li>
                                ),
                            )}
                        </ul>
                    </div>
                </motion.div>
            )}

            <p className="text-xs text-muted-foreground">
                {readOnly
                    ? 'Saved room arrangement for this paid booking. Room assignments cannot be changed from this review step.'
                    : 'System recommended layout based on your price category selections. You can adjust room assignments using the bed arrangement editor.'}
            </p>

            {rooms.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    <p>
                        No rooms configured yet. Please select price categories
                        in Step 1 first, then rooms will be auto-generated.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                guests={guests}
                            />
                        ))}
                    </div>

                    {!readOnly && (
                        <div className="flex gap-2 justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setBedModalOpen(true)}
                                className="gap-2 border-dashed"
                            >
                                <LayoutGridIcon className="size-4" />
                                View & Edit Bed Arrangement
                                <Badge
                                    variant="secondary"
                                    className="ml-1 text-[10px]"
                                >
                                    {rooms.length} room
                                    {rooms.length !== 1 ? 's' : ''}
                                </Badge>
                            </Button>
                        </div>
                    )}
                </>
            )}

            {!readOnly && (
                <BedArrangementModal
                    open={bedModalOpen}
                    onOpenChange={setBedModalOpen}
                    rooms={rooms}
                    guests={guests}
                    onRoomsChange={onRoomsChange}
                />
            )}
        </motion.div>
    );
}
