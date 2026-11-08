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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomStatus } from './entities/room.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

interface AuthenticatedRequest {
  user?: {
    id?: string;
  };
}

@Controller('rooms')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.HOUSEKEEPING)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  create(@Body() createRoomDto: CreateRoomDto, @Request() req: AuthenticatedRequest) {
    return this.roomsService.create(createRoomDto, this.requireUserId(req));
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('available')
  findAvailable() {
    return this.roomsService.findAvailable();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.roomsService.update(id, updateRoomDto, this.requireUserId(req));
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RoomStatus,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.roomsService.updateStatus(id, status, this.requireUserId(req));
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  private requireUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user id is required');
    }
    return userId;
  }
}
