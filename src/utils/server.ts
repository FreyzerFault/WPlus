// WPlus File Server Communication
import { FILE_SERVER_URL } from '../constants'
import { dbg } from './debug'

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

export function serverPost(path: string, data: unknown): void {
    try {
        fetch(FILE_SERVER_URL + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
            .then((r) => r.json())
            .then((r) => dbg('server', `${path} → ${JSON.stringify(r)}`))
            .catch((e: unknown) =>
                dbg('server', `${path} error: ${errorMessage(e)}`),
            )
    } catch (e: unknown) {
        dbg('server', `fetch error: ${errorMessage(e)}`)
    }
}

export function serverGet<T>(path: string): Promise<T | null> {
    return fetch(FILE_SERVER_URL + path)
        .then((r) => r.json() as Promise<T>)
        .catch(() => null)
}

export function mediaUrl(relativePath: string): string {
    return `${FILE_SERVER_URL}/media/${relativePath}`
}
