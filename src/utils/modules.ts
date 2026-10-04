// WPlus WhatsApp Module Finder
import { WA_MODULES } from '../constants'
import { dbg } from './debug'
import type {
    OriginalHooks,
    PrivacyHookName,
    WAChat,
    WACollection,
    WAContact,
    WAHookModule,
} from '../types'

// Module cache
export let CC: WACollection<WAChat> | null = null
export let CON: WACollection<WAContact> | null = null
export let GRP: WACollection<unknown> | null = null

// Original function references for restore on cleanup
export let originals: OriginalHooks = {}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

export function requireModule<T>(name: string): T {
    const moduleLoader = window.require
    if (!moduleLoader) throw new Error('window.require not found')
    return moduleLoader(name) as T
}

export function findExport(name: PrivacyHookName): WAHookModule | null {
    try {
        const modMap = requireModule<{ modulesMap: Record<string, unknown> }>(
            '__debug',
        ).modulesMap
        const keys = Object.keys(modMap)
        for (const key of keys) {
            try {
                const mod = requireModule<unknown>(key)
                const modRecord = isRecord(mod) ? mod : null
                const defaultExport = modRecord?.default
                const resolvedExport = isRecord(defaultExport)
                    ? defaultExport
                    : modRecord
                if (
                    resolvedExport &&
                    typeof resolvedExport[name] === 'function'
                ) {
                    return resolvedExport as WAHookModule
                }
                if (modRecord && typeof modRecord[name] === 'function') {
                    return modRecord as WAHookModule
                }
            } catch {}
        }
    } catch {}
    return null
}

export function initModules(): boolean {
    try {
        if (typeof window.require !== 'function') {
            dbg('init', 'window.require not found')
            return false
        }

        const chatModule = requireModule<{
            ChatCollection?: WACollection<WAChat>
        }>(WA_MODULES.ChatCollection)
        if (!chatModule.ChatCollection?._models) {
            dbg('init', 'ChatCollection not ready')
            return false
        }
        CC = chatModule.ChatCollection
        dbg('init', 'ChatCollection found', { chats: CC!._models.length })

        try {
            CON =
                requireModule<{
                    ContactCollection?: WACollection<WAContact>
                }>(WA_MODULES.ContactCollection).ContactCollection || null
            if (!CON) throw new Error('ContactCollection not found')
            dbg('init', 'ContactCollection found', {
                contacts: CON!._models.length,
            })
        } catch (e: unknown) {
            dbg('init', 'ContactCollection failed', errorMessage(e))
        }

        try {
            GRP =
                requireModule<{
                    GroupMetadataCollection?: WACollection<unknown>
                }>(WA_MODULES.GroupMetadata).GroupMetadataCollection || null
            dbg('init', 'GroupMetadata found', { groups: GRP!._models.length })
        } catch {}

        // Cache original functions for privacy hooks
        const hookNames: PrivacyHookName[] = [
            'markComposing',
            'markRecording',
            'sendPresenceAvailable',
            'sendPresenceUnavailable',
            'sendConversationSeen',
            'markPlayed',
        ]

        for (const name of hookNames) {
            try {
                const mod = findExport(name)
                if (mod && mod[name]) {
                    originals[name] = mod[name]
                    dbg('init', `${name} hook ready`)
                }
            } catch {}
        }

        return true
    } catch (e: unknown) {
        dbg('init', 'FATAL', errorMessage(e))
        return false
    }
}
