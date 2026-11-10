import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type AuditAction =
  | 'ACCESS_DENIED'
  | 'ACCOUNT_CREATE'
  | 'ACCOUNT_LOCKOUT'
  | 'PASSWORD_CHANGE';

export type AuditWriteInput = {
  actorId: string | null;
  actorDisplayName: string;
  actionType: AuditAction | string;
  description: string;
};

/** B-097 audit-log write helper. */
@Injectable()
export class AuditService {
  constructor(private readonly supabase: SupabaseService) {}

  async write(entry: AuditWriteInput): Promise<void> {
    const db = this.supabase.getServiceClient();
    const { error } = await db.from('audit_log').insert({
      actor_id: entry.actorId,
      actor_display_name: entry.actorDisplayName,
      action_type: entry.actionType,
      description: entry.description,
      occurred_at: new Date().toISOString(),
    });
    if (error) {
      throw new Error(`audit_log insert failed: ${error.message}`);
    }
  }

  async logAccessDenied(
    actorId: string,
    actorName: string,
    attempted: string,
  ): Promise<void> {
    await this.write({
      actorId,
      actorDisplayName: actorName,
      actionType: 'ACCESS_DENIED',
      description: `${attempted}：已拒絕`, // PROVISIONAL(Q-058)
    });
  }
}
