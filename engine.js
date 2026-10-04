"use strict";
(() => {
  // src/constants.ts
  var VERSION = "2.0";
  var MAX_DELETED_MSGS = 1e3;
  var MAX_DEBUG_LOG = 500;
  var DEBUG_BATCH_INTERVAL = 5e3;
  var FILE_SERVER_PORT = 18733;
  var FILE_SERVER_URL = `http://127.0.0.1:${FILE_SERVER_PORT}`;
  var WA_MODULES = {
    ChatCollection: "WAWebChatCollection",
    ContactCollection: "WAWebContactCollection",
    GroupMetadata: "WAWebGroupMetadataCollection",
    Cmd: "WAWebCmd",
    ChatLoadMessages: "WAWebChatLoadMessages",
    ChatMessageSearch: "WAWebChatMessageSearch",
    PhoneNumberContactAction: "WAWebPhoneNumberContactAction"
  };
  var BACKUP_TYPES = [
    "chat",
    "image",
    "video",
    "ptt",
    "audio",
    "document",
    "sticker",
    "vcard",
    "location"
  ];
  var MEDIA_TYPES = [
    "image",
    "video",
    "ptt",
    "audio",
    "sticker",
    "document"
  ];
  var STORAGE = {
    deletedMsgs: "wplus_del",
    settings: "wplus_cfg",
    debugLog: "wplus_log",
    syncFlag: "wplus_sync_now"
  };
  var BLUR_CSS = {
    blurMessages: {
      selectors: `span.selectable-text,[data-pre-plain-text],.copyable-text,._ak8k,.message-in .copyable-text,.message-out .copyable-text`
    },
    blurContacts: {
      selectors: `span[title][dir],span._ahxt,header span[dir="auto"],header span.x1iyjqo2,[data-testid="conversation-header"] span,[data-testid="cell-frame-title"] span,.message-in span._ahxt,span[aria-label*="Maybe"]`
    },
    blurPhotos: {
      selectors: `img[draggable="false"],img[src*="pps.whatsapp.net"],img[src*="mmg.whatsapp.net"]`
    }
  };

  // src/utils/debug.ts
  var debugEnabled = true;
  var debugLog = [];
  var batchTimer = null;
  function dbg(category, msg, data) {
    if (!debugEnabled) return;
    const entry = {
      t: Date.now(),
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      cat: category,
      msg
    };
    if (data !== void 0) {
      entry.data = typeof data === "object" ? JSON.stringify(data).substring(0, 200) : String(data);
    }
    debugLog.push(entry);
    if (debugLog.length > MAX_DEBUG_LOG) {
      debugLog = debugLog.slice(-MAX_DEBUG_LOG);
    }
    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        batchTimer = null;
        try {
          localStorage.setItem(STORAGE.debugLog, JSON.stringify(debugLog));
        } catch {
        }
      }, DEBUG_BATCH_INTERVAL);
    }
    console.log(
      `[WPlus:${category}] ${msg}${data !== void 0 ? " | " + entry.data : ""}`
    );
  }
  function createDebugAPI(getStatus) {
    return {
      getLog: () => debugLog.slice(),
      getLogText: () => debugLog.map(
        (e) => `${e.ts} [${e.cat}] ${e.msg}${e.data ? " | " + e.data : ""}`
      ).join("\n"),
      clear: () => {
        debugLog = [];
        dbg("debug", "Log cleared");
      },
      enable: () => {
        debugEnabled = true;
        dbg("debug", "Debug enabled");
      },
      disable: () => {
        debugEnabled = false;
      },
      isEnabled: () => debugEnabled,
      status: () => ({
        ...getStatus(),
        logEntries: debugLog.length
      })
    };
  }
  function cleanupDebug() {
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }
  }

  // src/utils/storage.ts
  var LS = {
    get(key, fallback) {
      try {
        const val = localStorage.getItem(key);
        if (!val) return fallback;
        const parsed = JSON.parse(val);
        return parsed;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, String(JSON.stringify(value)));
    },
    del(key) {
      localStorage.removeItem(key);
    }
  };
  function settings(key, value) {
    const s = LS.get(STORAGE.settings, {});
    if (value === void 0) return key ? s[key] : s;
    s[key] = value;
    LS.set(STORAGE.settings, s);
    return value;
  }
  var merged = false;
  function mergeOldKeys() {
    if (merged) return;
    merged = true;
    const current = LS.get(STORAGE.deletedMsgs, []);
    const ids = new Set(current.map((m) => m.id));
    const oldKeys = ["wplus_deleted_msgs", "wtplus_deleted_msgs", "wtplus_del"];
    let added = 0;
    for (const key of oldKeys) {
      try {
        const old = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(old)) {
          for (const m of old) {
            if (m.id && !ids.has(m.id)) {
              current.push(m);
              ids.add(m.id);
              added++;
            }
          }
        }
      } catch {
      }
    }
    if (added > 0) {
      const trimmed = current.length > MAX_DELETED_MSGS ? current.slice(-MAX_DELETED_MSGS) : current;
      LS.set(STORAGE.deletedMsgs, trimmed);
    }
  }
  function deletedMsgs(action, item) {
    mergeOldKeys();
    let d = LS.get(STORAGE.deletedMsgs, []);
    if (action === "get") return d;
    if (action === "add" && item) {
      const exists = d.some((m) => m.id === item.id);
      if (!exists) {
        d.push(item);
        if (d.length > MAX_DELETED_MSGS) d = d.slice(-MAX_DELETED_MSGS);
        LS.set(STORAGE.deletedMsgs, d);
      }
    }
    if (action === "clear") {
      LS.del(STORAGE.deletedMsgs);
      return [];
    }
    return d;
  }

  // src/utils/modules.ts
  var CC = null;
  var CON = null;
  var GRP = null;
  var originals = {};
  function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }
  function requireModule(name) {
    const moduleLoader = window.require;
    if (!moduleLoader) throw new Error("window.require not found");
    return moduleLoader(name);
  }
  function findExport(name) {
    try {
      const modMap = requireModule(
        "__debug"
      ).modulesMap;
      const keys = Object.keys(modMap);
      for (const key of keys) {
        try {
          const mod = requireModule(key);
          const modRecord = isRecord(mod) ? mod : null;
          const defaultExport = modRecord?.default;
          const resolvedExport = isRecord(defaultExport) ? defaultExport : modRecord;
          if (resolvedExport && typeof resolvedExport[name] === "function") {
            return resolvedExport;
          }
          if (modRecord && typeof modRecord[name] === "function") {
            return modRecord;
          }
        } catch {
        }
      }
    } catch {
    }
    return null;
  }
  function initModules() {
    try {
      if (typeof window.require !== "function") {
        dbg("init", "window.require not found");
        return false;
      }
      const chatModule = requireModule(WA_MODULES.ChatCollection);
      if (!chatModule.ChatCollection?._models) {
        dbg("init", "ChatCollection not ready");
        return false;
      }
      CC = chatModule.ChatCollection;
      dbg("init", "ChatCollection found", { chats: CC._models.length });
      try {
        CON = requireModule(WA_MODULES.ContactCollection).ContactCollection || null;
        if (!CON) throw new Error("ContactCollection not found");
        dbg("init", "ContactCollection found", {
          contacts: CON._models.length
        });
      } catch (e) {
        dbg("init", "ContactCollection failed", errorMessage(e));
      }
      try {
        GRP = requireModule(WA_MODULES.GroupMetadata).GroupMetadataCollection || null;
        dbg("init", "GroupMetadata found", { groups: GRP._models.length });
      } catch {
      }
      const hookNames = [
        "markComposing",
        "markRecording",
        "sendPresenceAvailable",
        "sendPresenceUnavailable",
        "sendConversationSeen",
        "markPlayed"
      ];
      for (const name of hookNames) {
        try {
          const mod = findExport(name);
          if (mod && mod[name]) {
            originals[name] = mod[name];
            dbg("init", `${name} hook ready`);
          }
        } catch {
        }
      }
      return true;
    } catch (e) {
      dbg("init", "FATAL", errorMessage(e));
      return false;
    }
  }

  // src/styles/privacy.css
  var privacy_default = "__WPLUS_SELECTORS__ {\r\n    filter: blur(__WPLUS_BLUR__px) !important;\r\n    transition: filter 0.15s !important;\r\n}\r\n__WPLUS_HOVER_SELECTORS__ {\r\n    filter: none !important;\r\n}\r\n";

  // src/features/privacy.ts
  var presenceInterval = null;
  function isBlurFeature(id) {
    return Object.prototype.hasOwnProperty.call(BLUR_CSS, id);
  }
  function applyToggle(id, on) {
    if (id === "hideTyping") {
      const comp = findExport("markComposing");
      if (comp && originals.markComposing) {
        if (on) {
          comp.markComposing = () => {
          };
          comp.markRecording = () => {
          };
        } else {
          comp.markComposing = originals.markComposing;
          if (originals.markRecording)
            comp.markRecording = originals.markRecording;
        }
      }
    }
    if (id === "hideOnline") {
      const pres = findExport("sendPresenceAvailable");
      if (pres && originals.sendPresenceAvailable) {
        if (on) {
          pres.sendPresenceAvailable = () => {
          };
          if (!presenceInterval) {
            const pu = findExport("sendPresenceUnavailable");
            const sendUnavailable = pu?.sendPresenceUnavailable;
            if (typeof sendUnavailable === "function") {
              presenceInterval = setInterval(() => {
                try {
                  sendUnavailable();
                } catch {
                }
              }, 1e3);
            }
          }
        } else {
          pres.sendPresenceAvailable = originals.sendPresenceAvailable;
          if (presenceInterval) {
            clearInterval(presenceInterval);
            presenceInterval = null;
          }
        }
      }
    }
    if (id === "disableReceipts") {
      const seen = findExport("sendConversationSeen");
      if (seen && originals.sendConversationSeen) {
        if (on) {
          seen.sendConversationSeen = () => Promise.resolve();
        } else {
          seen.sendConversationSeen = originals.sendConversationSeen;
        }
      }
    }
    if (id === "playAudioPrivate") {
      const pl = findExport("markPlayed");
      if (pl && originals.markPlayed) {
        if (on) pl.markPlayed = () => {
        };
        else pl.markPlayed = originals.markPlayed;
      }
    }
    if (isBlurFeature(id)) {
      const blurConfig = BLUR_CSS[id];
      const styleId = `wplus-css-${id}`;
      const existing = document.getElementById(styleId);
      if (on && !existing) {
        const style = document.createElement("style");
        style.id = styleId;
        const hoverSelectors = blurConfig.selectors.split(",").map((selector) => `${selector}:hover`).join(",");
        style.textContent = privacy_default.replace("__WPLUS_SELECTORS__", blurConfig.selectors).replace("__WPLUS_HOVER_SELECTORS__", hoverSelectors).replace("__WPLUS_BLUR__", id === "blurPhotos" ? "8" : "5");
        document.head.appendChild(style);
      } else if (!on && existing) {
        existing.remove();
      }
    }
  }
  function cleanupPrivacy() {
    if (presenceInterval) {
      clearInterval(presenceInterval);
      presenceInterval = null;
    }
    const hookNames = Object.keys(originals);
    for (const name of hookNames) {
      const fn = originals[name];
      if (!fn) continue;
      try {
        const mod = findExport(name);
        if (mod) mod[name] = fn;
      } catch {
      }
    }
    ;
    Object.keys(BLUR_CSS).forEach((id) => {
      const el = document.getElementById(`wplus-css-${id}`);
      if (el) el.remove();
    });
  }

  // src/utils/server.ts
  function errorMessage2(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function serverPost(path, data) {
    try {
      fetch(FILE_SERVER_URL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then((r) => r.json()).then((r) => dbg("server", `${path} \u2192 ${JSON.stringify(r)}`)).catch(
        (e) => dbg("server", `${path} error: ${errorMessage2(e)}`)
      );
    } catch (e) {
      dbg("server", `fetch error: ${errorMessage2(e)}`);
    }
  }

  // src/features/messages.ts
  function errorMessage3(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function isMediaType(type) {
    return MEDIA_TYPES.includes(type);
  }
  function isBackupType(type) {
    return BACKUP_TYPES.includes(type);
  }
  function restoreMsg(msg, saved) {
    try {
      const header = "\u{1F6AB} *This message was deleted:*\n";
      const type = saved.type || "chat";
      if (isMediaType(type)) {
        msg.__x_type = type;
        msg.__x_body = saved.body || "";
        msg.__x_text = header + (saved.text || "");
        msg.__x_caption = header + (saved.caption || "");
        msg.__x_isMMS = true;
        msg.__x_isMedia = true;
      } else {
        msg.__x_type = "chat";
        msg.__x_body = header + (saved.body || saved.text || "");
        msg.__x_text = header + (saved.body || saved.text || "");
      }
      msg.__x_isRevoked = false;
      dbg(
        "restore",
        `Applied: ${type} | ${(saved.body || saved.text || "?").substring(0, 30)}`
      );
      return true;
    } catch (e) {
      dbg("restore", `Apply error: ${errorMessage3(e)}`);
      return false;
    }
  }
  function hookChat(chat) {
    if (!chat?.msgs || chat.msgs.__wp) return;
    chat.msgs.__wp = true;
    const chatName = chat.__x_name || chat.__x_formattedTitle || chat.id?.user || "?";
    chat.msgs.on("add", (msg) => {
      try {
        if (!msg?.isNewMsg || msg.id?.fromMe) return;
        if (!isBackupType(msg.__x_type)) return;
        msg.__x_backupBody = msg.__x_body;
        msg.__x_backupText = msg.__x_text;
        msg.__x_backupType = msg.__x_type;
        msg.__x_backupCaption = msg.__x_caption;
        msg.__x_backupMediaData = msg.__x_mediaData;
        msg.__x_backupTime = Date.now();
        msg.__x_backupSender = msg.__x_from?._serialized || "";
        const entry = {
          id: msg.__x_id._serialized,
          type: msg.__x_type,
          body: msg.__x_body || "",
          text: msg.__x_text || "",
          caption: msg.__x_caption || "",
          sender: msg.__x_backupSender,
          time: Date.now(),
          chat: chatName
        };
        const md = msg.__x_mediaData;
        if (md?.mediaBlob?._blob) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              entry.media = reader.result;
            }
            serverPost("/msg/new", entry);
          };
          reader.readAsDataURL(md.mediaBlob._blob);
        } else {
          serverPost("/msg/new", entry);
        }
        dbg("msg", `Backed up: ${msg.__x_type} in ${chatName}`);
      } catch (e) {
        dbg("msg", `Backup error: ${errorMessage3(e)}`);
      }
    });
    chat.msgs.on("change", (msg) => {
      try {
        if (!msg || msg.__x_type !== "revoked" || !msg.__x_backupType)
          return;
        const entry = {
          id: msg.__x_id._serialized,
          type: msg.__x_backupType,
          body: msg.__x_backupBody || "",
          text: msg.__x_backupText || "",
          caption: msg.__x_backupCaption || "",
          sender: msg.__x_backupSender || "",
          time: msg.__x_backupTime || Date.now(),
          chat: chatName
        };
        const md = msg.__x_backupMediaData || msg.__x_mediaData;
        if (md?.mediaBlob?._blob) {
          const reader = new FileReader();
          reader.onload = () => {
            entry.media = reader.result;
            deletedMsgs("add", entry);
            serverPost("/msg/deleted", entry);
            const d = deletedMsgs("get");
            for (let i = d.length - 1; i >= 0; i--) {
              if (d[i].id === entry.id) {
                d[i].media = entry.media;
                break;
              }
            }
          };
          reader.readAsDataURL(md.mediaBlob._blob);
        }
        deletedMsgs("add", entry);
        serverPost("/msg/deleted", entry);
        restoreMsg(msg, entry);
        window.dispatchEvent(new CustomEvent("wplus-update"));
      } catch (e) {
        dbg("msg", `Deletion handler error: ${errorMessage3(e)}`);
      }
    });
  }
  function hookAllChats() {
    if (!CC) return;
    CC._models.forEach(hookChat);
    CC.on("add", hookChat);
    dbg("msg", `Hooked ${CC._models.length} chats`);
  }

  // src/features/navigation.ts
  function errorMessage4(error) {
    return error instanceof Error ? error.message : String(error);
  }
  function extractJid(msgId) {
    const firstUs = msgId.indexOf("_");
    if (firstUs === -1) return null;
    const rest = msgId.substring(firstUs + 1);
    const m = rest.match(/^(.+?@[cgs]\.us)/);
    return m ? m[1] : rest.split("_")[0];
  }
  function findChatByJid(jid) {
    if (!CC) return null;
    for (const ch of CC._models) {
      if (ch.id?._serialized === jid || ch.id?.user === jid.split("@")[0])
        return ch;
    }
    const user = jid.split("@")[0];
    for (const ch of CC._models) {
      if (ch.id?._serialized?.includes(user)) return ch;
    }
    return null;
  }
  function openChat(chat) {
    try {
      const Cmd = requireModule(WA_MODULES.Cmd).Cmd;
      if (Cmd?.openChatAt) {
        Cmd.openChatAt({ chat });
        return true;
      }
    } catch {
    }
    try {
      const poc = requireModule(
        WA_MODULES.PhoneNumberContactAction
      );
      if (poc?.handleOpenChat) {
        poc.handleOpenChat(null, chat.id, null);
        return true;
      }
    } catch {
    }
    return false;
  }
  function scrollToMsg(chat, msgObj) {
    try {
      const Cmd = requireModule(WA_MODULES.Cmd).Cmd;
      const search = requireModule(WA_MODULES.ChatMessageSearch);
      if (Cmd?.openChatAt && search?.getSearchContext) {
        const ctx = search.getSearchContext(chat, msgObj.__x_id);
        Cmd.openChatAt({ chat, msgContext: ctx }).then(() => {
          setTimeout(() => {
            const mid = msgObj.__x_id?._serialized || "";
            document.querySelectorAll("[data-id]").forEach((el) => {
              if (el.dataset.id === mid || el.textContent?.includes("\u{1F6AB}")) {
                el.classList.add("wplus-msg-highlight");
                el.scrollIntoView({
                  behavior: "smooth",
                  block: "center"
                });
                setTimeout(
                  () => el.classList.remove("wplus-msg-highlight"),
                  3e3
                );
              }
            });
          }, 500);
        });
        dbg("nav", "Scrolled to message");
        return true;
      }
    } catch (e) {
      dbg("nav", `scrollToMsg failed: ${errorMessage4(e)}`);
    }
    return false;
  }
  function findRevokedInChat(chat, saved) {
    if (!chat?.msgs?._models) return null;
    const msgTime = saved.time;
    for (const m of chat.msgs._models) {
      if (m.__x_type !== "revoked") continue;
      const mTime = m.__x_t ? m.__x_t * 1e3 : 0;
      if (mTime && msgTime && Math.abs(mTime - msgTime) < 5e3) return m;
      if (m.__x_id?._serialized === saved.id) return m;
    }
    return null;
  }
  function searchAndRestore(chat, saved, attempt) {
    if (attempt > 15) {
      dbg("nav", "Gave up after 15 load attempts");
      return;
    }
    const found = findRevokedInChat(chat, saved);
    if (found) {
      dbg("nav", "FOUND! Restoring...");
      restoreMsg(found, saved);
      scrollToMsg(chat, found);
      window.dispatchEvent(new CustomEvent("wplus-update"));
      return;
    }
    dbg("nav", `Not found (attempt ${attempt + 1}), loading older...`);
    try {
      const loader = requireModule(WA_MODULES.ChatLoadMessages);
      if (loader?.loadEarlierMsgs) {
        const before = chat.msgs._models?.length || 0;
        loader.loadEarlierMsgs(chat).then(() => {
          const after = chat.msgs._models?.length || 0;
          dbg("nav", `Loaded ${after - before} more (total: ${after})`);
          if (after === before) {
            const lastTry = findRevokedInChat(chat, saved);
            if (lastTry) {
              restoreMsg(lastTry, saved);
              scrollToMsg(chat, lastTry);
            } else dbg("nav", "Message not in history");
            return;
          }
          setTimeout(
            () => searchAndRestore(chat, saved, attempt + 1),
            500
          );
        });
        return;
      }
    } catch (e) {
      dbg("nav", `Loader error: ${errorMessage4(e)}`);
    }
  }
  function goToMessage(savedMsgId) {
    if (!CC) {
      dbg("nav", "No ChatCollection");
      return false;
    }
    const allSaved = deletedMsgs("get");
    const saved = allSaved.find((m) => m.id === savedMsgId);
    if (!saved) {
      dbg("nav", `Not found: ${savedMsgId.substring(0, 30)}`);
      return false;
    }
    const jid = extractJid(savedMsgId);
    if (!jid) {
      dbg("nav", "Bad ID");
      return false;
    }
    dbg("nav", `Target: ${jid} type=${saved.type}`);
    const chat = findChatByJid(jid);
    if (!chat) {
      dbg("nav", "Chat not found");
      return false;
    }
    dbg("nav", `Chat: ${chat.__x_name || chat.__x_formattedTitle || "?"}`);
    openChat(chat);
    const waitReady = (attempts2) => {
      if (attempts2 > 20) {
        dbg("nav", "Chat never loaded");
        return;
      }
      const models = chat.msgs?._models;
      if (models && models.length > 0) {
        dbg("nav", `Chat ready (${models.length} msgs)`);
        searchAndRestore(chat, saved, 0);
      } else {
        setTimeout(() => waitReady(attempts2 + 1), 500);
      }
    };
    setTimeout(() => waitReady(0), 2e3);
    return true;
  }
  function forceRestoreCurrentChat(callback) {
    if (!CC) {
      callback(0);
      return;
    }
    let currentChat = null;
    const hdr = document.querySelector(
      "header span.x1iyjqo2, header span[dir='auto']"
    );
    const headerName = hdr?.textContent?.trim() || "";
    if (headerName) {
      currentChat = CC._models.find(
        (c) => c.__x_name === headerName || c.__x_formattedTitle === headerName
      ) || null;
    }
    if (!currentChat) {
      currentChat = CC._models.find((c) => c.__x_active) || null;
    }
    if (!currentChat) {
      dbg("restore", "No active chat");
      callback(0);
      return;
    }
    const chatJid = currentChat.id._serialized;
    const chatSaved = deletedMsgs("get").filter(
      (s) => s.id?.includes(chatJid.split("@")[0])
    );
    if (!chatSaved.length) {
      callback(0);
      return;
    }
    dbg("restore", `Force restoring ${chatSaved.length} in ${headerName}`);
    let totalRestored = 0;
    const restored = /* @__PURE__ */ new Set();
    function loadAndRestore(attempt) {
      if (attempt > 20) {
        callback(totalRestored);
        return;
      }
      currentChat.msgs._models?.forEach((m) => {
        if (m.__x_type !== "revoked") return;
        const mTime = m.__x_t ? m.__x_t * 1e3 : 0;
        for (const s of chatSaved) {
          if (restored.has(s.id)) continue;
          if (s.id === m.__x_id._serialized || mTime && s.time && Math.abs(mTime - s.time) < 5e3) {
            restoreMsg(m, s);
            restored.add(s.id);
            totalRestored++;
            break;
          }
        }
      });
      if (restored.size >= chatSaved.length) {
        callback(totalRestored);
        return;
      }
      try {
        const loader = requireModule(
          WA_MODULES.ChatLoadMessages
        );
        if (loader?.loadEarlierMsgs) {
          const chat = currentChat;
          const before = chat.msgs._models?.length || 0;
          loader.loadEarlierMsgs(chat).then(() => {
            const after = chat.msgs._models?.length || 0;
            if (after === before) {
              callback(totalRestored);
              return;
            }
            setTimeout(() => loadAndRestore(attempt + 1), 300);
          }).catch(() => callback(totalRestored));
          return;
        }
      } catch {
        callback(totalRestored);
      }
      callback(totalRestored);
    }
    loadAndRestore(0);
  }

  // src/engine.ts
  if (window.__wplus?.cleanup) {
    try {
      window.__wplus.cleanup();
    } catch {
    }
  }
  var wplus = { version: VERSION, ready: false };
  window.__wplus = wplus;
  var attempts = 0;
  function boot() {
    if (++attempts > 120) return;
    if (!initModules()) {
      setTimeout(boot, 1e3);
      return;
    }
    hookAllChats();
    const saved = deletedMsgs("get");
    if (saved.length && CC) {
      let restored = 0;
      CC._models.forEach((ch) => {
        ch.msgs?._models?.forEach((m) => {
          if (m.__x_type !== "revoked") return;
          const match = saved.find(
            (s) => s.id === m.__x_id?._serialized || m.__x_t && s.time && Math.abs(m.__x_t * 1e3 - s.time) < 5e3
          );
          if (match) {
            restoreMsg(m, match);
            restored++;
          }
        });
      });
      dbg("restore", `Restored ${restored}/${saved.length}`);
    }
    const S = settings();
    Object.keys(S).forEach((k) => {
      if (S[k]) applyToggle(k, true);
    });
    wplus.ready = true;
    wplus.settings = settings;
    wplus.deletedMsgs = deletedMsgs;
    wplus.applyToggle = applyToggle;
    wplus.goToMessage = goToMessage;
    wplus.forceRestoreCurrentChat = forceRestoreCurrentChat;
    wplus.exportContacts = () => {
      if (!CON) {
        alert("Loading...");
        return;
      }
      const contacts = CON._models.filter((c) => c.id?.server === "c.us").map((c) => ({
        phone: "+" + c.id.user,
        name: c.__x_name || c.__x_pushname || c.__x_formattedName || "",
        business: c.__x_isBusiness ? "Yes" : "No"
      }));
      const csv = "Phone,Name,Business\n" + contacts.map(
        (c) => `"${c.phone}","${c.name.replace(/"/g, '""')}","${c.business}"`
      ).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv" })
      );
      a.download = `WPlus_Contacts_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
      a.click();
      alert(`Exported ${contacts.length} contacts!`);
    };
    wplus.chatStats = () => {
      if (!CC) return "Loading...";
      const chats = CC._models;
      let groups = 0, personal = 0, unread = 0, totalMsgs = 0;
      const top = [];
      chats.forEach((c) => {
        if (c.id?.server === "g.us") groups++;
        else personal++;
        if (c.__x_unreadCount && c.__x_unreadCount > 0) unread++;
        const mc = c.msgs?._models?.length || 0;
        totalMsgs += mc;
        top.push({
          n: c.__x_name || c.__x_formattedTitle || c.id?.user || "?",
          m: mc,
          u: c.__x_unreadCount || 0,
          g: c.id?.server === "g.us"
        });
      });
      top.sort((a, b) => b.m - a.m);
      const cc = CON?._models.filter((c) => c.id?.server === "c.us").length || 0;
      let t = `${chats.length} chats (${personal} personal, ${groups} groups)
${unread} unread \xB7 ${cc} contacts \xB7 ${totalMsgs} loaded

`;
      top.slice(0, 10).forEach((c, i) => {
        t += `${i + 1}. ${c.n.substring(0, 22)}${c.g ? " [G]" : ""} \u2014 ${c.m}${c.u > 0 ? ` (${c.u})` : ""}
`;
      });
      return t;
    };
    wplus.debug = createDebugAPI(() => ({
      version: VERSION,
      ready: wplus.ready || false,
      chats: CC?._models.length || 0,
      contacts: CON?._models.length || 0,
      groups: GRP?._models.length || 0,
      deletedMsgs: deletedMsgs("get").length,
      hookedChats: CC?._models.filter((c) => c.msgs.__wp).length || 0,
      hooks: {
        composing: !!originals.markComposing,
        presence: !!originals.sendPresenceAvailable,
        seen: !!originals.sendConversationSeen,
        played: !!originals.markPlayed
      },
      settings: settings()
    }));
    wplus.cleanup = () => {
      window.__wplusStickerImportCleanup?.();
      cleanupPrivacy();
      cleanupDebug();
      [
        "wplus-btn",
        "wplus-panel",
        "wplus-header-restore",
        "wplus-css",
        "wplus-style",
        "wplus-scroll-up",
        "wplus-media-viewer",
        "wplus-preview"
      ].forEach((id) => {
        document.getElementById(id)?.remove();
      });
      document.querySelectorAll(
        "[id*=wplus],.wplus-restore-btn,.wplus-b,.wpp,.wplus-msg-highlight"
      ).forEach((e) => e.remove());
      document.querySelectorAll(".wplus-blur-t,.wplus-blur-p").forEach((e) => {
        e.classList.remove("wplus-blur-t", "wplus-blur-p");
      });
      window.__wplus = void 0;
    };
    dbg(
      "boot",
      `READY \u2014 ${CC?._models.length} chats, ${CON?._models.length || 0} contacts`
    );
    window.dispatchEvent(new CustomEvent("wplus-ready"));
  }
  setTimeout(boot, 3e3);
  dbg("boot", `Engine v${VERSION} loaded.`);
})();
