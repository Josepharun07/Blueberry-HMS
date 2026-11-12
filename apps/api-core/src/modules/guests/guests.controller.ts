import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { SearchGuestDto } from './dto/search-guest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

interface AuthenticatedRequest {
  user?: {
    id?: string;
  };
}

@Controller('guests')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.FRONT_DESK)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  create(
    @Body() createGuestDto: CreateGuestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.guestsService.create(createGuestDto, this.requireUserId(req));
  }

  @Get()
  findAll() {
    return this.guestsService.findAll();
  }

  @Post('search')
  search(
    @Body() searchGuestDto: SearchGuestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.guestsService.search(
      searchGuestDto.query,
      this.requireUserId(req),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGuestDto: UpdateGuestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.guestsService.update(
      id,
      updateGuestDto,
      this.requireUserId(req),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guestsService.remove(id);
  }

  private requireUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user id is required');
    }
    return userId;
  }
}
