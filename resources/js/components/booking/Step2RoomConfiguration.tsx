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
import { useCallback, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type BedType = 'single' | 'double' | 'twin' | 'extra_bed' | 'triple';

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
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

// ─── Auto Recommendation Logic ──────────────────────────────────────────────────

/** Categories that do NOT occupy a bed slot */
const NO_BED_CATEGORIES = ['Child No Bed', 'Infant'];

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
  const singles = guests.filter((g) => g.priceCategory === 'Single');
  const doubles = guests.filter((g) => g.priceCategory === 'Double');
  const twins = guests.filter((g) => g.priceCategory === 'Twin');
  const triples = guests.filter((g) => g.priceCategory === 'Triple');
  const quads = guests.filter((g) => g.priceCategory === 'Quad');
  const childWithBed = guests.filter((g) => g.priceCategory === 'Child With Bed');

  // Non-bed guests
  const noBedGuests = guests.filter((g) => NO_BED_CATEGORIES.includes(g.priceCategory ?? ''));

  // Single rooms
  for (const g of singles) rooms.push(makeRoom('single', [g.id]));

  // Double rooms (pairs)
  for (let i = 0; i < doubles.length; i += 2) {
    rooms.push(makeRoom('double', doubles.slice(i, i + 2).map((g) => g.id)));
  }

  // Twin rooms (pairs)
  for (let i = 0; i < twins.length; i += 2) {
    rooms.push(makeRoom('twin', twins.slice(i, i + 2).map((g) => g.id)));
  }

  // Triple rooms (groups of 3)
  for (let i = 0; i < triples.length; i += 3) {
    rooms.push(makeRoom('triple', triples.slice(i, i + 3).map((g) => g.id)));
  }

  // Quad — treat as extra_bed for now (double + extra)
  for (const g of quads) {
    const withSpace = rooms.find((r) => r.guestIds.length < r.capacity);
    if (withSpace) {
      withSpace.guestIds.push(g.id);
    } else {
      rooms.push(makeRoom('single', [g.id]));
    }
  }

  // Child With Bed → extra bed in an existing room, or new single
  for (const g of childWithBed) {
    const target = rooms.find((r) => r.guestIds.length < r.capacity);
    if (target) {
      target.guestIds.push(g.id);
    } else if (rooms.length > 0) {
      // Add as extra bed to last room (expand capacity by 1)
      const last = rooms[rooms.length - 1];
      last.type = 'extra_bed';
      last.capacity = BED_TYPES['extra_bed'].capacity;
      last.guestIds.push(g.id);
    } else {
      rooms.push(makeRoom('single', [g.id]));
    }
  }

  // No-bed guests → share with first room that exists
  for (const g of noBedGuests) {
    if (rooms.length > 0) {
      rooms[0].sharingGuestIds.push(g.id);
    } else {
      // Edge case: only infants/no-bed children, create a placeholder room
      const r = makeRoom('single', []);
      r.sharingGuestIds.push(g.id);
      rooms.push(r);
    }
  }

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

      onRoomsChange(newRooms);
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

    onRoomsChange(newRooms);
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
                                        ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                                        : 'border-dashed border-border hover:border-primary/30 hover:bg-muted/50',
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                                      isSelected
                                        ? 'bg-primary text-white'
                                        : hasGuest
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
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
                                          ? 'text-emerald-700 dark:text-emerald-400'
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
          <div className="rounded-xl border border-dashed border-purple-300/50 bg-purple-50/30 p-4 dark:border-purple-700/30 dark:bg-purple-950/10">
            <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
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
                      className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2 dark:bg-background/50"
                    >
                      <Baby className="size-4 shrink-0 text-purple-500" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {[guest.firstName, guest.lastName]
                          .filter(Boolean)
                          .join(' ') || 'Unnamed'}
                      </span>
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-1.5 py-0 text-[9px] uppercase text-purple-600"
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
  const assignedGuests = room.guestIds
    .filter((id) => !!id)
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean);
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
      <div className="space-y-1.5">
        {assignedGuests.map((guest) => (
          <div
            key={guest!.id}
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5"
          >
            <UserIcon className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">
              {[guest!.firstName, guest!.lastName].filter(Boolean).join(' ') ||
                'Unnamed guest'}
            </span>
          </div>
        ))}
        {Array.from({
          length: Math.max(0, room.capacity - assignedGuests.length),
        }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground"
          >
            <UserIcon className="size-3.5" />
            Empty slot
          </div>
        ))}
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
                className="flex items-center gap-2 rounded-lg bg-purple-50/50 px-3 py-1.5 dark:bg-purple-950/20"
              >
                <Baby className="size-3.5 text-purple-500" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                  {[guest!.firstName, guest!.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Unnamed guest'}
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto px-1.5 py-0 text-[9px] font-bold uppercase text-purple-600 dark:text-purple-400"
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

  const handleResetToRecommendation = useCallback(() => {
    onRoomsChange(autoRecommendRooms(guests));
  }, [guests, onRoomsChange]);

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
