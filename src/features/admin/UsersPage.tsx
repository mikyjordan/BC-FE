import { useState } from 'react';
import { Coins, KeyRound, Search, ShieldBan, ShieldCheck } from 'lucide-react';
import { api, newIdempotencyKey } from '../../api/client';
import { useAdminMutation, useAdminPermissions, useAdminUsers } from '../../api/hooks';
import type { AdminUserRow } from '../../api/types';
import { Modal } from '../../components/Modal';
import { Alert, Badge, Bc, Button, Card, Checkbox, Field, Input, Muted, PageHeader, Pagination, Select, Spinner, Stack, Table, TableScroll } from '../../components/ui';
import { formatDate, formatBc } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';

function PermissionsModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const perms = useAdminPermissions();
  const [selected, setSelected] = useState<string[]>(user.permissions);
  const m = useAdminMutation((permissions: string[]) => api(`/admin/users/${user.id}/permissions`, { method: 'PUT', body: { permissions } }));
  return (
    <Modal title={`Permessi di ${user.username}`} onClose={onClose}>
      <Stack $gap={10}>
        <Muted $size="0.85rem">Un ADMIN non ha alcun permesso finché non viene concesso esplicitamente.</Muted>
        {perms.data?.items.map((p) => (
          <Checkbox key={p.key}>
            <input
              type="checkbox"
              checked={selected.includes(p.key)}
              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, p.key] : s.filter((x) => x !== p.key)))}
            />
            <span>{p.label} <Muted as="span" $size="0.75rem">({p.key})</Muted></span>
          </Checkbox>
        ))}
        {m.error && <Alert $tone="error">{m.error.message}</Alert>}
        <Stack $row $gap={8} $justify="flex-end">
          <Button $variant="secondary" onClick={onClose}>Annulla</Button>
          <Button disabled={m.isPending} onClick={() => m.mutate(selected, { onSuccess: onClose })}>Salva permessi</Button>
        </Stack>
      </Stack>
    </Modal>
  );
}

