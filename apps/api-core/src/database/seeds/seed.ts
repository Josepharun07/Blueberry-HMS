import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../../app.module';
import { Room, RoomType } from '../../modules/rooms/entities/room.entity';
import { User } from '../../modules/user/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value.trim();
}

async function seed() {
  if (process.env.SEED_ENABLED !== 'true') {
    console.log('SEED_ENABLED is not true. Nothing was written.');
    return;
  }
  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error('Refusing to seed production. Set SEED_ALLOW_PRODUCTION=true to override.');
  }

  const email = required('SEED_ADMIN_EMAIL');
  const password = required('SEED_ADMIN_PASSWORD');
  const firstName = required('SEED_ADMIN_FIRST_NAME');
  const lastName = required('SEED_ADMIN_LAST_NAME');
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const roomRepo = app.get(getRepositoryToken(Room));
  const userRepo = app.get(getRepositoryToken(User));

  const existingAdmin = await userRepo.findOne({ where: { email } });
  if (!existingAdmin) {
    const user = userRepo.create({
      email,
      password: await bcrypt.hash(password, 12),
      firstName,
      lastName,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    });
    await userRepo.save(user);
    console.log('Admin account created');
  } else {
    console.log('Admin account already exists');
  }

  if ((await roomRepo.count()) === 0) {
    const rooms = [
      { roomNumber: '101', floor: 1, type: RoomType.STANDARD, basePrice: '3500.00', maxOccupancy: 2 },
      { roomNumber: '102', floor: 1, type: RoomType.STANDARD, basePrice: '3500.00', maxOccupancy: 2 },
      { roomNumber: '201', floor: 2, type: RoomType.DELUXE, basePrice: '5500.00', maxOccupancy: 3 },
      { roomNumber: '202', floor: 2, type: RoomType.DELUXE, basePrice: '5500.00', maxOccupancy: 3 },
      { roomNumber: '301', floor: 3, type: RoomType.SUITE, basePrice: '8500.00', maxOccupancy: 4 },
      { roomNumber: '302', floor: 3, type: RoomType.FAMILY, basePrice: '7500.00', maxOccupancy: 5 },
    ];
    for (const roomData of rooms) {
      await roomRepo.save(roomRepo.create(roomData));
    }
    console.log('Room inventory created');
  }

  await app.close();
}

seed().catch((error) => {
  console.error('Seeding failed');
  console.error(error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});
