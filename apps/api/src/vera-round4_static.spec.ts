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

/** All non-spec TypeScript sources under apps/api/src (guards, pipes, services, …). */
function walkApiSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walkApiSourceFiles(p, out);
    } else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) {
      out.push(p);
    }
  }
  return out;
}

function relPath(full: string): string {
  return full.replace(API_SRC + '/', '').replace(API_SRC + '\\', '');
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

/** Named Nest exceptions (suffix `Exception`) plus bare `HttpException`. */
const NAMED_HTTP_EXCEPTION =
  'BadRequest|Forbidden|NotFound|Unauthorized|Conflict|ServiceUnavailable|InternalServerError|UnprocessableEntity';
const HTTP_EXCEPTION_CTOR = `(?:(${NAMED_HTTP_EXCEPTION})Exception|HttpException)`;

export function findRawMessagePassthrough(text: string): boolean {
  const patterns = [
    new RegExp(
      `throw\\s+new\\s+${HTTP_EXCEPTION_CTOR}\\s*\\([^)]*?\\w+\\.message`,
    ),
    new RegExp(
      `throw\\s+new\\s+${HTTP_EXCEPTION_CTOR}\\s*\\([^)]*?\\?\\.message`,
    ),
    new RegExp(
      `throw\\s+new\\s+${HTTP_EXCEPTION_CTOR}\\s*\\([^)]*message:\\s*\\w+\\.message`,
    ),
    new RegExp(
      `new\\s+${HTTP_EXCEPTION_CTOR}\\s*\\([^)]*?\\w+\\.message`,
    ),
  ];
  return patterns.some((re) => re.test(text));
}

export function findEmptyHttpExceptionCtor(text: string): boolean {
  const re = new RegExp(
    `throw\\s+new\\s+${HTTP_EXCEPTION_CTOR}\\s*\\(\\s*\\)`,
  );
  return re.test(text);
}

const SCANNER_FIXTURES: Array<{
  name: string;
  snippet: string;
  r47: boolean;
  r48: boolean;
}> = [
  {
    name: 'plain HttpException with error.message',
    snippet: 'throw new HttpException(error.message);',
    r47: true,
    r48: false,
  },
  {
    name: 'plain HttpException with err?.message',
    snippet: 'throw new HttpException(err?.message);',
    r47: true,
    r48: false,
  },
  {
    name: 'empty plain HttpException',
    snippet: 'throw new HttpException();',
    r47: false,
    r48: true,
  },
  {
    name: 'empty BadRequestException (control)',
    snippet: 'throw new BadRequestException();',
    r47: false,
    r48: true,
  },
];

describe('Vera round 4 — static gates', () => {
  describe('[F-A1] scanner self-test (in-memory fixtures)', () => {
    for (const fixture of SCANNER_FIXTURES) {
      it(`R4-7/R4-8 detects ${fixture.name}`, () => {
        expect(findRawMessagePassthrough(fixture.snippet)).toBe(fixture.r47);
        expect(findEmptyHttpExceptionCtor(fixture.snippet)).toBe(fixture.r48);
      });
    }
  });

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

  it('[R4-7] client responses must not pass raw error.message to clients', () => {
    const offenders: string[] = [];
    for (const file of walkApiSourceFiles(API_SRC)) {
      const text = readFileSync(file, 'utf8');
      if (findRawMessagePassthrough(text)) {
        offenders.push(relPath(file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('[R4-8] no empty HttpException constructors in apps/api/src', () => {
    const bad: string[] = [];
    for (const file of walkApiSourceFiles(API_SRC)) {
      const text = readFileSync(file, 'utf8');
      if (findEmptyHttpExceptionCtor(text)) {
        bad.push(relPath(file));
      }
    }
    expect(bad).toEqual([]);
  });
});
