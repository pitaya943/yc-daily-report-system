import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @Post('requests/:id/cancel')
  @Roles('USER')
  cancel(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.materials.cancelRequest(account, id);
  }

  @Post('admin/items')
  @Roles('ADMIN', 'OWNER')
  adminAdd(
    @CurrentAccount() account: SessionAccount,
    @Body()
    body: {
      name: string;
      unit: string;
      code?: string;
      specification?: string;
      tab?: number;
      remainingQty?: number;
    },
  ) {
    return this.materials.adminAddMaterial(account, body);
  }

  @Post('admin/items/:id')
  @Roles('ADMIN', 'OWNER')
  adminUpdate(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
    @Body()
    body: {
      remainingQty?: number;
      cumulativeUsage?: number;
      hidden?: boolean;
      tab?: number;
    },
  ) {
    return this.materials.adminUpdateMaterial(account, id, body);
  }

  @Delete('admin/items/:id')
  @Roles('ADMIN', 'OWNER')
  adminDelete(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.materials.adminDeleteMaterial(account, id);
  }

  @Post('admin/import')
  @Roles('ADMIN', 'OWNER')
  importFile(
    @CurrentAccount() account: SessionAccount,
    @Body()
    body: { fileName: string; csvText?: string; fileBase64?: string },
  ) {
    return this.materials.importInventory(account, body.fileName, body);
  }

  @Post('admin/reset')
  @Roles('ADMIN', 'OWNER')
  reset(
    @CurrentAccount() account: SessionAccount,
    @Body() body: { confirm?: boolean },
  ) {
    return this.materials.resetInventory(account, body?.confirm);
  }

  @Post('admin/items/:id/quarantine/keep-a')
  @Roles('ADMIN', 'OWNER')
  keepA(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.materials.resolveQuarantineKeepA(account, id);
  }

  @Post('admin/items/:id/quarantine/sync-b')
  @Roles('ADMIN', 'OWNER')
  syncB(
    @CurrentAccount() account: SessionAccount,
    @Param('id') id: string,
  ) {
    return this.materials.resolveQuarantineSyncB(account, id);
  }
}
