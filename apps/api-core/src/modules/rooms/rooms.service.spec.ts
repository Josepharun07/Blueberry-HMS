import { BadRequestException, ConflictException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room, RoomStatus, RoomType } from './entities/room.entity';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomRepository: { findOne: jest.Mock; save: jest.Mock };
  let logger: { audit: jest.Mock; log: jest.Mock };

  const room = (status: RoomStatus, overrides: Partial<Room> = {}): Room =>
    ({
      id: 'room-1',
      roomNumber: '101',
      floor: 1,
      type: RoomType.STANDARD,
      status,
      basePrice: '3500.00',
      maxOccupancy: 2,
      description: 'Guest prefers extra pillows',
      amenities: ['late checkout'],
      viewType: 'Garden',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    }) as Room;

  beforeEach(() => {
    roomRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (entity: Room) => entity),
    };
    logger = {
      audit: jest.fn(),
      log: jest.fn(),
    };
    service = new RoomsService(roomRepository as never, logger as never);
  });

  it('rejects leaving OCCUPIED', async () => {
    roomRepository.findOne.mockResolvedValue(room(RoomStatus.OCCUPIED));

    await expect(
      service.updateStatus('room-1', RoomStatus.AVAILABLE, 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.updateStatus('room-1', RoomStatus.CLEANING, 'user-1'),
    ).rejects.toThrow(/OCCUPIED/);

    expect(roomRepository.save).not.toHaveBeenCalled();
    expect(logger.audit).not.toHaveBeenCalled();
  });

  it('rejects setting OCCUPIED', async () => {
    roomRepository.findOne.mockResolvedValue(room(RoomStatus.AVAILABLE));

    await expect(
      service.updateStatus('room-1', RoomStatus.OCCUPIED, 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.updateStatus('room-1', RoomStatus.OCCUPIED, 'user-1'),
    ).rejects.toThrow(/check-in/i);

    expect(roomRepository.save).not.toHaveBeenCalled();
    expect(logger.audit).not.toHaveBeenCalled();
  });

  it('allows CLEANING -> AVAILABLE', async () => {
    roomRepository.findOne.mockResolvedValue(room(RoomStatus.CLEANING));

    const updated = await service.updateStatus('room-1', RoomStatus.AVAILABLE, 'user-1');

    expect(updated.status).toBe(RoomStatus.AVAILABLE);
    expect(roomRepository.save).toHaveBeenCalledTimes(1);
    expect(logger.audit).toHaveBeenCalledWith('ROOM_STATUS_CHANGED', 'user-1', {
      roomId: 'room-1',
      roomNumber: '101',
      oldStatus: RoomStatus.CLEANING,
      newStatus: RoomStatus.AVAILABLE,
    });
    expect(JSON.stringify(logger.audit.mock.calls)).not.toContain('Guest prefers');
    expect(JSON.stringify(logger.audit.mock.calls)).not.toContain('late checkout');
  });

  it('treats the same status as a no-op', async () => {
    const existing = room(RoomStatus.CLEANING);
    roomRepository.findOne.mockResolvedValue(existing);

    const result = await service.updateStatus('room-1', RoomStatus.CLEANING, 'user-1');

    expect(result).toBe(existing);
    expect(result.status).toBe(RoomStatus.CLEANING);
    expect(roomRepository.save).not.toHaveBeenCalled();
    expect(logger.audit).not.toHaveBeenCalled();
  });

  it('rejects an unknown status', async () => {
    await expect(
      service.updateStatus('room-1', 'DIRTY' as RoomStatus, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(roomRepository.findOne).not.toHaveBeenCalled();
    expect(roomRepository.save).not.toHaveBeenCalled();
  });

  it('audits a base price change without guest text or the full dto', async () => {
    roomRepository.findOne.mockResolvedValue(
      room(RoomStatus.AVAILABLE, { basePrice: '3500.00' }),
    );

    const updated = await service.update(
      'room-1',
      {
        basePrice: '4000.00',
        description: 'Guest prefers extra pillows',
        amenities: ['late checkout'],
      },
      'user-1',
    );

    expect(updated.basePrice).toBe('4000.00');
    expect(logger.audit).toHaveBeenCalledWith('ROOM_PRICE_CHANGED', 'user-1', {
      roomId: 'room-1',
      oldBasePrice: '3500.00',
      newBasePrice: '4000.00',
    });

    const serialized = JSON.stringify(logger.audit.mock.calls);
    expect(serialized).not.toContain('Guest prefers');
    expect(serialized).not.toContain('late checkout');
    expect(serialized).not.toContain('description');
    expect(serialized).not.toContain('amenities');
    expect(serialized).not.toContain('notes');
  });

  it('rejects setting OCCUPIED through the general room update', async () => {
    roomRepository.findOne.mockResolvedValue(room(RoomStatus.CLEANING));

    await expect(
      service.update('room-1', { status: RoomStatus.OCCUPIED }, 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(roomRepository.save).not.toHaveBeenCalled();
  });
});
