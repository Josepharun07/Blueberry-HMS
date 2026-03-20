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
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingsService.create(createBookingDto, req.user.id);
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
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @Request() req) {
    return this.bookingsService.checkIn(id, req.user.id);
  }

  @Post(':id/check-out')
  checkOut(@Param('id') id: string, @Request() req) {
    return this.bookingsService.checkOut(id, req.user.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Request() req) {
    return this.bookingsService.cancel(id, req.user.id);
  }

  @Post(':id/payments')
  recordPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req,
  ) {
    return this.bookingsService.recordPayment(id, createPaymentDto, req.user.id);
  }

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.bookingsService.getPayments(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}
