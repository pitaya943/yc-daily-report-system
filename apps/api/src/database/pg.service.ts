import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class PgService implements OnModuleDestroy {
  private pool: Pool | null = null;

  getPool(): Pool {
    if (!this.pool) {
      const url = process.env.DATABASE_URL ?? process.env.DB_URL;
      if (!url) {
        throw new Error('DATABASE_URL is required for transactional operations');
      }
      this.pool = new Pool({ connectionString: url });
    }
    return this.pool;
  }

  async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
