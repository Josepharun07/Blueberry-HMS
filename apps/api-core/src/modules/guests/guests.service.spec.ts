import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Brackets, FindOperator } from 'typeorm';
import { SearchGuestDto } from './dto/search-guest.dto';
import { CreateGuestDto } from './dto/create-guest.dto';
import { Guest } from './entities/guest.entity';
import { GuestsService } from './guests.service';

describe('GuestsService', () => {
  let service: GuestsService;
  let guestRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    where: jest.Mock;
    orWhere: jest.Mock;
    orderBy: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
  };
  let logger: { log: jest.Mock; audit: jest.Mock };

  const guest = (overrides: Partial<Guest> = {}): Guest =>
    ({
      id: 'guest-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+15551212',
      address: '12 Analytical Engine Road',
      city: 'London',
      country: 'UK',
      idType: 'passport',
      idNumber: 'P-1234567',
      notes: 'Allergic to feather pillows',
      createdAt: new Date('2026-01-02T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
      ...overrides,
    }) as Guest;

  beforeEach(() => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    guestRepository = {
      create: jest.fn((dto: CreateGuestDto) => ({ ...dto })),
      save: jest.fn(async (entity: Guest) => ({ ...entity, id: 'guest-1' })),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    logger = {
      log: jest.fn(),
      audit: jest.fn(),
    };
    service = new GuestsService(guestRepository as never, logger as never);
  });

  function loggedText(): string {
    return (
      JSON.stringify(logger.log.mock.calls) +
      JSON.stringify(logger.audit.mock.calls)
    );
  }

  function searchClauses(): Record<string, FindOperator<string>>[] {
    const brackets = queryBuilder.where.mock.calls[0][0] as Brackets;
    expect(brackets).toBeInstanceOf(Brackets);

    const inner = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
    };
    brackets.whereFactory(inner as never);

    return [...inner.where.mock.calls, ...inner.orWhere.mock.calls].map(
      (call) => {
        expect(typeof call[0]).toBe('object');
        return call[0] as Record<string, FindOperator<string>>;
      },
    );
  }

  it('rejects an empty or short query before touching the database', async () => {
    await expect(service.search('', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.search('   ', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.search('  a  ', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.search('x', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.search(null as unknown as string, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    const rejected = await service.search('  z  ', 'user-1').then(
      () => null,
      (error: unknown) => error,
    );
    expect(rejected).toBeInstanceOf(BadRequestException);
    const badRequest = rejected as BadRequestException;
    expect(badRequest.message).toBe(
      'Search query must be between 2 and 80 characters',
    );
    expect(badRequest.message).not.toContain('z');
    expect(JSON.stringify(badRequest.getResponse())).not.toContain('z');

    expect(guestRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.audit).not.toHaveBeenCalled();
  });

  it('rejects a query longer than 80 characters without echoing it', async () => {
    const raw = `secret-query-${'a'.repeat(80)}`;
    const rejected = await service.search(raw, 'user-1').then(
      () => null,
      (error: unknown) => error,
    );

    expect(rejected).toBeInstanceOf(BadRequestException);
    const badRequest = rejected as BadRequestException;
    expect(badRequest.message).not.toContain('secret-query');
    expect(JSON.stringify(badRequest.getResponse())).not.toContain(
      'secret-query',
    );
    expect(guestRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('searches name, email, and phone with a bound case-insensitive contains pattern', async () => {
    const found = guest();
    queryBuilder.getMany.mockResolvedValue([found]);

    const results = await service.search("  O'Brien % _ \\  ", 'user-1');

    const { idNumber: _hidden, ...listed } = found;
    expect(results).toEqual([listed]);
    expect(JSON.stringify(results)).not.toContain('P-1234567');
    expect(guestRepository.createQueryBuilder).toHaveBeenCalledWith('guest');
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'guest.createdAt',
      'DESC',
    );
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(queryBuilder.take.mock.invocationCallOrder[0]).toBeLessThan(
      queryBuilder.getMany.mock.invocationCallOrder[0],
    );

    const clauses = searchClauses();
    expect(clauses).toHaveLength(4);
    expect(clauses.map((clause) => Object.keys(clause)[0])).toEqual([
      'firstName',
      'lastName',
      'email',
      'phone',
    ]);

    for (const clause of clauses) {
      const operator = Object.values(clause)[0];
      expect(operator).toBeInstanceOf(FindOperator);
      expect(operator.type).toBe('ilike');
      expect(operator.useParameter).toBe(true);
      expect(operator.value).toBe("%O'Brien \\% \\_ \\\\%");
      expect(JSON.stringify(clause)).not.toContain('ILIKE');
    }

    expect(loggedText()).toContain('user-1');
    expect(loggedText()).toContain('1');
    expect(logger.log).toHaveBeenCalledWith(
      'Guest search by user user-1 returned 1 results',
      'GuestsService',
    );
    expect(logger.audit).toHaveBeenCalledWith('GUEST_SEARCH', 'user-1', {
      resultCount: 1,
    });
    expect(loggedText()).not.toContain("O'Brien");
    expect(loggedText()).not.toContain('Ada');
    expect(loggedText()).not.toContain('Lovelace');
    expect(loggedText()).not.toContain('ada@example.com');
    expect(loggedText()).not.toContain('+15551212');
    expect(loggedText()).not.toContain('Analytical');
    expect(loggedText()).not.toContain('P-1234567');
    expect(loggedText()).not.toContain('feather');
    expect(loggedText()).not.toContain('guest-1');
  });

  it('logs only the guest id when creating or updating', async () => {
    await service.create(
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+15551212',
        address: '12 Analytical Engine Road',
        idNumber: 'P-1234567',
      },
      'user-1',
    );

    expect(logger.audit).toHaveBeenCalledWith('GUEST_CREATED', 'user-1', {
      guestId: 'guest-1',
    });
    expect(loggedText()).not.toContain('Ada');
    expect(loggedText()).not.toContain('ada@example.com');
    expect(loggedText()).not.toContain('+15551212');
    expect(loggedText()).not.toContain('P-1234567');

    logger.log.mockClear();
    logger.audit.mockClear();
    guestRepository.findOne.mockResolvedValue(guest());

    await service.update(
      'guest-1',
      {
        email: 'new-secret@example.com',
        phone: '9998887777',
        address: 'New secret address',
        idNumber: 'N-999',
      },
      'user-1',
    );

    expect(logger.audit).toHaveBeenCalledWith('GUEST_UPDATED', 'user-1', {
      guestId: 'guest-1',
    });
    expect(loggedText()).not.toContain('new-secret@example.com');
    expect(loggedText()).not.toContain('9998887777');
    expect(loggedText()).not.toContain('New secret address');
    expect(loggedText()).not.toContain('N-999');
    expect(loggedText()).not.toContain('Ada');
  });
});

describe('SearchGuestDto', () => {
  async function errorsFor(query: unknown) {
    const dto = plainToInstance(SearchGuestDto, { query });
    return validate(dto);
  }

  it('trims and accepts a query of 2 to 80 characters', async () => {
    const dto = plainToInstance(SearchGuestDto, { query: '  ab  ' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.query).toBe('ab');

    const max = 'a'.repeat(80);
    const maxDto = plainToInstance(SearchGuestDto, { query: `  ${max}  ` });
    expect(await validate(maxDto)).toHaveLength(0);
    expect(maxDto.query).toBe(max);
  });

  it('rejects an empty, short, overlong, or non-string query', async () => {
    expect(await errorsFor('')).not.toHaveLength(0);
    expect(await errorsFor('   ')).not.toHaveLength(0);
    expect(await errorsFor(' a ')).not.toHaveLength(0);
    expect(await errorsFor('a'.repeat(81))).not.toHaveLength(0);
    expect(await errorsFor(12)).not.toHaveLength(0);
    expect(await errorsFor(undefined)).not.toHaveLength(0);
  });
});
