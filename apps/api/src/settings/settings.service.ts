import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import { taipeiYmd } from '../common/taipei-time';

@Injectable()
export class SettingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  async getRetentionCap(account: SessionAccount) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const year = new Date(`${taipeiYmd()}T12:00:00+08:00`).getUTCFullYear();
    const { data } = await this.db()
      .from('retention_annual_caps')
      .select('calendar_year, cap_ntd')
      .eq('calendar_year', year)
      .maybeSingle();
    return { calendarYear: year, capNtd: data?.cap_ntd ?? 60000 };
  }

  /** B-035 B-097 — applies current year only; no recalc of past runs */
  async setRetentionCap(account: SessionAccount, capNtd: number) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    if (!Number.isInteger(capNtd) || capNtd < 0) {
      throw new BadRequestException('保留金年度上限須為 0 以上的整數');
    }
    const year = new Date(`${taipeiYmd()}T12:00:00+08:00`).getUTCFullYear();
    const { data: old } = await this.db()
      .from('retention_annual_caps')
      .select('cap_ntd')
      .eq('calendar_year', year)
      .maybeSingle();
    await this.db()
      .from('retention_annual_caps')
      .upsert({ calendar_year: year, cap_ntd: capNtd });
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'SYSTEM_CONFIG',
      description: `保留金年度上限 ${old?.cap_ntd ?? 60000} → ${capNtd}`,
    });
    return { calendarYear: year, capNtd };
  }

  /** B-032 unit prices for a price set */
  async getUnitPrices(account: SessionAccount, priceSet: string) {
    this.assertAdmin(account);
    const { data, error } = await this.db()
      .from('unit_prices')
      .select('item_code, price')
      .eq('price_set', priceSet);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async patchUnitPrice(
    account: SessionAccount,
    priceSet: string,
    itemCode: string,
    price: number,
  ) {
    this.assertAdmin(account);
    if (price < 0) throw new BadRequestException('單價須 ≥ 0');
    await this.db()
      .from('unit_prices')
      .upsert({
        price_set: priceSet,
        item_code: itemCode,
        price,
        updated_by: account.id,
      });
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'SYSTEM_CONFIG',
      description: `更新單價 ${priceSet}/${itemCode}=${price}`,
    });
    return { ok: true };
  }

  /** B-033 B-034 B-029 system settings */
  async getSystem(account: SessionAccount) {
    this.assertAdmin(account);
    const { data } = await this.db()
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();
    return data;
  }

  async patchSystem(
    account: SessionAccount,
    patch: {
      tabName1?: string;
      uninsuredRateWest?: number;
      uninsuredRateSouth?: number;
      globalRetentionWest?: number;
      globalRetentionSouth?: number;
    },
  ) {
    this.assertAdmin(account);
    const row: Record<string, unknown> = {};
    if (patch.tabName1 !== undefined) row.tab_name_1 = patch.tabName1;
    if (patch.uninsuredRateWest !== undefined) {
      row.uninsured_rate_west = patch.uninsuredRateWest;
    }
    if (patch.uninsuredRateSouth !== undefined) {
      row.uninsured_rate_south = patch.uninsuredRateSouth;
    }
    if (patch.globalRetentionWest !== undefined) {
      row.global_retention_west = patch.globalRetentionWest;
    }
    if (patch.globalRetentionSouth !== undefined) {
      row.global_retention_south = patch.globalRetentionSouth;
    }
    await this.db().from('system_settings').update(row).eq('id', 1);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'SYSTEM_CONFIG',
      description: '更新系統設定',
    });
    return { ok: true };
  }

  private assertAdmin(account: SessionAccount) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
  }
}
