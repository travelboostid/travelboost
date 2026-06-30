const fs = require('fs');
const file = 'tests/Feature/Companies/Dashboard/BookingIndexControllerTest.php';
let content = fs.readFileSync(file, 'utf8');

const helper = `
function createBookingWithSchedule($count = 1, $attributes = []) {
    $bookings = \\App\\Models\\Booking::factory()->count($count)->create($attributes);
    $collection = $bookings instanceof \\Illuminate\\Database\\Eloquent\\Collection ? $bookings : collect([$bookings]);
    
    foreach ($collection as $booking) {
        \\App\\Models\\TourSchedule::firstOrCreate([
            'tour_id' => $booking->tour_id,
            'departure_date' => $booking->departure_date,
        ], [
            'tour_code' => $booking->tour->code ?? 'CODE',
            'company_id' => $booking->vendor_id,
            'return_date' => \\Carbon\\Carbon::parse($booking->departure_date)->addDays(7)->toDateString(),
            'is_active' => true,
        ]);
    }
    
    return $count === 1 ? $collection->first() : $collection;
}
`;

if (!content.includes('createBookingWithSchedule')) {
    content = content.replace('beforeEach(function () {', helper + '\nbeforeEach(function () {');
}

content = content.replace(/(?<!\\App\\Models\\)Booking::factory\(\)->count\((.*?)\)->create\(([\s\S]*?)\)/g, 'createBookingWithSchedule($1, $2)');
content = content.replace(/(?<!\\App\\Models\\)Booking::factory\(\)->create\(([\s\S]*?)\)/g, 'createBookingWithSchedule(1, $1)');

fs.writeFileSync(file, content);
console.log('Done!');
