import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { FormattedMessage } from 'react-intl';

type TourTabProps = {
    context: any;
};

export function CreateTourScheduleTab({ context }: TourTabProps) {
    const {
        addRoom,
        addSchedule,
        intl,
        priceCategories,
        processing,
        removeRoom,
        removeSchedule,
        schedules,
        updateRoom,
        updateRoomAdjustment,
        updateSchedule,
    } = context;

    return (
        <TabsContent value="schedule">
            <div className="space-y-4">
                <div className="flex flex-col gap-3 px-4 py-2 md:flex-row md:items-center md:justify-end">
                    <div className="flex items-center gap-3">
                        <Button type="button" onClick={addSchedule} disabled>
                            +{' '}
                            <FormattedMessage defaultMessage="Add New Schedule" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                    {/* LEFT */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="Departure Date" />
                        </span>

                        {/* FROM */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="From" />
                            </span>

                            <input
                                type="date"
                                className="rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>

                        {/* TO */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="To" />
                            </span>

                            <input
                                type="date"
                                className="rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                        <FormattedMessage defaultMessage="Currency:" />
                    </div>
                </div>

                {/* DESKTOP TABLE */}
                <div className="rounded-lg border overflow-hidden hidden md:block">
                    <table className="w-full text-sm">
                        {/* ================= HEADER ================= */}
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 text-left" rowSpan={2}>
                                    <FormattedMessage defaultMessage="Departure" />
                                </th>
                                <th className="p-3 text-left" rowSpan={2}>
                                    <FormattedMessage defaultMessage="Return" />
                                </th>

                                <th className="p-3 text-center" colSpan={4}>
                                    <FormattedMessage defaultMessage="Prices" />
                                </th>

                                <th className="p-3 text-left" rowSpan={2}></th>
                            </tr>

                            <tr className="text-xs text-muted-foreground">
                                <th className="p-2">
                                    <FormattedMessage defaultMessage="Category" />
                                </th>
                                <th className="p-2">
                                    <FormattedMessage defaultMessage="Price" />
                                </th>
                                <th className="p-2">
                                    <FormattedMessage defaultMessage="Promotion" />
                                </th>
                                <th className="p-2">
                                    <FormattedMessage defaultMessage="Commission" />
                                </th>
                            </tr>
                        </thead>
                        {/* ================= BODY ================= */}
                        <tbody>
                            {schedules.map((item, index) => (
                                <tr key={index} className="align-top border-t">
                                    {/* DATE */}
                                    <td className="p-2">
                                        <Input
                                            type="date"
                                            value={item.departure_date}
                                            onChange={(e) =>
                                                updateSchedule(
                                                    index,
                                                    'departure_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </td>

                                    <td className="p-2">
                                        <Input
                                            type="date"
                                            value={item.return_date}
                                            onChange={(e) =>
                                                updateSchedule(
                                                    index,
                                                    'return_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </td>

                                    {/* PRICES */}
                                    <td colSpan={4} className="p-2">
                                        <div className="space-y-3">
                                            {item.prices.map((room, rIndex) => (
                                                <div
                                                    key={rIndex}
                                                    className="grid grid-cols-4 gap-2 items-start p-2 border rounded-md"
                                                >
                                                    {/* ROOM */}
                                                    <select
                                                        className="border rounded px-2 h-9 text-sm w-full"
                                                        value={
                                                            room.room_type_id ??
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            updateRoom(
                                                                index,
                                                                rIndex,
                                                                'room_type_id',
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            {intl.formatMessage(
                                                                {
                                                                    defaultMessage:
                                                                        'Select Category',
                                                                },
                                                            )}
                                                        </option>

                                                        {priceCategories.map(
                                                            (cat) => (
                                                                <option
                                                                    key={cat.id}
                                                                    value={
                                                                        cat.id
                                                                    }
                                                                >
                                                                    {cat.name}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>

                                                    {/* PRICE */}
                                                    <Input
                                                        type="number"
                                                        className="no-spinner"
                                                        placeholder={intl.formatMessage(
                                                            {
                                                                defaultMessage:
                                                                    'Price',
                                                            },
                                                        )}
                                                        value={room.price}
                                                        onChange={(e) =>
                                                            updateRoom(
                                                                index,
                                                                rIndex,
                                                                'price',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />

                                                    {/* PROMOTION */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* PERCENT */}
                                                        <Input
                                                            type="number"
                                                            className="no-spinner"
                                                            placeholder={intl.formatMessage(
                                                                {
                                                                    defaultMessage:
                                                                        '%',
                                                                },
                                                            )}
                                                            value={
                                                                room.promotion
                                                                    .type ===
                                                                'percent'
                                                                    ? room
                                                                          .promotion
                                                                          .value
                                                                    : ''
                                                            }
                                                            disabled={
                                                                room.promotion
                                                                    .type ===
                                                                    'value' &&
                                                                room.promotion
                                                                    .value !==
                                                                    ''
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;

                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'promotion',
                                                                    'type',
                                                                    'percent',
                                                                );
                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'promotion',
                                                                    'value',
                                                                    val,
                                                                );
                                                            }}
                                                        />

                                                        {/* VALUE */}
                                                        <Input
                                                            type="number"
                                                            className="no-spinner"
                                                            placeholder={intl.formatMessage(
                                                                {
                                                                    defaultMessage:
                                                                        'Value',
                                                                },
                                                            )}
                                                            value={
                                                                room.promotion
                                                                    .type ===
                                                                'value'
                                                                    ? room
                                                                          .promotion
                                                                          .value
                                                                    : ''
                                                            }
                                                            disabled={
                                                                room.promotion
                                                                    .type ===
                                                                    'percent' &&
                                                                room.promotion
                                                                    .value !==
                                                                    ''
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;

                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'promotion',
                                                                    'type',
                                                                    'value',
                                                                );
                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'promotion',
                                                                    'value',
                                                                    val,
                                                                );
                                                            }}
                                                        />
                                                    </div>

                                                    {/* COMMISSION */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* PERCENT */}
                                                        <Input
                                                            type="number"
                                                            className="no-spinner"
                                                            placeholder={intl.formatMessage(
                                                                {
                                                                    defaultMessage:
                                                                        '%',
                                                                },
                                                            )}
                                                            value={
                                                                room.commission
                                                                    .type ===
                                                                'percent'
                                                                    ? room
                                                                          .commission
                                                                          .value
                                                                    : ''
                                                            }
                                                            disabled={
                                                                room.commission
                                                                    .type ===
                                                                    'value' &&
                                                                room.commission
                                                                    .value !==
                                                                    ''
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;

                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'commission',
                                                                    'type',
                                                                    'percent',
                                                                );
                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'commission',
                                                                    'value',
                                                                    val,
                                                                );
                                                            }}
                                                        />

                                                        {/* VALUE */}
                                                        <Input
                                                            type="number"
                                                            className="no-spinner"
                                                            placeholder={intl.formatMessage(
                                                                {
                                                                    defaultMessage:
                                                                        'Value',
                                                                },
                                                            )}
                                                            value={
                                                                room.commission
                                                                    .type ===
                                                                'value'
                                                                    ? room
                                                                          .commission
                                                                          .value
                                                                    : ''
                                                            }
                                                            disabled={
                                                                room.commission
                                                                    .type ===
                                                                    'percent' &&
                                                                room.commission
                                                                    .value !==
                                                                    ''
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;

                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'commission',
                                                                    'type',
                                                                    'value',
                                                                );
                                                                updateRoomAdjustment(
                                                                    index,
                                                                    rIndex,
                                                                    'commission',
                                                                    'value',
                                                                    val,
                                                                );
                                                            }}
                                                        />
                                                    </div>

                                                    {/* REMOVE ROOM */}
                                                    <div className="col-span-4 flex justify-end">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-500"
                                                            onClick={() =>
                                                                removeRoom(
                                                                    index,
                                                                    rIndex,
                                                                )
                                                            }
                                                        >
                                                            <FormattedMessage defaultMessage="Delete Room" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* ADD ROOM */}
                                            <div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        addRoom(index)
                                                    }
                                                >
                                                    +{' '}
                                                    <FormattedMessage defaultMessage="Add Room" />
                                                </Button>
                                            </div>
                                        </div>
                                    </td>

                                    {/* ACTION */}
                                    <td className="p-2">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() =>
                                                removeSchedule(index)
                                            }
                                        >
                                            <FormattedMessage defaultMessage="Delete" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE VERSION */}
                <div className="md:hidden space-y-4">
                    {schedules.map((item, index) => (
                        <div
                            key={index}
                            className="border rounded-lg p-3 space-y-3"
                        >
                            {/* HEADER */}
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-sm">
                                    <FormattedMessage
                                        defaultMessage="Schedule #{number}"
                                        values={{
                                            number: index + 1,
                                        }}
                                    />
                                </p>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeSchedule(index)}
                                >
                                    <FormattedMessage defaultMessage="Delete" />
                                </Button>
                            </div>

                            {/* DATES */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        <FormattedMessage defaultMessage="Departure" />
                                    </p>
                                    <Input
                                        type="date"
                                        value={item.departure_date}
                                        onChange={(e) =>
                                            updateSchedule(
                                                index,
                                                'departure_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        <FormattedMessage defaultMessage="Return" />
                                    </p>
                                    <Input
                                        type="date"
                                        value={item.return_date}
                                        onChange={(e) =>
                                            updateSchedule(
                                                index,
                                                'return_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* ROOMS */}
                            <div className="space-y-3">
                                {item.prices.map((room, rIndex) => (
                                    <div
                                        key={rIndex}
                                        className="border rounded-md p-3 space-y-2"
                                    >
                                        {/* ROOM HEADER */}
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                <FormattedMessage
                                                    defaultMessage="Room #{number}"
                                                    values={{
                                                        number: rIndex + 1,
                                                    }}
                                                />
                                            </p>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500"
                                                onClick={() =>
                                                    removeRoom(index, rIndex)
                                                }
                                            >
                                                <FormattedMessage defaultMessage="Delete Room" />
                                            </Button>
                                        </div>

                                        {/* ROOM TYPE */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="Category" />
                                            </p>

                                            <select
                                                className="w-full border rounded-md px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                                value={room.room_type_id ?? ''}
                                                onChange={(e) =>
                                                    updateRoom(
                                                        index,
                                                        rIndex,
                                                        'room_type_id',
                                                        Number(e.target.value),
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    {intl.formatMessage({
                                                        defaultMessage:
                                                            'Select Category',
                                                    })}
                                                </option>

                                                {priceCategories.map((cat) => (
                                                    <option
                                                        key={cat.id}
                                                        value={cat.id}
                                                    >
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* PRICE */}
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="Price" />
                                            </p>
                                            <Input
                                                type="number"
                                                placeholder={intl.formatMessage(
                                                    {
                                                        defaultMessage: 'Price',
                                                    },
                                                )}
                                                value={room.price}
                                                onChange={(e) =>
                                                    updateRoom(
                                                        index,
                                                        rIndex,
                                                        'price',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        {/* PROMOTION */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="Promotion" />
                                            </p>

                                            <div className="grid grid-cols-2 gap-2">
                                                {/* % */}
                                                <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder={intl.formatMessage(
                                                        {
                                                            defaultMessage: '%',
                                                        },
                                                    )}
                                                    value={
                                                        room.promotion.type ===
                                                        'percent'
                                                            ? room.promotion
                                                                  .value
                                                            : ''
                                                    }
                                                    disabled={
                                                        room.promotion.type ===
                                                            'value' &&
                                                        room.promotion.value !==
                                                            ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;

                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'promotion',
                                                            'type',
                                                            'percent',
                                                        );
                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'promotion',
                                                            'value',
                                                            val,
                                                        );
                                                    }}
                                                />

                                                {/* VALUE */}
                                                <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder={intl.formatMessage(
                                                        {
                                                            defaultMessage:
                                                                'Value',
                                                        },
                                                    )}
                                                    value={
                                                        room.promotion.type ===
                                                        'value'
                                                            ? room.promotion
                                                                  .value
                                                            : ''
                                                    }
                                                    disabled={
                                                        room.promotion.type ===
                                                            'percent' &&
                                                        room.promotion.value !==
                                                            ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;

                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'promotion',
                                                            'type',
                                                            'value',
                                                        );
                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'promotion',
                                                            'value',
                                                            val,
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* COMMISSION */}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="Commission" />
                                            </p>

                                            <div className="grid grid-cols-2 gap-2">
                                                {/* % */}
                                                <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder={intl.formatMessage(
                                                        {
                                                            defaultMessage: '%',
                                                        },
                                                    )}
                                                    value={
                                                        room.commission.type ===
                                                        'percent'
                                                            ? room.commission
                                                                  .value
                                                            : ''
                                                    }
                                                    disabled={
                                                        room.commission.type ===
                                                            'value' &&
                                                        room.commission
                                                            .value !== ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;

                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'commission',
                                                            'type',
                                                            'percent',
                                                        );
                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'commission',
                                                            'value',
                                                            val,
                                                        );
                                                    }}
                                                />

                                                {/* VALUE */}
                                                <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder={intl.formatMessage(
                                                        {
                                                            defaultMessage:
                                                                'Value',
                                                        },
                                                    )}
                                                    value={
                                                        room.commission.type ===
                                                        'value'
                                                            ? room.commission
                                                                  .value
                                                            : ''
                                                    }
                                                    disabled={
                                                        room.commission.type ===
                                                            'percent' &&
                                                        room.commission
                                                            .value !== ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;

                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'commission',
                                                            'type',
                                                            'value',
                                                        );
                                                        updateRoomAdjustment(
                                                            index,
                                                            rIndex,
                                                            'commission',
                                                            'value',
                                                            val,
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* ADD ROOM */}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addRoom(index)}
                                    className="w-full"
                                >
                                    +{' '}
                                    <FormattedMessage defaultMessage="Add Room" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-start pt-6 border-t">
                <Button
                    type="submit"
                    disabled={processing || schedules.length === 0}
                >
                    <FormattedMessage defaultMessage="Save Schedule" />
                </Button>
            </div>
        </TabsContent>
    );
}
