// WPlus Type Definitions — WhatsApp Desktop Internal APIs
// by KuchiSofts — github.com/KuchiSofts

export interface WPlusState {
    version: string
    ready: boolean
    cleanup?: () => void
    settings: SettingsAPI
    deletedMsgs: DeletedMessagesAPI
    viewOnce: ViewOnceAPI
    applyToggle: (id: string, on: boolean) => void
    goToMessage: (msgId: string) => boolean
    showMedia: (dataUrl: string, type: string) => void
    forceRestoreCurrentChat: (callback: (count: number) => void) => void
    exportContacts: () => void
    chatStats: () => string
    downloadVO: (id: string) => void
    debug: DebugAPI
}

export interface SettingsAPI {
    (): SavedSettings
    <K extends keyof SavedSettings>(key: K): SavedSettings[K] | undefined
    <K extends keyof SavedSettings>(
        key: K,
        value: SavedSettings[K],
    ): SavedSettings[K]
}

export interface DeletedMessagesAPI {
    (action: 'get'): DeletedMessage[]
    (action: 'add', item: DeletedMessage): DeletedMessage[]
    (action: 'clear'): DeletedMessage[]
}

export type ViewOnceAPI = (
    action: 'get' | 'add' | 'clear',
    item?: unknown,
) => unknown[]

export interface DebugAPI {
    getLog: () => LogEntry[]
    getLogText: () => string
    clear: () => void
    enable: () => void
    disable: () => void
    isEnabled: () => boolean
    status: () => DebugStatus
}

export interface LogEntry {
    t: number
    ts: string
    cat: string
    msg: string
    data?: string
}

export interface DebugStatus {
    version: string
    ready: boolean
    chats: number
    contacts: number
    groups: number
    deletedMsgs: number
    hookedChats: number
    hooks: {
        composing: boolean
        presence: boolean
        seen: boolean
        played: boolean
    }
    settings: SavedSettings
    logEntries: number
}

export interface DeletedMessage {
    id: string
    type: string
    body: string
    text: string
    caption?: string
    sender: string
    time: number
    chat?: string
    media?: string // base64 data URL (for same-session)
    mediaFile?: string // relative path on disk (from file server)
    mime?: string
}

export interface SavedSettings {
    blurMessages?: boolean
    blurContacts?: boolean
    blurPhotos?: boolean
    blurAvatar?: boolean
    hideTyping?: boolean
    hideOnline?: boolean
    disableReceipts?: boolean
    playAudioPrivate?: boolean
    checkUpdates?: boolean
    debugEnabled?: boolean
}

export interface WAMediaData {
    mediaBlob?: { _blob?: Blob }
}

export type PrivacyHookName =
    | 'markComposing'
    | 'markRecording'
    | 'sendPresenceAvailable'
    | 'sendPresenceUnavailable'
    | 'sendConversationSeen'
    | 'markPlayed'

export type WAHookFunction = (...args: unknown[]) => unknown

export type OriginalHooks = Partial<Record<PrivacyHookName, WAHookFunction>>

export type WAHookModule = Partial<Record<PrivacyHookName, WAHookFunction>>

// WhatsApp Internal Types (from module hooks)
export interface WAChat {
    id: { _serialized: string; user: string; server: string }
    __x_name?: string
    __x_formattedTitle?: string
    __x_unreadCount?: number
    __x_active?: boolean
    msgs: WAMsgCollection
}

export interface WAMsgCollection {
    _models: WAMsg[]
    get: (id: string) => WAMsg | null
    on: (event: string, callback: (msg: WAMsg) => void) => void
    __wp?: boolean
    __wpR?: boolean
}

export interface WAMsg {
    __x_id: { _serialized: string; fromMe?: boolean }
    __x_type: string
    __x_body: string
    __x_text: string
    __x_caption?: string
    __x_mediaData?: WAMediaData
    __x_from?: { _serialized: string }
    __x_t?: number
    __x_isRevoked?: boolean
    __x_isMMS?: boolean
    __x_isMedia?: boolean
    __x_isViewOnce?: boolean
    __x_viewOnce?: boolean
    isNewMsg?: boolean
    id?: { fromMe?: boolean }
    self?: string
    // Backup fields (set by WPlus)
    __x_backupBody?: string
    __x_backupText?: string
    __x_backupType?: string
    __x_backupCaption?: string
    __x_backupMediaData?: WAMediaData
    __x_backupTime?: number
    __x_backupSender?: string
}

export interface WAContact {
    id: { _serialized: string; user: string; server: string }
    __x_name?: string
    __x_pushname?: string
    __x_formattedName?: string
    __x_isBusiness?: boolean
}

export interface WACollection<T> {
    _models: T[]
    get: (id: string) => T | null
    on: (event: string, callback: (item: T) => void) => void
}

declare global {
    interface Window {
        __wplus?: Partial<WPlusState>
        __wplusStickerImportCleanup?: () => void
        require?: (moduleName: string) => unknown
    }
}
