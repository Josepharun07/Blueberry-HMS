import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user?: { id?: string; role?: UserRole };
}

@ApiTags('User Management')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.MANAGER)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create a staff account' })
  create(@Body() createUserDto: CreateUserDto, @Request() req: AuthenticatedRequest) {
    return this.userService.create(createUserDto, this.actor(req));
  }

  @Get()
  @ApiOperation({ summary: 'Get users' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  findAll(@Query('role') role?: UserRole) {
    if (role) {
      return this.userService.findByRole(role);
    }
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.update(id, updateUserDto, this.actor(req));
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  private actor(req: AuthenticatedRequest): { role: UserRole } {
    if (!req.user?.role) {
      throw new UnauthorizedException('Authenticated user id is required');
    }
    return { role: req.user.role };
  }
}
