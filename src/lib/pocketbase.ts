import PocketBase from 'pocketbase'

const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL

export const pocketbase = baseUrl ? new PocketBase(baseUrl) : null

export const isPocketBaseEnabled = Boolean(baseUrl)
