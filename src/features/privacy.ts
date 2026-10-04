// WPlus Privacy Features — blur, hide typing, hide online, etc.
import { BLUR_CSS } from '../constants'
import privacyCss from '../styles/privacy.css'
import { findExport, originals } from '../utils/modules'
import { dbg } from '../utils/debug'
import type { PrivacyHookName } from '../types'

let presenceInterval: ReturnType<typeof setInterval> | null = null

function isBlurFeature(id: string): id is keyof typeof BLUR_CSS {
    return Object.prototype.hasOwnProperty.call(BLUR_CSS, id)
}

export function applyToggle(id: string, on: boolean): void {
    // Hide typing
    if (id === 'hideTyping') {
        const comp = findExport('markComposing')
        if (comp && originals.markComposing) {
            if (on) {
                comp.markComposing = () => {}
                comp.markRecording = () => {}
            } else {
                comp.markComposing = originals.markComposing
                if (originals.markRecording)
                    comp.markRecording = originals.markRecording
            }
        }
    }

    // Hide online
    if (id === 'hideOnline') {
        const pres = findExport('sendPresenceAvailable')
        if (pres && originals.sendPresenceAvailable) {
            if (on) {
                pres.sendPresenceAvailable = () => {}
                if (!presenceInterval) {
                    const pu = findExport('sendPresenceUnavailable')
                    const sendUnavailable = pu?.sendPresenceUnavailable
                    if (typeof sendUnavailable === 'function') {
                        presenceInterval = setInterval(() => {
                            try {
                                sendUnavailable()
                            } catch {}
                        }, 1000)
                    }
                }
            } else {
                pres.sendPresenceAvailable = originals.sendPresenceAvailable
                if (presenceInterval) {
                    clearInterval(presenceInterval)
                    presenceInterval = null
                }
            }
        }
    }

    // Disable read receipts
    if (id === 'disableReceipts') {
        const seen = findExport('sendConversationSeen')
        if (seen && originals.sendConversationSeen) {
            if (on) {
                seen.sendConversationSeen = () => Promise.resolve()
            } else {
                seen.sendConversationSeen = originals.sendConversationSeen
            }
        }
    }

    // Private audio
    if (id === 'playAudioPrivate') {
        const pl = findExport('markPlayed')
        if (pl && originals.markPlayed) {
            if (on) pl.markPlayed = () => {}
            else pl.markPlayed = originals.markPlayed
        }
    }

    // Blur features — inject/remove CSS <style> tags
    if (isBlurFeature(id)) {
        const blurConfig = BLUR_CSS[id]
        const styleId = `wplus-css-${id}`
        const existing = document.getElementById(styleId)

        if (on && !existing) {
            const style = document.createElement('style')
            style.id = styleId
            const hoverSelectors = blurConfig.selectors
                .split(',')
                .map((selector) => `${selector}:hover`)
                .join(',')
            style.textContent = privacyCss
                .replace('__WPLUS_SELECTORS__', blurConfig.selectors)
                .replace('__WPLUS_HOVER_SELECTORS__', hoverSelectors)
                .replace('__WPLUS_BLUR__', id === 'blurPhotos' ? '8' : '5')
            document.head.appendChild(style)
        } else if (!on && existing) {
            existing.remove()
        }
    }
}

export function cleanupPrivacy(): void {
    if (presenceInterval) {
        clearInterval(presenceInterval)
        presenceInterval = null
    }

    // Restore all original functions
    const hookNames = Object.keys(originals) as PrivacyHookName[]
    for (const name of hookNames) {
        const fn = originals[name]
        if (!fn) continue
        try {
            const mod = findExport(name)
            if (mod) mod[name] = fn
        } catch {}
    }

    // Remove blur CSS
    ;(Object.keys(BLUR_CSS) as Array<keyof typeof BLUR_CSS>).forEach((id) => {
        const el = document.getElementById(`wplus-css-${id}`)
        if (el) el.remove()
    })
}
