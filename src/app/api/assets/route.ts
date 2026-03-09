import { NextRequest, NextResponse } from 'next/server'
import { createAssetType, deleteAssetType, getAssetTypes, updateAssetType } from '@/lib/db'
import { AssetDefinition } from '@/types/trading'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const isValidColor = (value: string) => value.includes('from-') && value.includes('to-')

const parseAssetPayload = (input: unknown): AssetDefinition | null => {
  if (!input || typeof input !== 'object') return null
  const candidate = input as Record<string, unknown>

  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  const label = typeof candidate.label === 'string' ? candidate.label.trim() : ''
  const icon = typeof candidate.icon === 'string' ? candidate.icon.trim() : ''
  const color = typeof candidate.color === 'string' ? candidate.color.trim() : ''
  const supportsWeightRate = Boolean(candidate.supportsWeightRate)

  if (!id || !/^[A-Za-z0-9_-]{2,24}$/.test(id)) return null
  if (!label || label.length > 40) return null
  if (!icon || icon.length > 8) return null
  if (!color || !isValidColor(color)) return null

  return { id, label, icon, color, supportsWeightRate }
}

export async function GET() {
  try {
    const items = await getAssetTypes()
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to load asset types', error)
    return NextResponse.json({ error: 'Unable to load asset types right now.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = parseAssetPayload(await request.json())
    if (!payload) {
      return NextResponse.json({ error: 'Invalid asset payload.' }, { status: 400 })
    }

    const record = await createAssetType(payload)
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset type', error)
    return NextResponse.json({ error: 'Unable to create asset type right now.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = parseAssetPayload(await request.json())
    if (!payload) {
      return NextResponse.json({ error: 'Invalid asset payload.' }, { status: 400 })
    }

    const record = await updateAssetType(payload)
    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to update asset type', error)
    return NextResponse.json({ error: 'Unable to update asset type right now.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = (await request.json()) as { id?: string }
    const id = payload.id?.trim()

    if (!id) {
      return NextResponse.json({ error: 'Asset id is required.' }, { status: 400 })
    }

    await deleteAssetType(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'ASSET_IN_USE') {
      return NextResponse.json({ error: 'Cannot delete asset type with existing transactions.' }, { status: 409 })
    }

    console.error('Failed to delete asset type', error)
    return NextResponse.json({ error: 'Unable to delete asset type right now.' }, { status: 500 })
  }
}
