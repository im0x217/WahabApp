'use client'

import { FormEvent, useEffect, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { LoadingRoller } from '@/components/loading-roller'
import type { AssetDefinition, ClientProfile, Vault } from '@/types/trading'
import { formatCurrency, getAssetIcon, getAssetLabel, getVaultGeneralTotal } from '@/lib/trading'
import { Phone, UserRound, Wallet } from 'lucide-react'

const emptyDraft: ClientProfile = {
  id: '',
  name: '',
  phone: '',
}

export default function ClientsPage() {
  const [assets, setAssets] = useState<AssetDefinition[]>([])
  const [vaults, setVaults] = useState<Vault[]>([])
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [draft, setDraft] = useState<ClientProfile>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingOps, setPendingOps] = useState(0)
  const [error, setError] = useState('')

  const withDbLock = async <T,>(operation: () => Promise<T>) => {
    setPendingOps((previous) => previous + 1)
    try {
      return await operation()
    } finally {
      setPendingOps((previous) => Math.max(0, previous - 1))
    }
  }

  const loadClients = async () => {
    const [clientsResponse, assetsResponse, vaultsResponse] = await withDbLock(async () =>
      Promise.all([
        fetch('/api/clients', { cache: 'no-store' }),
        fetch('/api/assets', { cache: 'no-store' }),
        fetch('/api/vaults', { cache: 'no-store' }),
      ]),
    )

    if (!clientsResponse.ok || !assetsResponse.ok || !vaultsResponse.ok) {
      throw new Error('تعذر تحميل العملاء الآن.')
    }

    const clientsPayload = (await clientsResponse.json()) as { items?: ClientProfile[] }
    const assetsPayload = (await assetsResponse.json()) as { items?: AssetDefinition[] }
    const vaultsPayload = (await vaultsResponse.json()) as { items?: Vault[] }

    setClients(Array.isArray(clientsPayload.items) ? clientsPayload.items : [])
    setAssets(Array.isArray(assetsPayload.items) ? assetsPayload.items : [])
    setVaults(Array.isArray(vaultsPayload.items) ? vaultsPayload.items : [])
  }

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        await loadClients()
      } catch (loadError) {
        if (mounted) {
          const message = loadError instanceof Error ? loadError.message : 'تعذر تحميل العملاء الآن.'
          setError(message)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const resetForm = () => {
    setDraft(emptyDraft)
    setEditingId(null)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const payload = {
      id: editingId ?? undefined,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
    }

    if (!payload.name || !payload.phone) {
      setError('يرجى إدخال الاسم ورقم الهاتف.')
      return
    }

    const response = await withDbLock(async () =>
      fetch('/api/clients', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    )

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? 'تعذر حفظ بيانات العميل الآن.')
      return
    }

    await loadClients()
    resetForm()
  }

  const onDelete = async (id: string) => {
    setError('')

    const response = await withDbLock(async () =>
      fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }),
    )

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? 'تعذر حذف العميل الآن.')
      return
    }

    await loadClients()
    if (editingId === id) {
      resetForm()
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-5 sm:pb-8">
        <LoadingRoller label="جاري تحميل العملاء..." />
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-5 sm:pb-8">
      <section className="glass rounded-3xl p-5">
        <p className="flex items-center gap-2 text-sm text-fintech-muted"><UserRound size={16} />إدارة العملاء</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">بيانات العملاء</h1>

        <form className="mt-5 grid gap-2 sm:grid-cols-2" onSubmit={onSubmit}>
          <input
            value={draft.name}
            onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
            placeholder="اسم العميل"
            className="rounded-2xl border border-fintech-border bg-fintech-panelSoft px-3 py-2 text-sm text-white"
            required
          />
          <input
            value={draft.phone}
            onChange={(event) => setDraft((previous) => ({ ...previous, phone: event.target.value }))}
            placeholder="رقم الهاتف"
            className="rounded-2xl border border-fintech-border bg-fintech-panelSoft px-3 py-2 text-sm text-white"
            required
          />

          {error ? <p className="sm:col-span-2 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'حفظ التعديل' : 'إضافة عميل'}
            </button>
            {editingId ? (
              <button type="button" className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-fintech-text" onClick={resetForm}>
                إلغاء
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">قائمة العملاء</h2>
          <span className="text-xs text-fintech-muted">{clients.length} عميل</span>
        </div>

        {clients.length === 0 ? (
          <div className="glass rounded-2xl p-4 text-sm text-fintech-muted">لا يوجد عملاء بعد.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <article key={client.id} className="glass rounded-3xl p-4 transition duration-300 hover:translate-y-[-2px]">
                <p className="text-base font-semibold text-white">{client.name}</p>
                <p className="mt-2 flex items-center gap-1 text-sm text-fintech-muted"><Phone size={14} />{client.phone}</p>

                {(() => {
                  const vault = vaults.find((item) => item.id === client.id && item.kind === 'Client')
                  if (!vault) {
                    return <p className="mt-3 text-xs text-rose-300">لا توجد خزنة فرعية مرتبطة بهذا العميل.</p>
                  }

                  const totalValue = getVaultGeneralTotal(vault, assets)
                  return (
                    <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                      <p className="flex items-center gap-2 text-xs tracking-wide text-fintech-muted"><Wallet size={13} />تفاصيل الخزنة الفرعية</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {assets.map((asset) => (
                          <div key={`${client.id}-${asset.id}`} className="rounded-xl bg-fintech-panelSoft p-2">
                            <p className="text-[11px] text-fintech-muted">{getAssetIcon(asset.id, assets)} {getAssetLabel(asset.id, assets)}</p>
                            <p className="numeric mt-1 text-sm font-semibold text-white">{formatCurrency(vault.balances[asset.id] ?? 0)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-xl bg-fintech-panelSoft p-2">
                        <p className="text-[11px] text-fintech-muted">إجمالي القيمة العامة</p>
                        <p className="numeric mt-1 text-base font-bold text-white">{formatCurrency(totalValue)}</p>
                      </div>
                    </div>
                  )
                })()}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(client.id)
                      setDraft(client)
                      setError('')
                    }}
                    className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-fintech-text"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(client.id)}
                    className="rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs text-rose-300"
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pendingOps > 0 ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <LoadingRoller label="جاري تنفيذ العملية..." />
        </div>
      ) : null}

      <BottomNav />
    </main>
  )
}
