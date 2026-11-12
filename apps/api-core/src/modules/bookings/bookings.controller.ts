import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService, DeskActor } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

interface AuthenticatedRequest {
  user?: { id?: string; role?: UserRole };
}

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.FRONT_DESK)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('quote')
  quote(@Body() dto: CreateBookingDto, @Request() req: AuthenticatedRequest) {
    return this.bookingsService.quote(dto, this.actor(req));
  }

  @Post()
  create(@Body() dto: CreateBookingDto, @Request() req: AuthenticatedRequest) {
    return this.bookingsService.create(dto, this.actor(req));
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.update(id, dto, this.actor(req));
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookingsService.checkIn(id, this.actor(req));
  }

  @Post(':id/check-out')
  checkOut(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookingsService.checkOut(id, this.actor(req));
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookingsService.cancel(id, this.actor(req));
  }

  @Post(':id/no-show')
  noShow(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookingsService.markNoShow(id, this.actor(req));
  }

  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID. Retry the same key to avoid a double receipt.' })
  @Post(':id/payments')
  recordPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.recordPayment(id, dto, idempotencyKey, this.actor(req));
  }

  @Roles(UserRole.MANAGER)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @Post(':id/payments/:paymentId/reversal')
  reversePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: ReversePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.reversePayment(id, paymentId, dto.reason, idempotencyKey, this.actor(req));
  }

  @Get(':id/invoice')
  invoice(@Param('id') id: string) {
    return this.bookingsService.invoice(id);
  }

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.bookingsService.getPayments(id);
  }

  @Delete(':id')
  remove() {
    return this.bookingsService.remove();
  }

  private actor(req: AuthenticatedRequest): DeskActor {
    if (!req.user?.id || !req.user.role) {
      throw new UnauthorizedException('Authenticated user id is required');
    }
    return { id: req.user.id, role: req.user.role };
  }
}
