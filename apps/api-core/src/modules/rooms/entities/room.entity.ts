import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
}

export enum RoomType {
  STANDARD = 'STANDARD',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  FAMILY = 'FAMILY',
  PRESIDENTIAL = 'PRESIDENTIAL',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  roomNumber: string;

  @Column()
  floor: number;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.STANDARD,
  })
  type: RoomType;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: string;

  @Column({ default: 2 })
  maxOccupancy: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  amenities: string[]; // ['WiFi', 'TV', 'AC', 'Mini Bar']

  @Column({ nullable: true })
  viewType: string; // 'Garden', 'Mountain', 'Pool'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
