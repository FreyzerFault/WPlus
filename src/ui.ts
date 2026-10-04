import uiStyles from './styles/ui.css'
import uiTemplates from './templates/ui.html'
import type { DebugStatus, DeletedMessage, LogEntry } from './types'

interface UiDebugAPI {
    getLog: () => LogEntry[]
    clear: () => void
    enable: () => void
    disable: () => void
    isEnabled: () => boolean
    status: () => Partial<DebugStatus> & { error?: string }
}

interface UiWPlusAPI {
    deletedMsgs?: (action: 'get' | 'clear') => DeletedMessage[]
    debug?: UiDebugAPI
    applyToggle?: (id: string, on: boolean) => void
    goToMessage?: (id: string) => boolean
    forceRestoreCurrentChat?: (callback: (count: number) => void) => void
    exportContacts?: () => void
    chatStats?: () => string
}

interface UiWAChat {
    id?: { _serialized?: string }
    __x_name?: string
    __x_formattedTitle?: string
    __x_active?: boolean
    msgs?: { _models?: unknown[] }
}

interface UiWAChatCollection {
    _models?: UiWAChat[]
}

interface UiWALoadMessages {
    loadEarlierMsgs: (chat: UiWAChat) => Promise<unknown>
}

interface UiWAPreparedMedia {
    waitForPrep: () => Promise<unknown>
}

interface UiWAModules {
    WAWebChatCollection: { ChatCollection: UiWAChatCollection }
    WAWebChatLoadMessages: UiWALoadMessages
    WAWebMediaOpaqueData: {
        createFromData: (data: File, mime: string) => unknown
    }
    WAWebMedia: {
        prepRawMedia: (
            mediaData: unknown,
            options: {
                isPtt: boolean
                asDocument: boolean
                asGif: boolean
                isAudio: boolean
                asSticker: boolean
                precomputedFields: { duration: null; waveform: null }
            },
        ) => UiWAPreparedMedia
    }
    WAWebMediaPrep: {
        sendMediaMsgToChat: (request: {
            chat: UiWAChat
            options: {
                addEvenWhilePreparing: boolean
                caption: string
                type: 'sticker'
            }
            prep: UiWAPreparedMedia
            earlyUpload: null
        }) => Promise<unknown>
    }
}

function waRequire<T extends keyof UiWAModules>(name: T): UiWAModules[T] {
    return (
        window as unknown as Window & {
            require: (moduleName: string) => unknown
        }
    ).require(name) as UiWAModules[T]
}