function AdjustModal({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'ADMIN_ADJUSTMENT' | 'REFUND'>('ADMIN_ADJUSTMENT');
  // Chiave stabile per questa rettifica: un doppio invio non duplica il movimento.
  const [key] = useState(newIdempotencyKey);
  const m = useAdminMutation(() =>
    api(`/admin/users/${user.id}/wallet-adjustments`, { method: 'POST', body: { amount: Number(amount), reason, type, idempotencyKey: key } }),
  );
  const n = Number(amount);
  const valid = Number.isInteger(n) && n !== 0 && reason.trim().length >= 5;
  return (
    <Modal title={`Rettifica compensativa — ${user.username}`} onClose={onClose}>
      <Stack $gap={12}>
        <Alert $tone="info">I movimenti esistenti non vengono mai modificati: la rettifica crea un nuovo movimento nel ledger, tracciato nell’audit log.</Alert>
        <Muted>Saldo attuale: {user.balance !== null ? formatBc(user.balance) : '—'}</Muted>
        <Field label="Importo (negativo per addebitare)">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="ADMIN_ADJUSTMENT">Rettifica amministrativa</option>
            <option value="REFUND">Rimborso</option>
          </Select>
        </Field>
        <Field label="Motivazione (obbligatoria)">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {m.error && <Alert $tone="error">{m.error.message}</Alert>}
        {m.isSuccess && <Alert $tone="success">Rettifica registrata.</Alert>}
        <Stack $row $gap={8} $justify="flex-end">
          <Button $variant="secondary" onClick={onClose}>Chiudi</Button>
          <Button $variant="gold" disabled={!valid || m.isPending || m.isSuccess} onClick={() => m.mutate(undefined)}>
            Registra {valid ? formatBc(n, true) : ''}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}

export function UsersPage() {
  const me = useAuthStore((s) => s.user);
  const isSuper = me?.role === 'SUPERADMIN';
  const canAdjust = hasPermission(me, 'wallet.adjust');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState<string | undefined>();
  const [role, setRole] = useState<string>('');
  const users = useAdminUsers(page, search, role || undefined);
  const [permsFor, setPermsFor] = useState<AdminUserRow | null>(null);
  const [adjustFor, setAdjustFor] = useState<AdminUserRow | null>(null);
  const setRoleM = useAdminMutation((v: { id: string; role: 'USER' | 'ADMIN' }) => api(`/admin/users/${v.id}/role`, { method: 'PATCH', body: { role: v.role } }));
  const setStatusM = useAdminMutation((v: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => api(`/admin/users/${v.id}/status`, { method: 'PATCH', body: { status: v.status } }));

  if (!hasPermission(me, 'users.view')) return <Alert $tone="warning">Non hai il permesso di consultare gli utenti.</Alert>;

  return (
    <>
      <PageHeader title="Utenti, ruoli e permessi" subtitle="Il ruolo SUPERADMIN si assegna solo tramite la procedura di bootstrap dal server." />
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim() || undefined); }}>
        <Stack $row $gap={10} $wrap style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, opacity: 0.5 }} />
            <Input placeholder="Email o nome utente…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 36 }} aria-label="Cerca utenti" />
          </div>
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} style={{ maxWidth: 180 }} aria-label="Ruolo">
            <option value="">Tutti i ruoli</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
          </Select>
        </Stack>
      </form>
      {(setRoleM.error || setStatusM.error) && <Alert $tone="error" style={{ marginBottom: 12 }}>{(setRoleM.error ?? setStatusM.error)!.message}</Alert>}
      <Card $padding="6px 10px">
        {users.isLoading ? <Spinner /> : (
          <TableScroll>
            <Table>
              <thead><tr><th>Utente</th><th>Ruolo</th><th>Stato</th><th>Saldo</th><th>Registrato</th><th /></tr></thead>
              <tbody>
                {users.data?.items.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong><Muted $size="0.8rem">{u.email}</Muted></td>
                    <td>
                      {isSuper && u.role !== 'SUPERADMIN' && u.id !== me?.id ? (
                        <Select value={u.role} onChange={(e) => setRoleM.mutate({ id: u.id, role: e.target.value as 'USER' | 'ADMIN' })} style={{ maxWidth: 120, padding: '6px 8px' }} aria-label={`Ruolo di ${u.username}`}>
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </Select>
                      ) : (
                        <Badge $tone={u.role === 'SUPERADMIN' ? 'gold' : u.role === 'ADMIN' ? 'blue' : 'neutral'}>{u.role}</Badge>
                      )}
                      {u.role === 'ADMIN' && <Muted $size="0.72rem">{u.permissions.length} permessi</Muted>}
                    </td>
                    <td><Badge $tone={u.status === 'ACTIVE' ? 'green' : 'red'}>{u.status === 'ACTIVE' ? 'Attivo' : 'Sospeso'}</Badge></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{u.balance !== null ? <Bc value={u.balance} size={13} /> : '—'}</td>
                    <td><Muted $size="0.85rem">{formatDate(u.createdAt)}</Muted></td>
                    <td>
                      <Stack $row $gap={4} $justify="flex-end">
                        {isSuper && u.role === 'ADMIN' && <Button $size="sm" $variant="ghost" onClick={() => setPermsFor(u)} title="Permessi"><KeyRound size={14} /></Button>}
                        {canAdjust && <Button $size="sm" $variant="ghost" onClick={() => setAdjustFor(u)} title="Rettifica saldo"><Coins size={14} /></Button>}
                        {isSuper && u.role !== 'SUPERADMIN' && u.id !== me?.id && (
                          u.status === 'ACTIVE'
                            ? <Button $size="sm" $variant="ghost" onClick={() => setStatusM.mutate({ id: u.id, status: 'SUSPENDED' })} title="Sospendi"><ShieldBan size={14} /></Button>
                            : <Button $size="sm" $variant="ghost" onClick={() => setStatusM.mutate({ id: u.id, status: 'ACTIVE' })} title="Riattiva"><ShieldCheck size={14} /></Button>
                        )}
                      </Stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>
      {users.data && <Pagination page={page} totalPages={users.data.totalPages} onChange={setPage} />}
      {permsFor && <PermissionsModal user={permsFor} onClose={() => setPermsFor(null)} />}
      {adjustFor && <AdjustModal user={adjustFor} onClose={() => setAdjustFor(null)} />}
    </>
  );
}
