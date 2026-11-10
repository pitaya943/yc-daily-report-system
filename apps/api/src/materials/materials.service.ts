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
    let query = this.db()
      .from('materials')
      .select(
        'id, name, unit, remaining_qty, tab, hidden, quarantined, display_order',
      )
      .order('display_order');
    if (account.role === 'USER') {
      query = query.eq('hidden', false).eq('quarantined', false);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
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
}
