'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppNav } from '../../components/AppNav';
import { apiGet, apiSend, fetchSession } from '../../lib/api';

type Material = {
  id: string;
  name: string;
  unit: string;
  remaining_qty: number;
};

type Pending = {
  id: string;
  quantity: number;
  applicant?: { display_name: string };
  material?: { name: string; remaining_qty: number };
};

export default function MaterialsPage() {
  const [role, setRole] = useState<string>('USER');
  const [inventory, setInventory] = useState<Material[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [myRequests, setMyRequests] = useState<
    Array<{ id: string; quantity: number; status: string }>
  >([]);
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void (async () => {
      const inv = await apiGet<Material[]>('/materials/inventory');
      setInventory(inv);
      const s = await fetchSession();
      if (!s.signedIn) return;
      setRole(s.account.role);
      if (s.account.role === 'USER') {
        try {
          setMyRequests(
            await apiGet<Array<{ id: string; quantity: number; status: string }>>(
              '/materials/requests/mine',
            ),
          );
        } catch {
          /* not signed in as user */
        }
      } else {
        setPending(await apiGet<Pending[]>('/materials/requests/pending'));
      }
    })();
  }, []);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      await apiSend('/materials/requests', 'POST', { materialId, quantity });
      setMessage('申請已送出，待審核');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '申請失敗');
    }
  }

  async function approve(id: string) {
    try {
      await apiSend(`/materials/requests/${id}/approve`, 'POST');
      setMessage('已核准');
      setPending(await apiGet<Pending[]>('/materials/requests/pending'));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '核准失敗');
    }
  }

  return (
    <main>
      <AppNav />
      <h1>{role === 'USER' ? '材料庫存' : '材料審核'}</h1>
      <ul>
        {inventory.map((m) => (
          <li key={m.id}>
            {m.name} — 庫存 {m.remaining_qty} {m.unit}
          </li>
        ))}
      </ul>
      {role === 'USER' && (
        <form onSubmit={onRequest}>
          <h2>申請材料</h2>
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            required
          >
            <option value="">請選擇</option>
            {inventory.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <button type="submit">送出申請</button>
        </form>
      )}
      {role === 'USER' && myRequests.length > 0 && (
        <>
          <h2>我的申請</h2>
          <ul>
            {myRequests.map((r) => (
              <li key={r.id}>
                數量 {r.quantity} — {r.status}
              </li>
            ))}
          </ul>
        </>
      )}
      {(role === 'ADMIN' || role === 'OWNER') && (
        <>
          <h2>待審申請</h2>
          <ul>
            {pending.map((p) => (
              <li key={p.id}>
                {p.applicant?.display_name} 申請 {p.material?.name} × {p.quantity}
                <button type="button" onClick={() => void approve(p.id)}>
                  核准
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </main>
  );
}