;(function () {
    ;['wplus-btn', 'wplus-panel', 'wplus-css'].forEach(function (id) {
        var e = document.getElementById(id)
        if (e) e.remove()
    })
    var W: UiWPlusAPI =
        (window as Window & { __wplus?: UiWPlusAPI }).__wplus || {}
    function cfg(k: string): boolean {
        try {
            return (
                (
                    (JSON.parse(localStorage.getItem('wplus_cfg') || '{}') ||
                        {}) as Record<string, boolean>
                )[k] || false
            )
        } catch (e) {
            return false
        }
    }
    function setCfg(k: string, v: boolean): void {
        try {
            var s = JSON.parse(
                localStorage.getItem('wplus_cfg') || '{}',
            ) as Record<string, boolean>
            s[k] = v
            localStorage.setItem('wplus_cfg', JSON.stringify(s))
        } catch (e) {}
    }
    function delC(): number {
        try {
            return (
                W.deletedMsgs
                    ? W.deletedMsgs('get')
                    : (JSON.parse(
                          localStorage.getItem('wplus_del') || '[]',
                      ) as DeletedMessage[])
            ).length
        } catch (e) {
            return 0
        }
    }
    function byId<T extends HTMLElement = HTMLElement>(id: string): T {
        return document.getElementById(id) as T
    }
    function query<T extends HTMLElement = HTMLElement>(
        root: ParentNode,
        selector: string,
    ): T {
        return root.querySelector(selector) as T
    }
    function queryAll<T extends HTMLElement = HTMLElement>(
        root: ParentNode,
        selector: string,
    ): NodeListOf<T> {
        return root.querySelectorAll(selector) as NodeListOf<T>
    }

    var templateBank = new DOMParser().parseFromString(uiTemplates, 'text/html')
    function cloneTemplate<T extends HTMLElement>(id: string): T {
        var template = templateBank.querySelector<HTMLTemplateElement>('#' + id)
        var root = template?.content.firstElementChild
        if (!root) throw new Error('Missing UI template: ' + id)
        return root.cloneNode(true) as T
    }
    function appendTemplate<T extends HTMLElement>(
        parent: HTMLElement,
        id: string,
    ): T {
        var element = cloneTemplate<T>(id)
        parent.appendChild(element)
        return element
    }
    function setEmptyState(target: HTMLElement, message: string): void {
        var emptyState = cloneTemplate<HTMLDivElement>('wplus-empty-template')
        query(emptyState, '[data-text]').textContent = message
        target.replaceChildren(emptyState)
    }

    var css = document.createElement('style')
    css.id = 'wplus-css'
    css.textContent = uiStyles
    document.head.appendChild(css)

    type StickerImport = { file: File; chatId: string }
    type StickerConversion = {
        webp: string
        animated: boolean
        frames: number
        durationMs: number
        size: number
        error?: string
    }
    type StickerWindow = Window & {
        __wplusStickerImportCleanup?: () => void
    }
    var stickerWindow = window as StickerWindow
    if (stickerWindow.__wplusStickerImportCleanup)
        stickerWindow.__wplusStickerImportCleanup()

    var pendingSticker: StickerImport | null = null
    var stickerAction: HTMLDivElement | null = null
    var stickerStatus: HTMLSpanElement | null = null
    var stickerButton: HTMLButtonElement | null = null
    var lastImportedKey = ''
    var lastImportedAt = 0

    function activeChat(): UiWAChat | null {
        try {
            var chats = waRequire('WAWebChatCollection').ChatCollection
            return (
                chats._models?.find(function (chat) {
                    return chat.__x_active && chat.id?._serialized
                }) || null
            )
        } catch (error) {
            console.error('[WPlus:sticker] Could not find active chat:', error)
            return null
        }
    }

    function isStickerImage(file: File): boolean {
        return (
            file.type.toLowerCase().startsWith('image/') ||
            /\.(gif|jpe?g|png|webp|bmp)$/i.test(file.name)
        )
    }

    function collectStickerFile(files: FileList | null): void {
        if (!files) return
        var file: File | undefined
        for (var i = 0; i < files.length; i++) {
            if (isStickerImage(files[i])) {
                file = files[i]
                break
            }
        }
        if (!file) return
        var chat = activeChat()
        var chatId = chat?.id?._serialized
        if (!chatId) return

        var key = file.name + ':' + file.size + ':' + file.lastModified
        var now = Date.now()
        if (key === lastImportedKey && now - lastImportedAt < 1500) {
            return
        }
        lastImportedKey = key
        lastImportedAt = now
        pendingSticker = { file: file, chatId: chatId }

        if (!stickerAction) {
            stickerAction = document.createElement('div')
            stickerAction.id = 'wplus-sticker-action'
            stickerAction.setAttribute('role', 'status')
            stickerAction.setAttribute('aria-live', 'polite')
            stickerButton = document.createElement('button')
            stickerButton.type = 'button'
            stickerButton.className = 'wplus-sticker-send'
            stickerStatus = document.createElement('span')
            stickerStatus.className = 'wplus-sticker-status'
            stickerAction.append(stickerButton, stickerStatus)
            stickerAction.addEventListener('click', function (event) {
                event.stopPropagation()
            })
            document.body.appendChild(stickerAction)
            stickerButton.addEventListener('click', function () {
                void convertAndSendSticker()
            })
        }

        stickerButton!.disabled = false
        stickerButton!.textContent = 'Convertir y enviar como sticker'
        stickerStatus!.textContent =
            file.name +
            (file.type === 'image/gif' || /\.gif$/i.test(file.name)
                ? ' · GIF animado'
                : ' · imagen')
        stickerAction.hidden = false
    }

    function bytesToBase64(bytes: Uint8Array): string {
        var binary = ''
        for (var offset = 0; offset < bytes.length; offset += 0x8000) {
            binary += String.fromCharCode.apply(
                null,
                Array.prototype.slice.call(bytes, offset, offset + 0x8000),
            )
        }
        return btoa(binary)
    }

    function base64ToBytes(encoded: string): Uint8Array {
        var binary = atob(encoded)
        var bytes = new Uint8Array(binary.length)
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
        }
        return bytes
    }

    async function convertAndSendSticker(): Promise<void> {
        if (!pendingSticker || !stickerButton || !stickerStatus) return
        var candidate = pendingSticker
        var originalButtonText = stickerButton.textContent
        stickerButton.disabled = true
        stickerButton.textContent = 'Convirtiendo…'
        stickerStatus.textContent = 'Preparando WebP para WhatsApp'

        try {
            if (activeChat()?.id?._serialized !== candidate.chatId) {
                throw new Error(
                    'El chat activo ha cambiado. Vuelve a importar la imagen en el chat de destino.',
                )
            }
            if (candidate.file.size > 20 * 1024 * 1024) {
                throw new Error('La imagen supera el límite de 20 MB.')
            }
            var source = bytesToBase64(
                new Uint8Array(await candidate.file.arrayBuffer()),
            )
            var response = await fetch(
                'http://127.0.0.1:18733/sticker/convert',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: source }),
                },
            )
            var result = (await response.json()) as StickerConversion
            if (!response.ok) {
                throw new Error(
                    result.error || 'No se pudo convertir esta imagen.',
                )
            }
            if (!result.webp) {
                throw new Error('El servidor no devolvió el sticker WebP.')
            }

            var webpBytes = base64ToBytes(result.webp)
            var webpBuffer = new ArrayBuffer(webpBytes.byteLength)
            new Uint8Array(webpBuffer).set(webpBytes)
            var webp = new File(
                [webpBuffer],
                candidate.file.name.replace(/\.[^.]+$/, '') + '.webp',
                { type: 'image/webp', lastModified: Date.now() },
            )
            stickerButton.textContent = 'Enviando sticker…'
            stickerStatus.textContent = result.animated
                ? 'WebP animado · ' + result.frames + ' fotogramas'
                : 'Sticker WebP estático'

            var opaqueData = waRequire(
                'WAWebMediaOpaqueData',
            ).createFromData(webp, webp.type)
            var prepared = waRequire('WAWebMedia').prepRawMedia(opaqueData, {
                isPtt: false,
                asDocument: false,
                asGif: false,
                isAudio: false,
                asSticker: true,
                precomputedFields: { duration: null, waveform: null },
            })
            await prepared.waitForPrep()
            var chat = activeChat()
            if (chat?.id?._serialized !== candidate.chatId) {
                throw new Error(
                    'El chat activo ha cambiado. No se envió el sticker.',
                )
            }
            var sent = await waRequire(
                'WAWebMediaPrep',
            ).sendMediaMsgToChat({
                chat: chat,
                options: {
                    addEvenWhilePreparing: false,
                    caption: '',
                    type: 'sticker',
                },
                prep: prepared,
                earlyUpload: null,
            })
            if (!sent) {
                throw new Error('WhatsApp no confirmó el envío del sticker.')
            }
            stickerButton.textContent = 'Sticker enviado'
            stickerStatus.textContent = result.animated
                ? 'WebP animado · ' + result.size + ' bytes'
                : 'WebP · ' + result.size + ' bytes'
            window.setTimeout(function () {
                stickerAction?.remove()
                stickerAction = null
                stickerButton = null
                stickerStatus = null
                pendingSticker = null
            }, 3000)
        } catch (error) {
            stickerButton.textContent = originalButtonText || 'Reintentar'
            stickerStatus.textContent =
                error instanceof TypeError &&
                error.message.toLowerCase().includes('fetch')
                    ? 'No se pudo conectar al conversor local (127.0.0.1:18733). Comprueba que WPlus esté abierto; reinícialo si acabas de actualizarlo y autoriza el acceso a la red local si WebView2 lo solicita.'
                    : error instanceof Error
                    ? error.message
                    : 'Error al convertir la imagen.'
            console.error('[WPlus:sticker] ' + stickerStatus.textContent)
        } finally {
            if (stickerButton?.isConnected) stickerButton.disabled = false
        }
    }

    var stickerDropHandler = function (event: DragEvent) {
        var files = event.dataTransfer?.files
        if (
            stickerButton?.disabled ||
            !activeChat() ||
            !files ||
            files.length !== 1 ||
            !isStickerImage(files[0])
        )
            return
        event.preventDefault()
        event.stopImmediatePropagation()
        collectStickerFile(files)
    }
    var stickerPasteHandler = function (event: ClipboardEvent) {
        var files = event.clipboardData?.files
        if (
            stickerButton?.disabled ||
            !activeChat() ||
            !files ||
            files.length !== 1 ||
            !isStickerImage(files[0])
        )
            return
        event.preventDefault()
        event.stopImmediatePropagation()
        collectStickerFile(files)
    }
    var stickerInputHandler = function (event: Event) {
        var input = event.target
        if (
            !stickerButton?.disabled &&
            input instanceof HTMLInputElement &&
            input.type === 'file' &&
            input.files?.length === 1 &&
            isStickerImage(input.files[0]) &&
            activeChat()
        ) {
            event.stopImmediatePropagation()
            collectStickerFile(input.files)
        }
    }
    document.addEventListener('drop', stickerDropHandler, true)
    document.addEventListener('paste', stickerPasteHandler, true)
    document.addEventListener('change', stickerInputHandler, true)
    stickerWindow.__wplusStickerImportCleanup = function () {
        document.removeEventListener('drop', stickerDropHandler, true)
        document.removeEventListener('paste', stickerPasteHandler, true)
        document.removeEventListener('change', stickerInputHandler, true)
        document.getElementById('wplus-sticker-action')?.remove()
        stickerWindow.__wplusStickerImportCleanup = undefined
    }

    var dc = delC()

    var btn = cloneTemplate<HTMLButtonElement>('wplus-trigger-template')
    var countBadge = query<HTMLSpanElement>(btn, '#wplus-c')
    countBadge.textContent = String(dc || 0)
    if (dc > 0) countBadge.style.display = ''
    document.body.appendChild(btn)

    var P = cloneTemplate<HTMLDivElement>('wplus-panel-template')
    query(P, '#wp-dc').textContent = String(dc)
    queryAll<HTMLDivElement>(P, '.wpp-tg').forEach(function (toggle) {
        var id = toggle.dataset.t || ''
        var on =
            id === 'checkUpdates' || id === 'debugEnabled'
                ? cfg(id) !== false
                : cfg(id)
        toggle.classList.toggle('on', on)
    })
    document.body.appendChild(P)

    // UI debug logger — logs to engine's debug system
    function uiLog(action: string, data?: unknown): void {
        if (W.debug && W.debug.isEnabled && W.debug.isEnabled()) {
            var entry: LogEntry = {
                t: Date.now(),
                ts: new Date().toLocaleTimeString(),
                cat: 'ui',
                msg: action,
            }
            if (data)
                entry.data =
                    typeof data === 'object'
                        ? JSON.stringify(data).substring(0, 300)
                        : String(data)
            try {
                var log = JSON.parse(
                    localStorage.getItem('wplus_log') || '[]',
                ) as LogEntry[]
                log.push(entry)
                if (log.length > 500) log = log.slice(-500)
                localStorage.setItem('wplus_log', JSON.stringify(log))
            } catch (e) {}
            console.log(
                '[WPlus:ui] ' + action + (data ? ' | ' + entry.data : ''),
            )
        }
    }

    function open(): void {
        P.classList.add('open')
        btn.classList.add('on')
        btn.setAttribute('aria-expanded', 'true')
        refresh()
    }
    function close(): void {
        P.classList.remove('open')
        btn.classList.remove('on')
        btn.setAttribute('aria-expanded', 'false')
    }
    function closeAll(): void {
        queryAll(P, '.wpp-sub.open').forEach(function (e) {
            e.classList.remove('open')
        })
    }
    function refresh(): void {
        var d = delC()
        var a = document.getElementById('wp-dc')
        if (a) a.textContent = String(d)
        var c = document.getElementById('wplus-c')
        if (c) {
            c.textContent = String(d)
            c.style.display = d > 0 ? '' : 'none'
        }
    }

    btn.addEventListener('click', function (e: MouseEvent) {
        e.stopPropagation()
        var isOpen = P.classList.contains('open')
        isOpen ? close() : open()
        uiLog(isOpen ? 'Panel CLOSED' : 'Panel OPENED')
    })
    byId('wp-x').onclick = function () {
        close()
        uiLog('Panel closed (back)')
    }
    document.addEventListener('click', function (e) {
        if (!P.classList.contains('open')) return
        if (P.contains(e.target as Node) || btn.contains(e.target as Node))
            return
        var preview = document.getElementById('wplus-preview')
        if (preview && preview.contains(e.target as Node)) return
        close()
    })
    window.addEventListener('wplus-update', refresh)

    queryAll<HTMLDivElement>(P, '.wpp-tg').forEach(function (el) {
        el.onclick = function (e: MouseEvent) {
            e.stopPropagation()
            var id = el.dataset.t || '',
                on = !el.classList.contains('on')
            el.classList.toggle('on')
            setCfg(id, on)
            if (W.applyToggle) W.applyToggle(id, on)
            localStorage.setItem('wplus_sync_now', '1')
            uiLog('Toggle: ' + id + ' → ' + (on ? 'ON' : 'OFF'))
        }
    })

    query(P, '[data-a="del"]').onclick = function () {
        var el = byId('wp-dl')
        if (el.classList.contains('open')) {
            el.classList.remove('open')
            return
        }
        closeAll()
        refresh()
        var msgs: DeletedMessage[] = W.deletedMsgs
            ? W.deletedMsgs('get')
            : (JSON.parse(
                  localStorage.getItem('wplus_del') || '[]',
              ) as DeletedMessage[])
        if (!msgs.length) {
            var emptyState = cloneTemplate<HTMLDivElement>(
                'wplus-empty-template',
            )
            query(emptyState, '[data-text]').textContent =
                'No deleted messages yet'
            el.replaceChildren(emptyState)
            el.classList.add('open')
            return
        }
        var rows = document.createDocumentFragment()
        msgs.slice()
            .reverse()
            .forEach(function (m: DeletedMessage, idx: number) {
                var t = new Date(m.time).toLocaleString()
                var s = m.sender ? m.sender.split('@')[0] : '?'
                var typeIcon =
                    (
                        {
                            image: '\u{1F4F7}',
                            video: '\u{1F3AC}',
                            ptt: '\u{1F3A4}',
                            audio: '\u{1F3B5}',
                            sticker: '\u{1F3A8}',
                            vcard: '\u{1F464}',
                            location: '\u{1F4CD}',
                        } as Record<string, string>
                    )[m.type] || '\u{1F4AC}'

                // Compact body preview — detect base64 and show type instead
                var rawBody = m.body || m.text || ''
                var body = ''
                var isBase64 =
                    rawBody.length > 100 &&
                    (rawBody.indexOf('/9j/') === 0 ||
                        rawBody.indexOf('data:') === 0 ||
                        rawBody.indexOf('AAAA') === 0 ||
                        /^[A-Za-z0-9+/=]{50,}/.test(rawBody))
                if (
                    isBase64 ||
                    [
                        'image',
                        'video',
                        'ptt',
                        'audio',
                        'sticker',
                        'document',
                    ].indexOf(m.type) !== -1
                ) {
                    body =
                        typeIcon +
                        ' ' +
                        (m.type === 'ptt'
                            ? 'Voice message'
                            : m.type.charAt(0).toUpperCase() +
                              m.type.slice(1)) +
                        (m.caption ? ' — ' + m.caption.substring(0, 40) : '')
                } else {
                    body = rawBody.substring(0, 80)
                }
                if (!body) body = '(empty)'

                var row = cloneTemplate<HTMLDivElement>(
                    'wplus-message-row-template',
                )
                row.dataset.idx = String(idx)
                query(row, '[data-icon]').textContent = typeIcon
                query(row, '[data-sender]').textContent = '+' + s
                query(row, '[data-time]').textContent = t
                query(row, '[data-body]').textContent = body
                query<HTMLSpanElement>(row, '[data-go-to-chat]').dataset.nav =
                    m.id
                rows.appendChild(row)
            })
        el.replaceChildren(rows)

        // Click row: media → fullscreen viewer, text → preview popup
        queryAll<HTMLDivElement>(el, '[data-idx]').forEach(function (row) {
            row.onclick = function (e: MouseEvent) {
                if ((e.target as HTMLElement).dataset?.nav) return
                var idx = parseInt(row.dataset.idx || '0')
                var allMsgs: DeletedMessage[] = W.deletedMsgs
                    ? W.deletedMsgs('get')
                    : (JSON.parse(
                          localStorage.getItem('wplus_del') || '[]',
                      ) as DeletedMessage[])
                var m = allMsgs.slice().reverse()[idx]
                if (!m) return

                // Log and open preview
                uiLog('Saved msg clicked', {
                    idx: idx,
                    id: (m.id || '?').substring(0, 40),
                    type: m.type,
                    sender: (m.sender || '?').split('@')[0],
                    chat: m.chat || '?',
                    time: m.time ? new Date(m.time).toLocaleString() : '?',
                    bodyLen: (m.body || '').length,
                    hasMedia: !!(m.media || m.mediaFile),
                    mediaFile: m.mediaFile || '',
                })
                showPreview(m)
            }
        })

        // Go to chat arrow
        queryAll<HTMLSpanElement>(el, '[data-nav]').forEach(function (btn) {
            btn.onclick = function (e: MouseEvent) {
                e.stopPropagation()
                var id = btn.dataset.nav || ''
                uiLog('Go to chat clicked', { id: id.substring(0, 50) })
                if (W.goToMessage) {
                    btn.textContent = '\u{23F3}'
                    var self = btn
                    var ok = W.goToMessage(id)
                    uiLog('goToMessage returned: ' + ok)
                    setTimeout(function () {
                        self.textContent = '\u{2192}'
                    }, 5000)
                } else {
                    uiLog('goToMessage not available')
                }
            }
        })

        el.classList.add('open')
    }

    query(P, '[data-a="del-clear"]').onclick = function () {
        var c = delC()
        if (!c) return
        uiLog('Clear history clicked', { count: c })
        if (confirm('Delete ' + c + ' saved messages?')) {
            if (W.deletedMsgs) W.deletedMsgs('clear')
            else localStorage.removeItem('wplus_del')
            byId('wp-dl').classList.remove('open')
            refresh()
            uiLog('History cleared')
        }
    }

    query(P, '[data-a="export"]').onclick = function () {
        uiLog('Export contacts clicked')
        if (W.exportContacts) W.exportContacts()
        else alert('Loading...')
    }

    query(P, '[data-a="stats"]').onclick = function () {
        var el = byId('wp-sp')
        if (el.classList.contains('open')) {
            el.classList.remove('open')
            return
        }
        closeAll()
        var stats = cloneTemplate<HTMLDivElement>('wplus-stats-template')
        query(stats, '[data-text]').textContent = W.chatStats
            ? W.chatStats()
            : 'Loading...'
        el.replaceChildren(stats)
        el.classList.add('open')
    }

    // ── Debug handlers ────────────────────────────────────────
    query(P, '[data-a="debug-status"]').onclick = function () {
        var el = byId('wp-ds')
        if (el.classList.contains('open')) {
            el.classList.remove('open')
            return
        }
        closeAll()
        var s = W.debug ? W.debug.status() : { error: 'Engine not loaded' }
        var t = 'WPlus Debug Status\n' + '\u2500'.repeat(30) + '\n\n'
        t += 'Version: ' + (s.version || '?') + '\n'
        t += 'Ready: ' + (s.ready ? 'YES' : 'NO') + '\n'
        t += 'Chats: ' + (s.chats || 0) + '\n'
        t += 'Contacts: ' + (s.contacts || 0) + '\n'
        t += 'Groups: ' + (s.groups || 0) + '\n'
        t += 'Hooked chats: ' + (s.hookedChats || 0) + '\n'
        t += 'Deleted msgs: ' + (s.deletedMsgs || 0) + '\n'
        t += 'Log entries: ' + (s.logEntries || 0) + '\n\n'
        t += 'Hooks:\n'
        if (s.hooks) {
            t +=
                '  Composing: ' +
                (s.hooks.composing ? '\u2705' : '\u274C') +
                '\n'
            t +=
                '  Presence: ' + (s.hooks.presence ? '\u2705' : '\u274C') + '\n'
            t += '  ConvSeen: ' + (s.hooks.seen ? '\u2705' : '\u274C') + '\n'
            t +=
                '  MarkPlayed: ' + (s.hooks.played ? '\u2705' : '\u274C') + '\n'
        }
        t += '\nSettings:\n' + JSON.stringify(s.settings || {}, null, 2)
        var status = cloneTemplate<HTMLDivElement>('wplus-status-template')
        query(status, '[data-text]').textContent = t
        el.replaceChildren(status)
        el.classList.add('open')
    }

    query(P, '[data-a="debug-log"]').onclick = function () {
        var el = byId('wp-dlog')
        if (el.classList.contains('open')) {
            el.classList.remove('open')
            return
        }
        closeAll()
        if (!W.debug) {
            setEmptyState(el, 'Engine not loaded')
            el.classList.add('open')
            return
        }
        var log = W.debug.getLog()
        if (!log.length) {
            setEmptyState(el, 'No log entries yet')
            el.classList.add('open')
            return
        }
        var rows = document.createDocumentFragment()
        log.slice()
            .reverse()
            .forEach(function (e) {
                var row = cloneTemplate<HTMLDivElement>(
                    'wplus-debug-row-template',
                )
                query(row, '[data-time]').textContent = e.ts
                var category = query<HTMLSpanElement>(row, '[data-category]')
                category.textContent = '[' + e.cat + ']'
                category.dataset.category = e.cat
                query(row, '[data-message]').textContent = e.msg
                query(row, '[data-data]').textContent = e.data || ''
                rows.appendChild(row)
            })
        el.replaceChildren(rows)
        el.classList.add('open')
    }

    query(P, '[data-a="debug-clear"]').onclick = function () {
        if (W.debug) {
            W.debug.clear()
            byId('wp-dlog').classList.remove('open')
            byId('wp-dlog').replaceChildren()
        }
    }

    // Debug toggle controls engine logging
    // Already handled by the generic toggle handler — just wire it up
    queryAll<HTMLDivElement>(P, '.wpp-tg').forEach(function (el) {
        if (el.dataset.t === 'debugEnabled') {
            el.onclick = function (e: MouseEvent) {
                e.stopPropagation()
                var on = !el.classList.contains('on')
                el.classList.toggle('on')
                setCfg('debugEnabled', on)
                if (W.debug) {
                    if (on) W.debug.enable()
                    else W.debug.disable()
                }
            }
        }
    })

    // ── Message Preview Popup ──────────────────────────────
    function showPreview(m: DeletedMessage): void {
        var old = document.getElementById('wplus-preview')
        if (old) old.remove()

        var sender = m.sender ? (m.sender + '').split('@')[0] : 'Unknown'
        var time = new Date(m.time).toLocaleString()

        uiLog('Preview opened', {
            type: m.type,
            sender: sender,
            time: time,
            id: (m.id || '?').substring(0, 40),
            hasMedia: !!(m.media || m.mediaFile),
            bodyLen: (m.body || '').length,
            chat: m.chat || '?',
        })
        var hasMedia = !!m.media
        var overlay = cloneTemplate<HTMLDivElement>('wplus-preview-template')
        overlay.onclick = function (e) {
            if (e.target === overlay) overlay.remove()
        }
        query(overlay, '[data-sender]').textContent = '+' + sender
        query(overlay, '[data-header-time]').textContent = time
        var previewBubble = query(overlay, '.wplus-preview-bubble')
        var detailsRow = query(previewBubble, '.wplus-preview-time-type')
        var mediaContainer = query(overlay, '[data-media]')

        // Resolve media source: file server > data URL > base64 body > thumbnail
        var mediaUrl: string | null = null
        var rawBody = m.body || m.text || ''
        var isBase64 =
            rawBody.length > 100 &&
            /^\/9j\/|^data:|^AAAA|^UklG|^iVBOR|^T2dn|^GkXE/i.test(rawBody)
        var isMediaType =
            ['image', 'video', 'ptt', 'audio', 'sticker', 'document'].indexOf(
                m.type,
            ) !== -1
        var mimeMap: Record<string, string> = {
            image: 'image/jpeg',
            video: 'video/mp4',
            ptt: 'audio/ogg',
            audio: 'audio/mpeg',
            sticker: 'image/webp',
        }

        // Priority 1: file on disk (served by file server)
        if (m.mediaFile) {
            mediaUrl = 'http://127.0.0.1:18733/media/' + m.mediaFile
        }
        // Priority 2: data URL in media field
        else if (m.media && m.media.length > 50) {
            mediaUrl = m.media
        }
        // Priority 3: base64 in body (for images this is the actual image, for video it's just a thumbnail)
        else if (isBase64 && isMediaType) {
            var bodyData = rawBody.startsWith('data:')
                ? rawBody
                : 'data:' +
                  (mimeMap[m.type] || 'application/octet-stream') +
                  ';base64,' +
                  rawBody
            mediaUrl = bodyData
        }

        var hasMedia = !!mediaUrl

        // Render media
        if (hasMedia && (m.type === 'image' || m.type === 'sticker')) {
            var previewImage = appendTemplate<HTMLImageElement>(
                mediaContainer,
                'wplus-preview-image-template',
            )
            previewImage.src = mediaUrl!
            previewImage.onerror = function () {
                previewImage.hidden = true
            }
            appendTemplate(mediaContainer, 'wplus-preview-image-hint-template')
        } else if (hasMedia && m.type === 'video') {
            // Small base64 video sources are thumbnails, not playable video.
            if (
                !m.mediaFile &&
                !m.media &&
                isBase64 &&
                rawBody.length < 10000
            ) {
                var thumbnail = appendTemplate<HTMLDivElement>(
                    mediaContainer,
                    'wplus-preview-video-thumb-template',
                )
                query<HTMLImageElement>(thumbnail, 'img').src = mediaUrl!
                appendTemplate(
                    mediaContainer,
                    'wplus-preview-video-note-template',
                )
            } else {
                var previewVideo = appendTemplate<HTMLVideoElement>(
                    mediaContainer,
                    'wplus-preview-video-template',
                )
                query<HTMLSourceElement>(previewVideo, 'source').src = mediaUrl!
                appendTemplate(
                    mediaContainer,
                    'wplus-preview-fullscreen-template',
                )
            }
        } else if (hasMedia && (m.type === 'ptt' || m.type === 'audio')) {
            var audioPreview = appendTemplate<HTMLDivElement>(
                mediaContainer,
                'wplus-preview-audio-template',
            )
            query<HTMLAudioElement>(audioPreview, 'audio').src = mediaUrl!
        } else if (isMediaType && !hasMedia) {
            var typeLabel =
                (
                    {
                        image: '\u{1F4F7} Image',
                        video: '\u{1F3AC} Video',
                        ptt: '\u{1F3A4} Voice',
                        audio: '\u{1F3B5} Audio',
                        sticker: '\u{1F3A8} Sticker',
                        document: '\u{1F4C4} Document',
                    } as Record<string, string>
                )[m.type] || m.type
            var unavailable = appendTemplate<HTMLDivElement>(
                mediaContainer,
                'wplus-preview-unavailable-template',
            )
            query(unavailable, '[data-label]').textContent =
                typeLabel + ' \u2014 media not available'
        }

        if (m.caption && hasMedia) {
            var mediaCaption = appendTemplate<HTMLDivElement>(
                previewBubble,
                'wplus-preview-caption-template',
            )
            previewBubble.insertBefore(mediaCaption, detailsRow)
            query(mediaCaption, '[data-text]').textContent =
                m.caption.substring(0, 300)
        }

        if (
            !isBase64 &&
            rawBody.length > 0 &&
            rawBody.length < 5000 &&
            (m.type === 'chat' || m.type === 'vcard' || m.type === 'location')
        ) {
            var messageText = appendTemplate<HTMLDivElement>(
                previewBubble,
                'wplus-preview-text-template',
            )
            previewBubble.insertBefore(messageText, detailsRow)
            query(messageText, '[data-text]').textContent = rawBody.substring(
                0,
                2000,
            )
        }
        if (m.caption) {
            var fullCaption = appendTemplate<HTMLDivElement>(
                previewBubble,
                'wplus-preview-full-caption-template',
            )
            previewBubble.insertBefore(fullCaption, detailsRow)
            query(fullCaption, '[data-text]').textContent = m.caption.substring(
                0,
                500,
            )
        }

        query(overlay, '[data-type]').textContent = m.type
        query(overlay, '[data-clock]').textContent = new Date(
            m.time,
        ).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })
        query<HTMLButtonElement>(overlay, '#wplus-preview-dl').hidden =
            !hasMedia
        document.body.appendChild(overlay)

        // Events
        byId('wplus-preview-close').onclick = function () {
            overlay.remove()
        }
        byId('wplus-preview-goto').onclick = function () {
            overlay.remove()
            if (W.goToMessage) W.goToMessage(m.id)
        }

        // Image click → fullscreen viewer with zoom
        var previewImg = document.getElementById(
            'wplus-preview-img',
        ) as HTMLImageElement | null
        if (previewImg) {
            previewImg.onclick = function () {
                openMediaViewer(mediaUrl as string, m.type, sender, m.time)
            }
        }

        // Video fullscreen button
        var fsBtn = document.getElementById('wplus-preview-fullscreen')
        if (fsBtn) {
            fsBtn.onclick = function () {
                openMediaViewer(mediaUrl as string, 'video', sender, m.time)
            }
        }

        // Download button
        var dlBtn = document.getElementById(
            'wplus-preview-dl',
        ) as HTMLButtonElement | null
        if (dlBtn && hasMedia) {
            dlBtn.onclick = function () {
                var ext =
                    (
                        {
                            image: 'jpg',
                            video: 'mp4',
                            ptt: 'ogg',
                            audio: 'mp3',
                            sticker: 'webp',
                        } as Record<string, string>
                    )[m.type] || 'bin'
                var a = document.createElement('a')
                a.href = mediaUrl as string
                a.download =
                    'WPlus_' +
                    m.type +
                    '_' +
                    sender +
                    '_' +
                    new Date(m.time).toISOString().slice(0, 10) +
                    '.' +
                    ext
                a.click()
            }
        }
    }

    // ── Fullscreen Media Viewer (image zoom + video player) ──
    function openMediaViewer(
        dataUrl: string,
        type: string,
        sender: string,
        time: number,
    ): void {
        uiLog('Media viewer opened', {
            type: type,
            sender: sender,
            srcLen: dataUrl ? dataUrl.length : 0,
            isBlob: dataUrl ? dataUrl.indexOf('blob:') === 0 : false,
            isData: dataUrl ? dataUrl.indexOf('data:') === 0 : false,
            isHttp: dataUrl ? dataUrl.indexOf('http') === 0 : false,
        })
        var oldViewer = document.getElementById('wplus-media-viewer')
        if (oldViewer) oldViewer.remove()

        var viewer = cloneTemplate<HTMLDivElement>('wplus-viewer-template')
        var topBar = query(viewer, '.wplus-media-topbar')
        query(viewer, '[data-title]').textContent =
            '+' + (sender || '?') + ' \u00B7 ' + new Date(time).toLocaleString()
        var actions = query(viewer, '[data-actions]')
        var dlDiv = appendTemplate<HTMLSpanElement>(
            actions,
            'wplus-viewer-save-template',
        )
        dlDiv.textContent = '\u{2B73} Save'
        dlDiv.onclick = function (e) {
            e.stopPropagation()
            var ext =
                (
                    {
                        image: 'jpg',
                        video: 'mp4',
                        ptt: 'ogg',
                        audio: 'mp3',
                        sticker: 'webp',
                    } as Record<string, string>
                )[type] || 'bin'
            var a = document.createElement('a')
            a.href = dataUrl
            a.download =
                'WPlus_' +
                type +
                '_' +
                (sender || 'media') +
                '_' +
                new Date(time).toISOString().slice(0, 10) +
                '.' +
                ext
            a.click()
        }
        topBar.appendChild(dlDiv)

        // Close button
        var closeBtn = appendTemplate<HTMLSpanElement>(
            actions,
            'wplus-viewer-close-template',
        )
        closeBtn.textContent = '\u{2715}'
        closeBtn.onclick = function () {
            viewer.remove()
        }

        // Media container
        var container = query<HTMLDivElement>(viewer, '[data-container]')

        if (type === 'image' || type === 'sticker') {
            var img = document.createElement('img')
            img.src = dataUrl
            img.classList.add('wplus-media-image')

            // Zoom controls
            var scale = 1,
                posX = 0,
                posY = 0,
                isDragging = false,
                startX = 0,
                startY = 0

            img.onwheel = function (e) {
                e.preventDefault()
                var delta = e.deltaY > 0 ? -0.15 : 0.15
                scale = Math.max(0.5, Math.min(5, scale + delta))
                img.style.transform =
                    'scale(' +
                    scale +
                    ') translate(' +
                    posX +
                    'px,' +
                    posY +
                    'px)'
            }

            img.onmousedown = function (e) {
                if (scale <= 1) return
                isDragging = true
                startX = e.clientX - posX
                startY = e.clientY - posY
                img.classList.add('is-grabbing')
                e.preventDefault()
            }
            container.onmousemove = function (e) {
                if (!isDragging) return
                posX = e.clientX - startX
                posY = e.clientY - startY
                img.style.transform =
                    'scale(' +
                    scale +
                    ') translate(' +
                    posX +
                    'px,' +
                    posY +
                    'px)'
            }
            container.onmouseup = function () {
                isDragging = false
                img.classList.remove('is-grabbing')
                img.classList.toggle('is-fit', scale <= 1)
            }

            // Double click to zoom in/out
            img.ondblclick = function () {
                if (scale > 1) {
                    scale = 1
                    posX = 0
                    posY = 0
                } else {
                    scale = 2.5
                }
                img.style.transform = 'scale(' + scale + ') translate(0px,0px)'
                posX = 0
                posY = 0
            }

            container.appendChild(img)

            // Zoom hint
            var hint = appendTemplate<HTMLDivElement>(
                container,
                'wplus-viewer-hint-template',
            )
            hint.textContent =
                'Scroll to zoom \u00B7 Double-click to fit \u00B7 Drag to pan'
        } else if (type === 'video') {
            var vid = document.createElement('video')
            vid.src = dataUrl
            vid.controls = true
            vid.autoplay = true
            vid.classList.add('wplus-media-video')
            vid.onclick = function (e) {
                e.stopPropagation()
            }

            // Fullscreen on double-click
            vid.ondblclick = function () {
                if (vid.requestFullscreen) vid.requestFullscreen()
                else if (
                    (
                        vid as HTMLVideoElement & {
                            webkitRequestFullscreen?: () => Promise<void>
                        }
                    ).webkitRequestFullscreen
                )
                    (
                        vid as HTMLVideoElement & {
                            webkitRequestFullscreen?: () => Promise<void>
                        }
                    ).webkitRequestFullscreen!()
            }

            // Mouse wheel volume control
            var volIndicator = document.createElement('div')
            volIndicator.className = 'wplus-media-volume'
            var volTimer: ReturnType<typeof setTimeout> | null = null
            vid.onwheel = function (e) {
                e.preventDefault()
                var delta = e.deltaY > 0 ? -0.05 : 0.05
                vid.volume = Math.max(0, Math.min(1, vid.volume + delta))
                volIndicator.textContent =
                    '\u{1F50A} ' + Math.round(vid.volume * 100) + '%'
                volIndicator.classList.add('visible')
                if (volTimer) clearTimeout(volTimer)
                volTimer = setTimeout(function () {
                    volIndicator.classList.remove('visible')
                }, 1500)
            }

            container.appendChild(vid)
            container.appendChild(volIndicator)

            var hint2 = appendTemplate<HTMLDivElement>(
                container,
                'wplus-viewer-hint-template',
            )
            hint2.textContent =
                'Double-click for fullscreen \u00B7 Scroll to adjust volume'
        } else if (type === 'ptt' || type === 'audio') {
            var aud = document.createElement('audio')
            aud.src = dataUrl
            aud.controls = true
            aud.autoplay = true
            aud.classList.add('wplus-media-audio')
            aud.onclick = function (e) {
                e.stopPropagation()
            }
            container.appendChild(aud)
        }

        viewer.appendChild(container)

        // Click background to close (not on media)
        viewer.onclick = function (e) {
            if (e.target === viewer || e.target === container) viewer.remove()
        }

        // Escape key to close
        var escHandler = function (e: KeyboardEvent) {
            if (e.key === 'Escape') {
                viewer.remove()
                document.removeEventListener('keydown', escHandler)
            }
        }
        document.addEventListener('keydown', escHandler)

        document.body.appendChild(viewer)
    }

    // ── Update Check ───────────────────────────────────────
    var updateUrl: string | null = null
    function checkForUpdate(): void {
        if (cfg('checkUpdates') === false) return
        try {
            fetch(
                'https://api.github.com/repos/KuchiSofts/WPlus/releases/latest',
                { headers: { Accept: 'application/json' } },
            )
                .then(function (r) {
                    return r.json() as Promise<{
                        tag_name?: string
                        html_url?: string
                    }>
                })
                .then(function (data) {
                    var latest = (data.tag_name || '').replace(/^v/, '')
                    if (!latest) return
                    var cur = '2.0.0'
                    if (
                        latest.split('.').map(Number).join('.') >
                        cur.split('.').map(Number).join('.')
                    ) {
                        updateUrl =
                            data.html_url ||
                            'https://github.com/KuchiSofts/WPlus/releases/latest'
                        // Show update bar
                        var bar = document.getElementById('wplus-update-bar')
                        if (bar) {
                            bar.classList.add('visible')
                            byId('wplus-update-text').textContent =
                                'Update v' +
                                latest +
                                ' available — tap to download'
                        }
                        // Add indicator dot to sidebar icon
                        var dot = document.getElementById('wplus-update-dot')
                        if (!dot) {
                            dot = document.createElement('span')
                            dot.id = 'wplus-update-dot'
                            dot.className = 'wplus-update-dot'
                            var sideBtn = document.getElementById('wplus-btn')
                            if (sideBtn) {
                                sideBtn.classList.add('wplus-position-relative')
                                sideBtn.appendChild(dot)
                            }
                        }
                    }
                })
                .catch(function () {})
        } catch (e) {}
    }

    // Update bar click
    var updateBar = document.getElementById('wplus-update-bar')
    if (updateBar) {
        updateBar.onclick = function () {
            if (updateUrl) window.open(updateUrl, '_blank')
            else
                window.open(
                    'https://github.com/KuchiSofts/WPlus/releases/latest',
                    '_blank',
                )
        }
    }

    // Check after 15 seconds
    setTimeout(checkForUpdate, 15000)

    // ── Sidebar icon positioning ───────────────────────────
    function pos(): void {
        var controls: Array<{ top: number; bottom: number; left: number }> = []
        document
            .querySelectorAll<HTMLElement>('button,[role=button]')
            .forEach(function (element) {
                if (element === btn) return
                var rect = element.getBoundingClientRect()
                var style = getComputedStyle(element)
                if (
                    rect.left < 64 &&
                    rect.left >= 0 &&
                    rect.width >= 20 &&
                    rect.width <= 60 &&
                    rect.height >= 20 &&
                    rect.height <= 60 &&
                    rect.bottom > 32 &&
                    rect.top < window.innerHeight - 32 &&
                    style.display !== 'none' &&
                    style.visibility !== 'hidden'
                ) {
                    controls.push({
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                    })
                }
            })

        controls.sort(function (a, b) {
            return a.top - b.top
        })
        var occupied: Array<{ top: number; bottom: number }> = []
        controls.forEach(function (control) {
            var last = occupied[occupied.length - 1]
            if (last && control.top <= last.bottom + 8) {
                last.bottom = Math.max(last.bottom, control.bottom)
            } else {
                occupied.push({ top: control.top, bottom: control.bottom })
            }
        })

        var railLeft = controls.length
            ? Math.min.apply(
                  null,
                  controls.map(function (control) {
                      return control.left
                  }),
              )
            : 8
        var safeTop = 40
        var safeBottom = window.innerHeight - 8
        var gaps: Array<{ top: number; height: number }> = []
        var cursor = safeTop
        occupied.forEach(function (control) {
            var gapEnd = Math.min(control.top - 8, safeBottom)
            if (gapEnd > cursor) {
                gaps.push({ top: cursor, height: gapEnd - cursor })
            }
            cursor = Math.max(cursor, control.bottom + 8)
        })
        if (safeBottom > cursor) {
            gaps.push({ top: cursor, height: safeBottom - cursor })
        }

        gaps.sort(function (a, b) {
            return b.height - a.height
        })
        var slot = gaps.find(function (gap) {
            return gap.height >= 40
        })
        if (!slot) {
            slot = gaps.find(function (gap) {
                return gap.height >= 32
            })
        }
        if (!slot) {
            btn.style.display = 'none'
            return
        }

        var size = Math.min(40, slot.height)
        btn.style.display = 'flex'
        btn.style.width = size + 'px'
        btn.style.height = size + 'px'
        btn.style.left = Math.round(railLeft) + 'px'
        btn.style.top = Math.round(slot.top + (slot.height - size) / 2) + 'px'
    }
    pos()
    window.addEventListener('resize', pos)
    setInterval(pos, 10000) // Check every 10s instead of 3s

    // ── Chat header restore button ────────────────────────
    // Restore button — find the flex container that holds Search+Menu, insert as first child
    function injectRestoreBtn(): void {
        var old = document.getElementById('wplus-header-restore')

        // Find Search button in right panel header
        var searchButtons: HTMLButtonElement[] = []
        document
            .querySelectorAll<HTMLButtonElement>('button')
            .forEach(function (el) {
                var r = el.getBoundingClientRect()
                var t = (el.title || el.ariaLabel || '').toLowerCase()
                if (
                    r.x > 500 &&
                    r.y > 30 &&
                    r.y < 90 &&
                    r.width >= 30 &&
                    t.indexOf('search') !== -1
                )
                    searchButtons.push(el)
            })
        var searchBtn = searchButtons[searchButtons.length - 1]
        if (!searchBtn) {
            if (old) old.remove()
            return
        }

        // Walk UP from Search button to find the flex container that holds all header action buttons
        // It's the div with display:flex that has 2+ direct children (Search wrapper + Menu wrapper + optional Call)
        var flexContainer: HTMLElement | null = null
        var el: HTMLElement | null = searchBtn
        for (var i = 0; i < 6; i++) {
            el = el.parentElement
            if (!el) break
            var cs = getComputedStyle(el)
            var r = el.getBoundingClientRect()
            // The flex container: display:flex, reasonable width (80-300px), in header area, has 2+ children
            if (
                cs.display === 'flex' &&
                cs.flexDirection === 'row' &&
                r.height < 80 &&
                el.children.length >= 2
            ) {
                flexContainer = el
                break
            }
        }
        if (!flexContainer) {
            if (old) old.remove()
            return
        }

        // Check if already inserted in this container
        if (old && old.parentElement === flexContainer) return
        if (old) old.remove()

        // Create a wrapper div matching the same structure as Search/Menu wrappers
        var wrapper = cloneTemplate<HTMLDivElement>(
            'wplus-restore-button-template',
        )
        var rb = query<HTMLButtonElement>(wrapper, 'button')

        rb.onclick = function (e) {
            e.stopPropagation()
            if (!W || !W.forceRestoreCurrentChat) return
            rb.classList.add('loading')
            rb.querySelector<HTMLSpanElement>('.wplus-tip')!.textContent =
                'Restoring...'
            W.forceRestoreCurrentChat(function (count) {
                rb.classList.remove('loading')
                rb.classList.toggle('restored', count > 0)
                rb.classList.toggle('failed', count <= 0)
                rb.querySelector<HTMLSpanElement>('.wplus-tip')!.textContent =
                    count > 0 ? count + ' restored!' : 'No deleted found'
                setTimeout(function () {
                    rb.querySelector<HTMLSpanElement>(
                        '.wplus-tip',
                    )!.textContent = 'Restore deleted'
                    rb.classList.remove('restored', 'failed')
                }, 3000)
            })
        }

        wrapper.appendChild(rb)
        // Insert as FIRST child of the flex container (before Search and Menu)
        flexContainer.insertBefore(wrapper, flexContainer.firstChild)
    }

    // Watch for chat changes — inject header button + position scroll-up
    var _injDebounce: ReturnType<typeof setTimeout> | null = null
    new MutationObserver(function () {
        if (_injDebounce) clearTimeout(_injDebounce)
        _injDebounce = setTimeout(function () {
            injectRestoreBtn()
            checkScrollUp()
        }, 500)
    }).observe(document.getElementById('app') || document.body, {
        childList: true,
        subtree: true,
    })
    injectRestoreBtn()

    // ── Scroll Up / Load Older Messages button ────────────
    var scrollUpBtn = cloneTemplate<HTMLButtonElement>(
        'wplus-scroll-button-template',
    )
    document.body.appendChild(scrollUpBtn)

    var _loadingOlder = false
    scrollUpBtn.onclick = function (e) {
        e.stopPropagation()
        if (_loadingOlder) return
        _loadingOlder = true
        scrollUpBtn.classList.add('loading')

        try {
            // Find active chat via engine
            var CC = waRequire('WAWebChatCollection').ChatCollection
            var chatState: { current: UiWAChat | null } = { current: null }

            // Method 1: Find by header name
            var headers = document.querySelectorAll('header')
            headers.forEach(function (h) {
                var r = h.getBoundingClientRect()
                if (r.x > 400 && r.width > 200) {
                    h.querySelectorAll(
                        'span[dir="auto"],span.x1iyjqo2',
                    ).forEach(function (s) {
                        var name = s.textContent.trim()
                        if (name && !chatState.current)
                            (CC._models || []).forEach(function (c) {
                                if (
                                    c.__x_name === name ||
                                    c.__x_formattedTitle === name
                                )
                                    chatState.current = c
                            })
                    })
                }
            })

            // Method 2: Find by checking which chat has active/focus
            if (!chatState.current)
                (CC._models || []).forEach(function (c) {
                    if (c.__x_active) chatState.current = c
                })

            var chat = chatState.current
            if (!chat) {
                _loadingOlder = false
                scrollUpBtn.classList.remove('loading')
                return
            }

            var activeChat = chat
            var loader = waRequire('WAWebChatLoadMessages')
            var before =
                activeChat.msgs && activeChat.msgs._models
                    ? activeChat.msgs._models.length
                    : 0

            loader
                .loadEarlierMsgs(activeChat)
                .then(function () {
                    var after =
                        activeChat.msgs && activeChat.msgs._models
                            ? activeChat.msgs._models.length
                            : 0
                    var loaded = after - before
                    _loadingOlder = false
                    scrollUpBtn.classList.remove('loading')

                    var badge =
                        scrollUpBtn.querySelector<HTMLSpanElement>(
                            '.wplus-count',
                        )!
                    if (loaded > 0) {
                        badge.textContent = '+' + loaded
                        badge.classList.add('visible')
                        setTimeout(function () {
                            badge.classList.remove('visible')
                        }, 3000)

                        // Scroll to top — try multiple scroll container selectors
                        setTimeout(function () {
                            var scrolled = false
                            document
                                .querySelectorAll<HTMLDivElement>(
                                    '[role="application"] div, #main div, [data-tab] div',
                                )
                                .forEach(function (el) {
                                    if (scrolled) return
                                    if (
                                        el.scrollHeight >
                                            el.clientHeight + 100 &&
                                        el.clientHeight > 200
                                    ) {
                                        var r = el.getBoundingClientRect()
                                        if (r.x > 400 && r.width > 300) {
                                            el.scrollTop = 0
                                            scrolled = true
                                        }
                                    }
                                })
                        }, 300)
                    } else {
                        badge.textContent = '\u{2714}'
                        badge.classList.add('visible')
                        scrollUpBtn.title = 'No more messages'
                        setTimeout(function () {
                            badge.classList.remove('visible')
                            scrollUpBtn.title = 'Load older messages'
                        }, 2000)
                    }
                })
                .catch(function () {
                    _loadingOlder = false
                    scrollUpBtn.classList.remove('loading')
                })
        } catch (ex) {
            _loadingOlder = false
            scrollUpBtn.classList.remove('loading')
        }
    }

    // Show/hide scroll-up button based on whether a chat is open
    function checkScrollUp(): void {
        var hasChat = false
        document.querySelectorAll<HTMLElement>('header').forEach(function (h) {
            if (
                h.getBoundingClientRect().x > 400 &&
                h.getBoundingClientRect().width > 200
            )
                hasChat = true
        })
        scrollUpBtn.classList.toggle('visible', hasChat)
    }
    checkScrollUp()

    return 'ok'
})()
