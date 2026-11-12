import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, ILike, Repository } from 'typeorm';
import { Guest } from './entities/guest.entity';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CustomLoggerService } from '../../common/logging/logger.service';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private guestRepository: Repository<Guest>,
    private logger: CustomLoggerService,
  ) {}

  async create(createGuestDto: CreateGuestDto, userId: string): Promise<Guest> {
    const guest = this.guestRepository.create(createGuestDto);
    const saved = await this.guestRepository.save(guest);

    this.logger.log(`Guest ${saved.id} created`, 'GuestsService');
    this.logger.audit('GUEST_CREATED', userId, {
      guestId: saved.id,
    });

    return saved;
  }

  async findAll(): Promise<Guest[]> {
    const guests = await this.guestRepository.find({
      order: { createdAt: 'DESC' },
    });
    return guests.map((guest) => this.withoutDocumentNumber(guest));
  }

  async search(query: string, userId: string): Promise<Guest[]> {
    const term = typeof query === 'string' ? query.trim() : '';
    if (term.length < 2 || term.length > 80) {
      throw new BadRequestException(
        'Search query must be between 2 and 80 characters',
      );
    }

    const pattern = this.toContainsPattern(term);
    const guests = await this.guestRepository
      .createQueryBuilder('guest')
      .where(
        new Brackets((qb) => {
          qb.where({ firstName: ILike(pattern) })
            .orWhere({ lastName: ILike(pattern) })
            .orWhere({ email: ILike(pattern) })
            .orWhere({ phone: ILike(pattern) });
        }),
      )
      .orderBy('guest.createdAt', 'DESC')
      .take(20)
      .getMany();

    this.logger.log(
      `Guest search by user ${userId} returned ${guests.length} results`,
      'GuestsService',
    );
    this.logger.audit('GUEST_SEARCH', userId, {
      resultCount: guests.length,
    });

    return guests.map((guest) => this.withoutDocumentNumber(guest));
  }

  async findOne(id: string): Promise<Guest> {
    const guest = await this.guestRepository.findOne({ where: { id } });
    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }
    return guest;
  }

  async update(
    id: string,
    updateGuestDto: UpdateGuestDto,
    userId: string,
  ): Promise<Guest> {
    const guest = await this.findOne(id);
    Object.assign(guest, updateGuestDto);
    const updated = await this.guestRepository.save(guest);

    this.logger.audit('GUEST_UPDATED', userId, {
      guestId: id,
    });

    return updated;
  }

  async remove(id: string): Promise<void> {
    const guest = await this.findOne(id);
    await this.guestRepository.remove(guest);
    this.logger.log(`Guest ${id} deleted`, 'GuestsService');
  }

  /** Lists and search results omit the identity document number. A single guest record still includes it. */
  private withoutDocumentNumber(guest: Guest): Guest {
    const copy = { ...guest } as { idNumber?: string };
    delete copy.idNumber;
    return copy as Guest;
  }

  /** LIKE metacharacters stay literal inside the bound ILike parameter. */
  private toContainsPattern(term: string): string {
    const escaped = term.replace(/[\\%_]/g, (char) => `\\${char}`);
    return `%${escaped}%`;
  }
}
