import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CustomLoggerService } from '../../common/logging/logger.service';
import {
  decimalToPaise,
  MoneyError,
  paiseToRupeeString,
  rupeesToPaise,
} from '../../common/money/money';

/**
 * Manual housekeeping transitions. OCCUPIED is intentionally absent:
 * only check-in may occupy a room, and only checkout may release one.
 * Both of those paths write the room row directly and do not call this service.
 */
const MANUAL_STATUS_TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> = {
  [RoomStatus.AVAILABLE]: [
    RoomStatus.CLEANING,
    RoomStatus.MAINTENANCE,
    RoomStatus.OUT_OF_ORDER,
  ],
  [RoomStatus.CLEANING]: [
    RoomStatus.AVAILABLE,
    RoomStatus.MAINTENANCE,
    RoomStatus.OUT_OF_ORDER,
  ],
  [RoomStatus.MAINTENANCE]: [
    RoomStatus.AVAILABLE,
    RoomStatus.OUT_OF_ORDER,
    RoomStatus.CLEANING,
  ],
  [RoomStatus.OUT_OF_ORDER]: [
    RoomStatus.MAINTENANCE,
    RoomStatus.AVAILABLE,
    RoomStatus.CLEANING,
  ],
  [RoomStatus.OCCUPIED]: [],
};

/** Free-text room fields are omitted; they can contain guest information. */
const AUDIT_SAFE_UPDATE_FIELDS = [
  'roomNumber',
  'floor',
  'type',
  'maxOccupancy',
  'viewType',
  'isActive',
] as const;

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private logger: CustomLoggerService,
  ) {}

  async create(createRoomDto: CreateRoomDto, userId: string): Promise<Room> {
    this.logger.log(`Creating room: ${createRoomDto.roomNumber}`, 'RoomsService');

    const existing = await this.roomRepository.findOne({
      where: { roomNumber: createRoomDto.roomNumber },
    });

    if (existing) {
      throw new ConflictException(`Room ${createRoomDto.roomNumber} already exists`);
    }

    if (createRoomDto.status === RoomStatus.OCCUPIED) {
      throw new ConflictException('A room cannot be created as OCCUPIED');
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      basePrice: this.normalizeRackRate(createRoomDto.basePrice),
    });
    const saved = await this.roomRepository.save(room);

    this.logger.audit('ROOM_CREATED', userId, {
      roomId: saved.id,
      roomNumber: saved.roomNumber,
      type: saved.type,
      basePrice: saved.basePrice,
    });

    return saved;
  }

  async findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      where: { isActive: true },
      order: { roomNumber: 'ASC' },
    });
  }

  async findAvailable(): Promise<Room[]> {
    return this.roomRepository.find({
      where: {
        status: RoomStatus.AVAILABLE,
        isActive: true,
      },
      order: { roomNumber: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto, userId: string): Promise<Room> {
    const room = await this.findOne(id);
    const oldStatus = room.status;
    const oldBasePrice = room.basePrice;

    if (updateRoomDto.status !== undefined) {
      this.assertManualStatusChange(room.status, updateRoomDto.status);
    }

    const next: UpdateRoomDto = {
      ...updateRoomDto,
      ...(updateRoomDto.basePrice !== undefined
        ? { basePrice: this.normalizeRackRate(updateRoomDto.basePrice) }
        : {}),
    };
    Object.assign(room, next);
    const updated = await this.roomRepository.save(room);

    this.auditRoomUpdate(userId, updated, oldStatus, oldBasePrice, updateRoomDto);

    return updated;
  }

  async updateStatus(id: string, status: RoomStatus, userId: string): Promise<Room> {
    this.assertKnownRoomStatus(status);

    const room = await this.findOne(id);
    if (room.status === status) {
      return room;
    }

    this.assertManualStatusChange(room.status, status);

    const oldStatus = room.status;
    room.status = status;
    const updated = await this.roomRepository.save(room);

    this.logger.audit('ROOM_STATUS_CHANGED', userId, {
      roomId: updated.id,
      roomNumber: updated.roomNumber,
      oldStatus,
      newStatus: updated.status,
    });

    this.logger.log(
      `Room ${updated.roomNumber} status changed: ${oldStatus} → ${status}`,
      'RoomsService',
    );

    return updated;
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    room.isActive = false;
    await this.roomRepository.save(room);
    this.logger.log(`Room ${id} deactivated`, 'RoomsService');
  }

  private assertKnownRoomStatus(status: RoomStatus): void {
    const known = Object.values(RoomStatus) as string[];
    if (typeof status !== 'string' || !known.includes(status)) {
      throw new BadRequestException(`Unknown room status: ${String(status)}`);
    }
  }

  private assertManualStatusChange(current: RoomStatus, next: RoomStatus): void {
    this.assertKnownRoomStatus(next);

    if (current === next) {
      return;
    }

    if (next === RoomStatus.OCCUPIED) {
      throw new ConflictException(
        'Cannot set room status to OCCUPIED manually. Only check-in may occupy a room.',
      );
    }

    if (current === RoomStatus.OCCUPIED) {
      throw new ConflictException(
        'Cannot change an OCCUPIED room manually. Checkout releases the room.',
      );
    }

    const allowed = MANUAL_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new ConflictException(`Cannot change room status from ${current} to ${next}`);
    }
  }

  private auditRoomUpdate(
    userId: string,
    updated: Room,
    oldStatus: RoomStatus,
    oldBasePrice: string,
    updateRoomDto: UpdateRoomDto,
  ): void {
    if (updateRoomDto.status !== undefined && updated.status !== oldStatus) {
      this.logger.audit('ROOM_STATUS_CHANGED', userId, {
        roomId: updated.id,
        roomNumber: updated.roomNumber,
        oldStatus,
        newStatus: updated.status,
      });
    }

    if (
      updateRoomDto.basePrice !== undefined &&
      decimalToPaise(String(oldBasePrice)) !== decimalToPaise(String(updated.basePrice))
    ) {
      this.logger.audit('ROOM_PRICE_CHANGED', userId, {
        roomId: updated.id,
        oldBasePrice,
        newBasePrice: updated.basePrice,
      });
    }

    const changes: Record<string, unknown> = {};
    for (const field of AUDIT_SAFE_UPDATE_FIELDS) {
      if (updateRoomDto[field] !== undefined) {
        changes[field] = updateRoomDto[field];
      }
    }

    this.logger.audit('ROOM_UPDATED', userId, {
      roomId: updated.id,
      roomNumber: updated.roomNumber,
      ...(Object.keys(changes).length > 0 ? { changes } : {}),
    });
  }

  private normalizeRackRate(value: string): string {
    try {
      return paiseToRupeeString(rupeesToPaise(value));
    } catch (error) {
      if (error instanceof MoneyError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
