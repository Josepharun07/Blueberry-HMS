import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room, RoomType, RoomStatus } from '../../modules/rooms/entities/room.entity';
import { Guest } from '../../modules/guests/entities/guest.entity';
import { Booking, BookingStatus, PaymentStatus } from '../../modules/bookings/entities/booking.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const roomRepo = app.get(getRepositoryToken(Room));
  const guestRepo = app.get(getRepositoryToken(Guest));
  const bookingRepo = app.get(getRepositoryToken(Booking));

  console.log('🌱 Seeding database...\n');

  // Check existing data
  const existingRooms = await roomRepo.count();
  const existingGuests = await guestRepo.count();
  const existingBookings = await bookingRepo.count();

  console.log(`📊 Current data: ${existingRooms} rooms, ${existingGuests} guests, ${existingBookings} bookings\n`);

  // Skip if data exists
  let createdRooms: Room[] = [];
  let createdGuests: Guest[] = [];

  if (existingRooms === 0) {
    console.log('📦 Creating rooms...');
    const rooms = [
      { roomNumber: '101', floor: 1, type: RoomType.STANDARD, basePrice: 3500, maxOccupancy: 2, description: 'Cozy standard room with garden view', amenities: ['WiFi', 'TV', 'AC'], viewType: 'Garden' },
      { roomNumber: '102', floor: 1, type: RoomType.STANDARD, basePrice: 3500, maxOccupancy: 2, description: 'Standard room with mountain view', amenities: ['WiFi', 'TV', 'AC'], viewType: 'Mountain' },
      { roomNumber: '201', floor: 2, type: RoomType.DELUXE, basePrice: 5500, maxOccupancy: 3, description: 'Spacious deluxe room with balcony', amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'], viewType: 'Mountain' },
      { roomNumber: '202', floor: 2, type: RoomType.DELUXE, basePrice: 5500, maxOccupancy: 3, description: 'Deluxe room with tea estate view', amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'], viewType: 'Tea Estate' },
      { roomNumber: '301', floor: 3, type: RoomType.SUITE, basePrice: 8500, maxOccupancy: 4, description: 'Luxury suite with panoramic views', amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Jacuzzi'], viewType: 'Panoramic' },
      { roomNumber: '302', floor: 3, type: RoomType.FAMILY, basePrice: 7500, maxOccupancy: 5, description: 'Family room with two bedrooms', amenities: ['WiFi', 'TV', 'AC', 'Kitchenette'], viewType: 'Garden' },
    ];

    for (const roomData of rooms) {
      const room = roomRepo.create(roomData);
      const saved = await roomRepo.save(room);
      createdRooms.push(saved);
      console.log(`  ✅ Room ${saved.roomNumber} created`);
    }
  } else {
    console.log('⏩ Rooms already exist, skipping...');
    createdRooms = await roomRepo.find();
  }

  if (existingGuests === 0) {
    console.log('\n👥 Creating guests...');
    const guests = [
      { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.kumar@email.com', phone: '+919876543210', address: 'MG Road', city: 'Bangalore', country: 'India' },
      { firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@email.com', phone: '+919876543211', address: 'Anna Nagar', city: 'Chennai', country: 'India' },
      { firstName: 'John', lastName: 'Doe', email: 'john.doe@email.com', phone: '+919876543212', address: '123 Main St', city: 'Mumbai', country: 'India' },
    ];

    for (const guestData of guests) {
      const guest = guestRepo.create(guestData);
      const saved = await guestRepo.save(guest);
      createdGuests.push(saved);
      console.log(`  ✅ Guest ${saved.firstName} ${saved.lastName} created`);
    }
  } else {
    console.log('⏩ Guests already exist, skipping...');
    createdGuests = await guestRepo.find();
  }

  if (existingBookings === 0) {
    console.log('\n📅 Creating bookings...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const bookings = [
      {
        guestId: createdGuests[0].id,
        roomId: createdRooms[0].id,
        checkInDate: today,
        checkOutDate: tomorrow,
        numberOfNights: 1,
        roomRate: 3500,
        totalAmount: 3500,
        status: BookingStatus.CHECKED_IN,
        paymentStatus: PaymentStatus.PAID,
        numberOfGuests: 2,
        bookingSource: 'website',
        confirmationNumber: 'BH' + Date.now(),
      },
      {
        guestId: createdGuests[1].id,
        roomId: createdRooms[2].id,
        checkInDate: tomorrow,
        checkOutDate: nextWeek,
        numberOfNights: 6,
        roomRate: 5500,
        totalAmount: 33000,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PARTIAL,
        paidAmount: 10000,
        numberOfGuests: 2,
        bookingSource: 'phone',
        confirmationNumber: 'BH' + (Date.now() + 1),
      },
    ];

    for (const bookingData of bookings) {
      const booking = bookingRepo.create(bookingData);
      const saved = await bookingRepo.save(booking);
      console.log(`  ✅ Booking ${saved.confirmationNumber} created`);
    }
  } else {
    console.log('⏩ Bookings already exist, skipping...');
  }

  console.log('\n✅ Seeding complete!\n');
  console.log('📊 Final Summary:');
  console.log(`   - ${await roomRepo.count()} rooms`);
  console.log(`   - ${await guestRepo.count()} guests`);
  console.log(`   - ${await bookingRepo.count()} bookings`);

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
