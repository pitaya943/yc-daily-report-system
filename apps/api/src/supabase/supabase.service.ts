import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { loadConfig } from '../config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private service!: SupabaseClient;
  private anon!: SupabaseClient;

  onModuleInit() {
    const cfg = loadConfig();
    this.service = createClient(cfg.supabaseUrl, cfg.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.anon = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  getServiceClient(): SupabaseClient {
    return this.service;
  }

  getAnonClient(): SupabaseClient {
    return this.anon;
  }
}
