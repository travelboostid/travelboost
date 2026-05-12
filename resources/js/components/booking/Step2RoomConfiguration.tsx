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
import { useState } from 'react';
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

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

// ─── Auto Recommendation Logic ──────────────────────────────────────────────────

/** Categories that do NOT occupy a bed slot */
const NO_BED_CATEGORIES = ['Child No Bed', 'Infant', 'infant'];
const SINGLE_BED_CATEGORIES = ['Adult Single', 'Single'];
const DOUBLE_BED_CATEGORIES = ['Adult Double', 'Double'];
const TWIN_BED_CATEGORIES = ['Adult Twin', 'Twin'];
const TRIPLE_BED_CATEGORIES = ['Adult Triple', 'Triple'];
const QUAD_BED_CATEGORIES = ['Adult Quad', 'Quad'];
const EXTRA_BED_CATEGORIES = ['Child With Bed', 'Adult Extra Bed'];

const isCategoryMatch = (
  priceCategory: string | null | undefined,
  categories: string[],
) => categories.includes(priceCategory ?? '');

const isExtraBedCategory = (priceCategory: string | null | undefined) =>
  EXTRA_BED_CATEGORIES.includes(priceCategory ?? '');

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

const normalizeRoom = (
  room: RoomConfig,
  guests: GuestEntry[],
): RoomConfig => {
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
                ...baseGuests.slice(0, 2).map((guest) => guest.id),
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

  // Bed-occupying guests grouped by category
  let singles = guests.filter((g) =>
    isCategoryMatch(g.priceCategory, SINGLE_BED_CATEGORIES),
  );
  const doubles = guests.filter((g) =>
    isCategoryMatch(g.priceCategory, DOUBLE_BED_CATEGORIES),
  );
  const twins = guests.filter((g) =>
    isCategoryMatch(g.priceCategory, TWIN_BED_CATEGORIES),
  );
  const triples = guests.filter((g) =>
    isCategoryMatch(g.priceCategory, TRIPLE_BED_CATEGORIES),
  );
  const quads = guests.filter((g) =>
    isCategoryMatch(g.priceCategory, QUAD_BED_CATEGORIES),
  );

  let childWithBed = guests.filter((g) =>
    isCategoryMatch(g.priceCategory, ['Child With Bed']),
  );
  const adultExtraBed = guests.filter((g) =>
    isCategoryMatch(g.priceCategory, ['Adult Extra Bed']),
  );

  // Pair Adult Single with Child With Bed if possible
  while (singles.length > 0 && childWithBed.length > 0) {
    const single = singles.shift()!;
    const cwb = childWithBed.shift()!;
    rooms.push(makeRoom('single_extra_bed', [single.id, cwb.id]));
  }

  const extraBedOccupants = [...childWithBed, ...adultExtraBed];

  // Non-bed guests
  const noBedGuests = guests.filter((g) =>
    NO_BED_CATEGORIES.includes(g.priceCategory ?? ''),
  );

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

  const sharedGuests = [...doubles, ...twins, ...extraBedOccupants];
  if (sharedGuests.length > 0) {
    const R = Math.max(1, Math.floor(sharedGuests.length / 2));
    const sharedRooms: RoomConfig[] = Array.from({ length: R }, () =>
      makeRoom('double', []),
    );

    sharedGuests.forEach((g, i) => {
      const roomIdx = i % R;
      const targetRoom = sharedRooms[roomIdx];
      targetRoom.guestIds.push(g.id);

      if (targetRoom.guestIds.length === 1) {
        if (isCategoryMatch(g.priceCategory, TWIN_BED_CATEGORIES)) {
          targetRoom.type = 'twin';
        } else {
          targetRoom.type = 'double';
        }
        targetRoom.capacity = BED_TYPES[targetRoom.type].capacity;
      }
    });

    sharedRooms.forEach((r) => {
      const hasExtraBedOccupant = r.guestIds.some((id) => {
        const cat = guests.find((g) => g.id === id)?.priceCategory;
        return isExtraBedCategory(cat);
      });

      if (hasExtraBedOccupant) {
        r.type = r.type === 'twin' ? 'twin_extra_bed' : 'double_extra_bed';
        r.capacity = 3;

        // If there are only 2 guests (e.g., 1 Adult + 1 Child With Bed),
        // we must shift the extra bed occupant to the 3rd slot (Extra Bed slot).
        if (r.guestIds.length === 2) {
          const extraBedGuestId = r.guestIds.find((id) => {
            const cat = guests.find((g) => g.id === id)?.priceCategory;
            return isExtraBedCategory(cat);
          });
          const otherId = r.guestIds.find((id) => id !== extraBedGuestId);
          r.guestIds = [otherId || '', '', extraBedGuestId || ''];
        } else if (r.guestIds.length === 1) {
          r.guestIds = ['', '', r.guestIds[0]];
        }
      } else if (r.guestIds.length === 3) {
        r.type = r.type === 'twin' ? 'twin_extra_bed' : 'double_extra_bed';
        r.capacity = 3;
      } else {
        r.capacity = 2;
      }
      rooms.push(r);
    });
  }

  // No-bed guests → share across rooms evenly
  noBedGuests.forEach((g, i) => {
    if (rooms.length > 0) {
      rooms[i % rooms.length].sharingGuestIds.push(g.id);
    } else {
      // Edge case: only infants/no-bed children, create a placeholder room
      const r = makeRoom('single', []);
      r.sharingGuestIds.push(g.id);
      rooms.push(r);
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
          [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Guest';

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
        if (isCategoryMatch(cat, TWIN_BED_CATEGORIES) && r.type !== 'twin') {
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
        if (isCategoryMatch(cat, QUAD_BED_CATEGORIES) && r.type !== 'quad') {
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
    return true;
  };

  const handleSlotClick = (roomIdx: number, slotIdx: number) => {
    if (swapSource === null) {
      setSwapSource({ roomIdx, slotIdx });
    } else {
      // Swap guests between slots (can be across rooms)
      const newRooms = rooms.map((r) => ({ ...r, guestIds: [...r.guestIds] }));
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
    const newRooms = rooms.map((r) => ({ ...r, guestIds: [...r.guestIds] }));

    // Remove guest from any other slot first
    if (guestId) {
      for (const room of newRooms) {
        room.guestIds = room.guestIds.map((id) => (id === guestId ? '' : id));
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
    onRoomsChange(autoRecommendRooms(guests));
    setSwapSource(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGridIcon className="size-5 text-primary" />
            Bed Arrangement
          </DialogTitle>
          <DialogDescription>
            Click a slot to select it, then click another to swap. Or use the
            dropdown to assign a guest directly.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {rooms.map((room, roomIdx) => {
            const config = BED_TYPES[room.type];

            // Build physical bed → slot mapping within this room
            const bedSlotMapping: {
              bed: PhysicalBed;
              slotIndices: number[];
            }[] = [];
            let cursor = 0;
            for (const bed of config.physicalBeds) {
              const indices: number[] = [];
              for (let s = 0; s < bed.slots; s++) {
                indices.push(cursor);
                cursor++;
              }
              bedSlotMapping.push({ bed, slotIndices: indices });
            }

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
                  {bedSlotMapping.map(({ bed, slotIndices }, bedIdx) => {
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
                            isDoubleBed ? 'size-9' : 'size-7',
                          )}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {bed.label}
                        </span>

                        <div className="grid w-full grid-cols-1 gap-1.5">
                          {slotIndices.map((slotIdx) => {
                            const guestId = room.guestIds[slotIdx] || null;
                            const isSelected =
                              swapSource?.roomIdx === roomIdx &&
                              swapSource?.slotIdx === slotIdx;
                            const hasGuest = !!guestId;

                            return (
                              <div
                                key={slotIdx}
                                className="flex flex-col gap-1"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSlotClick(roomIdx, slotIdx)
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
                                    {slotIdx + 1}
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
                                    {getGuestDisplayName(guests, guestId)}
                                  </span>
                                </button>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Select
                                    value={guestId ?? '__empty__'}
                                    onValueChange={(val) =>
                                      handleSelectGuest(
                                        roomIdx,
                                        slotIdx,
                                        val === '__empty__' ? null : val,
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
                                      {guests.map((g, gi) => (
                                        <SelectItem key={g.id} value={g.id}>
                                          Guest {gi + 1}:{' '}
                                          {[g.firstName, g.lastName]
                                            .filter(Boolean)
                                            .join(' ') || '(unnamed)'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sharing guests (no bed) */}
        {rooms.some((r) => (r.sharingGuestIds ?? []).length > 0) && (
          <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4">
            <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-primary">
              Sharing Guests (No Bed)
            </p>
            <div className="space-y-2">
              {rooms.map((room, roomIdx) =>
                (room.sharingGuestIds ?? []).map((guestId) => {
                  const guest = guests.find((g) => g.id === guestId);
                  if (!guest) return null;
                  return (
                    <div
                      key={guestId}
                      className="flex items-center gap-3 rounded-lg bg-background/80 px-3 py-2"
                    >
                      <Baby className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {[guest.firstName, guest.lastName]
                          .filter(Boolean)
                          .join(' ') || 'Unnamed'}
                      </span>
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-1.5 py-0 text-[9px] uppercase text-primary"
                      >
                        {guest.priceCategory ?? 'No Bed'}
                      </Badge>
                      <Select
                        value={String(roomIdx)}
                        onValueChange={(val) => {
                          const newRooms = rooms.map((r) => ({
                            ...r,
                            sharingGuestIds: [...(r.sharingGuestIds ?? [])],
                          }));
                          // Remove from current room
                          newRooms[roomIdx].sharingGuestIds = newRooms[
                            roomIdx
                          ].sharingGuestIds.filter((id) => id !== guestId);
                          // Add to target room
                          newRooms[Number(val)].sharingGuestIds.push(guestId);
                          onRoomsChange(newRooms);
                        }}
                      >
                        <SelectTrigger className="h-6 w-[120px] shrink-0 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((r, ri) => (
                            <SelectItem key={r.id} value={String(ri)}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        )}

        {swapSource !== null && (
          <p className="text-center text-xs font-medium text-primary">
            {rooms[swapSource.roomIdx]?.label} - Slot {swapSource.slotIdx + 1}{' '}
            selected - click another slot to swap
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
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
            <p className="text-xs text-muted-foreground">{info.description}</p>
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
        {(() => {
          const bedSlotMapping: { bed: any; slotIndices: number[] }[] = [];
          let cursor = 0;
          for (const bed of info.physicalBeds) {
            const indices: number[] = [];
            for (let s = 0; s < bed.slots; s++) {
              indices.push(cursor);
              cursor++;
            }
            bedSlotMapping.push({ bed, slotIndices: indices });
          }

          return bedSlotMapping.map(({ bed, slotIndices }, bedIdx) => {
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
                    const guestId = room.guestIds[slotIdx] || null;
                    const guest = guestId
                      ? guests.find((g) => g.id === guestId)
                      : null;

                    return guest ? (
                      <div
                        key={slotIdx}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
                      >
                        <UserIcon className="size-3 text-muted-foreground" />
                        <span className="truncate text-[11px] font-medium">
                          {[guest.firstName, guest.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Unnamed guest'}
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
          });
        })()}
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
};

export default function Step2RoomConfiguration({
  guests,
  rooms,
  onRoomsChange,
}: Step2Props) {
  const [bedModalOpen, setBedModalOpen] = useState(false);

  const assignedGuestIds = [
    ...rooms.flatMap((r) => r.guestIds),
    ...rooms.flatMap((r) => r.sharingGuestIds ?? []),
  ];
  const unassignedGuests = guests.filter(
    (g) => !assignedGuestIds.includes(g.id),
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
              There are {unassignedGuests.length} guest(s) not yet assigned to
              any room. Please open the Bed Arrangement editor to assign all
              guests before proceeding.
            </p>
            <ul className="mt-2 list-inside list-disc text-xs text-destructive/70">
              {unassignedGuests.map((g) => (
                <li key={g.id}>
                  {[g.firstName, g.lastName].filter(Boolean).join(' ') ||
                    'Unnamed guest'}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground">
        System recommended layout based on your price category selections. You
        can adjust room assignments using the bed arrangement editor.
      </p>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <p>
            No rooms configured yet. Please select price categories in Step 1
            first, then rooms will be auto-generated.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} guests={guests} />
            ))}
          </div>

          {/* Bed Arrangement Button */}
          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBedModalOpen(true)}
              className="gap-2 border-dashed"
            >
              <LayoutGridIcon className="size-4" />
              View & Edit Bed Arrangement
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {rooms.length} room{rooms.length !== 1 ? 's' : ''}
              </Badge>
            </Button>
          </div>
        </>
      )}

      {/* Bed Arrangement Modal */}
      <BedArrangementModal
        open={bedModalOpen}
        onOpenChange={setBedModalOpen}
        rooms={rooms}
        guests={guests}
        onRoomsChange={onRoomsChange}
      />
    </motion.div>
  );
}
