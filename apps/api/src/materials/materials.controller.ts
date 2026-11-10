import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAccount } from '../common/current-account.decorator';
import { SessionAccount } from '../auth/types';
import { MaterialsService } from './materials.service';

@Controller('materials')
@UseGuards(AuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get('inventory')
  @Roles('USER', 'ADMIN', 'OWNER')
  inventory(@CurrentAccount() account: SessionAccount) {
    return this.materials.listInventory(account);
  }

  @Post('requests')
  @Roles('USER')
  request(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { materialId: string; quantity: number; note?: string },
  ) {
    return this.materials.createRequest(account, body);
  }

  @Get('requests/mine')
  @Roles('USER')
  myRequests(@CurrentAccount() account: SessionAccount) {
    return this.materials.listMyRequests(account);
  }

  @Get('requests/pending')
  @Roles('ADMIN', 'OWNER')
  pending(@CurrentAccount() account: SessionAccount) {
    return this.materials.listPendingRequests(account);
  }

  @Post('requests/:id/approve')
  @Roles('ADMIN', 'OWNER')
  approve(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.materials.approveRequest(account, id);
  }

  @Post('requests/:id/reject')
  @Roles('ADMIN', 'OWNER')
  reject(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.materials.rejectRequest(account, id);
  }
}
