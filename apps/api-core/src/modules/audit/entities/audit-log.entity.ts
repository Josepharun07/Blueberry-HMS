import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  entity: string;

  @Column({ name: 'entity_id', type: 'varchar', nullable: true })
  entityId: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before: any;

  @Column({ type: 'jsonb', nullable: true })
  after: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
