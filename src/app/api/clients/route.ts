import { NextRequest, NextResponse } from 'next/server'
import { createClient, deleteClient, getClients, updateClient } from '@/lib/db'
import type { ClientProfile } from '@/types/trading'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const isValidPhone = (value: string) => /^[0-9+()\-\s]{6,24}$/.test(value)

const parsePayload = (input: unknown): ClientProfile | null => {
  if (!input || typeof input !== 'object') return null
  const candidate = input as Record<string, unknown>

  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''
  const phone = typeof candidate.phone === 'string' ? candidate.phone.trim() : ''

  if (!name || name.length > 80) return null
  if (!phone || !isValidPhone(phone)) return null

  return {
    id: id || crypto.randomUUID(),
    name,
    phone,
  }
}

export async function GET() {
  try {
    const items = await getClients()
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to load clients', error)
    return NextResponse.json({ error: 'Unable to load clients right now.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = parsePayload(await request.json())
    if (!payload) {
      return NextResponse.json({ error: 'Invalid client payload.' }, { status: 400 })
    }

    const record = await createClient(payload)
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to create client', error)
    return NextResponse.json({ error: 'Unable to create client right now.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = parsePayload(await request.json())
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Invalid client payload.' }, { status: 400 })
    }

    const record = await updateClient(payload)
    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to update client', error)
    return NextResponse.json({ error: 'Unable to update client right now.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = (await request.json()) as { id?: string }
    const id = payload.id?.trim()
    if (!id) {
      return NextResponse.json({ error: 'Client id is required.' }, { status: 400 })
    }

    await deleteClient(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete client', error)
    return NextResponse.json({ error: 'Unable to delete client right now.' }, { status: 500 })
  }
}
