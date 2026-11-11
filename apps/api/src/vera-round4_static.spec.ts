import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WRITE_ROUTE_VALIDATORS } from './write-route-registry';

const API_SRC = join(__dirname);

function walkControllers(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walkControllers(p, out);
    } else if (name.endsWith('.controller.ts')) {
      out.push(p);
    }
  }
  return out;
}

/** [R4-5] Every mutating Nest route must appear in write-route-registry.ts. */
function discoverMutatingRoutes(): Array<{ method: string; path: string }> {
  const routes: Array<{ method: string; path: string }> = [];
  for (const file of walkControllers(API_SRC)) {
    const text = readFileSync(file, 'utf8');
    const ctrl = text.match(/@Controller\(\s*['"]([^'"]*)['"]\s*\)/);
    const prefix = ctrl ? `/${ctrl[1]}`.replace(/\/+/g, '/') : '';
    const re =
      /@(Post|Patch|Put|Delete)\(\s*(?:\)|['"]([^'"]*)['"])/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const method = m[1].toUpperCase();
      const sub = m[2] ?? '';
      const path =
        sub === ''
          ? prefix || '/'
          : `${prefix}/${sub}`.replace(/\/+/g, '/');
      routes.push({ method, path });
    }
  }
  return routes;
}

function registryKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

describe('Vera round 4 — static gates', () => {
  it('[R4-5] write-route-registry includes every mutating controller route', () => {
    const discovered = discoverMutatingRoutes();
    const registered = new Set(
      WRITE_ROUTE_VALIDATORS.map((r) => registryKey(r.method, r.path)),
    );
    const missing = discovered.filter(
      (r) => !registered.has(registryKey(r.method, r.path)),
    );
    expect(missing).toEqual([]);
  });

  const RAW_DB_MESSAGE_FILES = [
    'materials/materials.service.ts',
    'reports/reports.service.ts',
    'retention/retention.service.ts',
  ];

  it('[R4-7] client responses must not pass raw DB error.message to clients', () => {
    const offenders: string[] = [];
    for (const rel of RAW_DB_MESSAGE_FILES) {
      const full = join(API_SRC, rel);
      const text = readFileSync(full, 'utf8');
      if (text.includes('throw new BadRequestException(error.message)')) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('[R4-8] no bare NotFoundException() / ForbiddenException() in user-facing services', () => {
    const serviceDir = API_SRC;
    const bad: string[] = [];
    for (const file of walkControllers(serviceDir).concat(
      walkServices(serviceDir),
    )) {
      const text = readFileSync(file, 'utf8');
      if (
        /throw new NotFoundException\(\)/.test(text) ||
        /throw new ForbiddenException\(\)/.test(text)
      ) {
        bad.push(file.replace(API_SRC + '/', ''));
      }
    }
    expect(bad).toEqual([]);
  });
});

function walkServices(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory() && name !== 'test') {
      walkServices(p, out);
    } else if (name.endsWith('.service.ts')) {
      out.push(p);
    }
  }
  return out;
}
