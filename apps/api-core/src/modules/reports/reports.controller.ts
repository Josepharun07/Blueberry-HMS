import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.FRONT_DESK)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('desk')
  desk() {
    return this.reports.desk();
  }
}
