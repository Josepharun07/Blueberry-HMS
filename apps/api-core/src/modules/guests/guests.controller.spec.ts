import { UnauthorizedException } from '@nestjs/common';
import { GuestsController } from './guests.controller';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { SearchGuestDto } from './dto/search-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';

describe('GuestsController', () => {
  let controller: GuestsController;
  let guestsService: {
    create: jest.Mock;
    search: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    guestsService = {
      create: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
    };
    controller = new GuestsController(
      guestsService as unknown as GuestsService,
    );
  });

  it('passes req.user.id and rejects a missing id', async () => {
    const legacyUser = { user: { userId: 'legacy-id' } } as never;

    expect(() =>
      controller.search({ query: 'ada' } as SearchGuestDto, legacyUser),
    ).toThrow(UnauthorizedException);
    expect(() => controller.create({} as CreateGuestDto, legacyUser)).toThrow(
      UnauthorizedException,
    );
    expect(() =>
      controller.update('guest-1', {} as UpdateGuestDto, { user: {} }),
    ).toThrow(UnauthorizedException);
    expect(() => controller.create({} as CreateGuestDto, {})).toThrow(
      UnauthorizedException,
    );

    expect(guestsService.search).not.toHaveBeenCalled();
    expect(guestsService.create).not.toHaveBeenCalled();
    expect(guestsService.update).not.toHaveBeenCalled();

    await controller.search({ query: 'ada' } as SearchGuestDto, {
      user: { id: 'user-1' },
    });
    await controller.create({} as CreateGuestDto, { user: { id: 'user-1' } });
    await controller.update('guest-1', {} as UpdateGuestDto, {
      user: { id: 'user-1' },
    });

    expect(guestsService.search).toHaveBeenCalledWith('ada', 'user-1');
    expect(guestsService.create).toHaveBeenCalledWith({}, 'user-1');
    expect(guestsService.update).toHaveBeenCalledWith('guest-1', {}, 'user-1');
  });
});
