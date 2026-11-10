import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SessionAccount } from '../auth/types';
import {
  ValidationMessages,
  validateMaterialRequestQty,
} from '@yc/validation';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private db() {
    return this.supabase.getServiceClient();
  }

  async listInventory(account: SessionAccount) {
    const { data: tabs } = await this.db()
      .from('system_settings')
      .select(
        'tab_name_1, tab_name_2, tab_name_3, tab_name_4, tab_name_5, tab_name_6, tab_name_7, tab_name_8, tab_name_9, tab_name_10',
      )
      .eq('id', 1)
      .single();
    let query = this.db()
      .from('materials')
      .select(
        'id, code, name, specification, unit, remaining_qty, tab, hidden, quarantined, display_order',
      )
      .order('display_order');
    if (account.role === 'USER') {
      query = query.eq('hidden', false).eq('quarantined', false);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { tabs: tabs ?? {}, items: data ?? [] };
  }

  /** B-065 USER request */
  async createRequest(
    account: SessionAccount,
    body: { materialId: string; quantity: number; note?: string },
  ) {
    if (account.role !== 'USER') {
      throw new ForbiddenException();
    }
    const qtyErr = validateMaterialRequestQty(body.quantity);
    if (qtyErr) throw new BadRequestException(qtyErr.message);

    const { data: mat, error } = await this.db()
      .from('materials')
      .select('id, remaining_qty, hidden, quarantined, name')
      .eq('id', body.materialId)
      .single();
    if (error || !mat) throw new NotFoundException();
    if (mat.hidden || mat.quarantined) {
      throw new BadRequestException(ValidationMessages.materialNotRequestable);
    }
    if (Number(mat.remaining_qty) < body.quantity) {
      throw new BadRequestException(ValidationMessages.materialInsufficient);
    }

    const { data: req, error: insErr } = await this.db()
      .from('material_requests')
      .insert({
        applicant_id: account.id,
        material_id: body.materialId,
        quantity: body.quantity,
        note: body.note?.slice(0, 50) ?? null,
        status: 'PENDING',
      })
      .select('id')
      .single();
    if (insErr) throw new BadRequestException(insErr.message);

    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'MATERIAL_REQUEST',
      description: `申請材料 ${mat.name} × ${body.quantity}`,
    });

    return { id: req.id };
  }

  async listMyRequests(account: SessionAccount) {
    if (account.role !== 'USER') {
      throw new ForbiddenException();
    }
    const { data, error } = await this.db()
      .from('material_requests')
      .select('id, quantity, status, created_at, material_id')
      .eq('applicant_id', account.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async listPendingRequests(account: SessionAccount) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const { data: requests, error } = await this.db()
      .from('material_requests')
      .select('id, quantity, status, created_at, material_id, applicant_id')
      .eq('status', 'PENDING')
      .order('created_at');
    if (error) throw new Error(error.message);
    const list = requests ?? [];
    if (!list.length) return [];
    const matIds = [...new Set(list.map((r) => r.material_id))];
    const userIds = [...new Set(list.map((r) => r.applicant_id))];
    const { data: mats } = await this.db()
      .from('materials')
      .select('id, name, remaining_qty')
      .in('id', matIds);
    const { data: users } = await this.db()
      .from('accounts')
      .select('id, display_name')
      .in('id', userIds);
    const matById = new Map((mats ?? []).map((m) => [m.id, m]));
    const userById = new Map((users ?? []).map((u) => [u.id, u]));
    return list.map((r) => ({
      ...r,
      material: matById.get(r.material_id),
      applicant: userById.get(r.applicant_id),
    }));
  }

  /** B-056 BDD-002 BDD-003 via DB function + row locks */
  async approveRequest(account: SessionAccount, requestId: string) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const { data, error } = await this.db().rpc('approve_material_request', {
      p_request_id: requestId,
      p_reviewer_id: account.id,
    });
    if (error) throw new BadRequestException(error.message);
    const result = data as { ok: boolean; code: string };
    if (result.code === 'INSUFFICIENT') {
      throw new BadRequestException(ValidationMessages.materialInsufficientApprove);
    }
    if (result.code === 'NOT_PENDING') {
      throw new BadRequestException('此申請已處理');
    }
    if (!result.ok) {
      throw new BadRequestException('無法核准申請');
    }
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'MATERIAL_APPROVE',
      description: `核准材料申請 ${requestId}`,
    });
    return { ok: true };
  }

  async rejectRequest(account: SessionAccount, requestId: string) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const { data: req } = await this.db()
      .from('material_requests')
      .select('id, status')
      .eq('id', requestId)
      .single();
    if (!req) throw new NotFoundException();
    if (req.status !== 'PENDING') {
      throw new BadRequestException('此申請已處理');
    }
    await this.db()
      .from('material_requests')
      .update({
        status: 'REJECTED',
        reviewer_id: account.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'PENDING');

    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'MATERIAL_REJECT',
      description: `駁回材料申請 ${requestId}`,
    });
    return { ok: true };
  }

  /** B-065 cancel PENDING */
  async cancelRequest(account: SessionAccount, requestId: string) {
    if (account.role !== 'USER') throw new ForbiddenException();
    const { data: req } = await this.db()
      .from('material_requests')
      .select('id, applicant_id, status')
      .eq('id', requestId)
      .single();
    if (!req || req.applicant_id !== account.id) throw new NotFoundException();
    if (req.status !== 'PENDING') {
      throw new BadRequestException('此申請已處理');
    }
    await this.db().from('material_requests').delete().eq('id', requestId);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'MATERIAL_CANCEL',
      description: `取消材料申請 ${requestId}`,
    });
    return { ok: true };
  }

  /** B-066 add material */
  async adminAddMaterial(
    account: SessionAccount,
    body: {
      name: string;
      unit: string;
      code?: string;
      specification?: string;
      tab?: number;
      remainingQty?: number;
    },
  ) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const remaining = body.remainingQty ?? 0;
    const { data, error } = await this.db()
      .from('materials')
      .insert({
        name: body.name,
        unit: body.unit,
        code: body.code ?? null,
        specification: body.specification ?? null,
        tab: body.tab ?? 1,
        remaining_qty: remaining,
        received_qty: remaining,
        cumulative_usage: 0,
        display_order: 999,
      })
      .select('id')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'MATERIAL_ADD',
      description: `新增材料 ${body.name}`,
    });
    return { id: data.id };
  }

  async adminUpdateMaterial(
    account: SessionAccount,
    id: string,
    body: {
      remainingQty?: number;
      cumulativeUsage?: number;
      hidden?: boolean;
      tab?: number;
    },
  ) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    const patch: Record<string, unknown> = {};
    if (body.remainingQty != null) patch.remaining_qty = body.remainingQty;
    if (body.cumulativeUsage != null) {
      patch.cumulative_usage = body.cumulativeUsage;
    }
    if (body.hidden != null) patch.hidden = body.hidden;
    if (body.tab != null) patch.tab = body.tab;
    if (patch.remaining_qty != null || patch.cumulative_usage != null) {
      const { data: cur } = await this.db()
        .from('materials')
        .select('remaining_qty, cumulative_usage')
        .eq('id', id)
        .single();
      const remaining = (patch.remaining_qty as number) ?? cur?.remaining_qty;
      const cumulative =
        (patch.cumulative_usage as number) ?? cur?.cumulative_usage;
      patch.received_qty = Number(remaining) + Number(cumulative);
    }
    await this.db().from('materials').update(patch).eq('id', id);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'MATERIAL_UPDATE',
      description: `更新材料 ${id}`,
    });
    return { ok: true };
  }

  async adminDeleteMaterial(account: SessionAccount, id: string) {
    if (account.role !== 'ADMIN' && account.role !== 'OWNER') {
      throw new ForbiddenException();
    }
    await this.db()
      .from('material_requests')
      .delete()
      .eq('material_id', id)
      .eq('status', 'PENDING');
    await this.db().from('materials').delete().eq('id', id);
    await this.audit.write({
      actorId: account.id,
      actorDisplayName: account.displayName,
      actionType: 'MATERIAL_DELETE',
      description: `刪除材料 ${id}`,
    });
    return { ok: true };
  }
}
