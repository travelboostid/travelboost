const fs = require('fs');
const file = 'tests/Feature/Companies/Dashboard/BookingIndexControllerTest.php';
let content = fs.readFileSync(file, 'utf8');

const oldHelperStart = 'function createBookingWithSchedule($count = 1, $attributes = []) {';
const oldHelperEnd = '    return $count === 1 ? $collection->first() : $collection;\n}';

const newHelper = `function createBookingWithSchedule($count = 1, $attributes = []) {
    $bookings = \\App\\Models\\Booking::factory()->count($count)->create($attributes);
    $collection = $bookings instanceof \\Illuminate\\Database\\Eloquent\\Collection ? $bookings : collect([$bookings]);
    
    foreach ($collection as $booking) {
        $schedule = \\App\\Models\\TourSchedule::firstOrCreate([
            'tour_id' => $booking->tour_id,
            'departure_date' => $booking->departure_date,
        ], [
            'tour_code' => $booking->tour->code ?? 'CODE',
            'company_id' => $booking->vendor_id,
            'return_date' => \\Carbon\\Carbon::parse($booking->departure_date)->addDays(7)->toDateString(),
            'is_active' => true,
        ]);
        
        \\App\\Models\\TourAvailability::firstOrCreate([
            'schedule_id' => $schedule->id,
        ], [
            'company_id' => $booking->vendor_id,
            'tour_id' => $booking->tour_id,
            'max_pax' => 50,
            'available' => 50,
        ]);
    }
    
    return $count === 1 ? $collection->first() : $collection;
}`;

let startIndex = content.indexOf(oldHelperStart);
if (startIndex !== -1) {
    let endIndex = content.indexOf(oldHelperEnd, startIndex);
    if (endIndex !== -1) {
        content = content.substring(0, startIndex) + newHelper + content.substring(endIndex + oldHelperEnd.length);
        fs.writeFileSync(file, content);
        console.log('Updated helper successfully!');
    }
} else {
    console.log('Could not find helper function.');
}
