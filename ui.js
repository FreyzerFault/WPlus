"use strict";
(() => {
  // src/styles/ui.css
  var ui_default = ".wplus-b {\r\n    position: fixed;\r\n    left: 8px;\r\n    top: 0;\r\n    z-index: 999999;\r\n    width: 40px;\r\n    height: 40px;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    cursor: pointer;\r\n    transition: background 0.15s;\r\n    background: 0 0;\r\n    border-radius: 12px;\r\n    border: 0;\r\n    padding: 0;\r\n    outline: 0;\r\n    color: inherit;\r\n    appearance: none;\r\n    -webkit-appearance: none;\r\n    font-family:\r\n        'Segoe UI', 'Helvetica Neue', Helvetica, 'Lucida Grande', Arial, Ubuntu,\r\n        Cantarell, 'Fira Sans', sans-serif;\r\n}\r\n.wplus-b:hover,\r\n.wplus-b.on {\r\n    background: rgba(255, 255, 255, 0.1);\r\n}\r\n.wplus-b svg {\r\n    width: 24px;\r\n    height: 24px;\r\n    fill: #aebac1;\r\n    transition: fill 0.15s;\r\n}\r\n.wplus-b:hover svg,\r\n.wplus-b.on svg {\r\n    fill: #e9edef;\r\n}\r\n.wplus-b .wd {\r\n    position: absolute;\r\n    top: 4px;\r\n    right: 4px;\r\n    width: 8px;\r\n    height: 8px;\r\n    border-radius: 50%;\r\n    background: #25d366;\r\n    border: 2px solid #222e35;\r\n}\r\n.wplus-b .wc {\r\n    position: absolute;\r\n    top: 0;\r\n    right: 0;\r\n    background: #25d366;\r\n    color: #fff;\r\n    font-size: 9px;\r\n    font-weight: 700;\r\n    min-width: 16px;\r\n    height: 16px;\r\n    line-height: 16px;\r\n    text-align: center;\r\n    border-radius: 8px;\r\n    padding: 0 3px;\r\n    font-family:\r\n        'Segoe UI', 'Helvetica Neue', Helvetica, 'Lucida Grande', Arial, Ubuntu,\r\n        Cantarell, 'Fira Sans', sans-serif;\r\n    display: none;\r\n    border: 2px solid #222e35;\r\n}\r\n.wpp {\r\n    position: fixed;\r\n    left: 65px;\r\n    top: 39px;\r\n    z-index: 999998;\r\n    width: 413px;\r\n    height: calc(100vh - 39px);\r\n    background: rgb(22, 23, 23);\r\n    display: none;\r\n    flex-direction: column;\r\n    font-family:\r\n        'Segoe UI', 'Helvetica Neue', Helvetica, 'Lucida Grande', Arial, Ubuntu,\r\n        Cantarell, 'Fira Sans', sans-serif;\r\n    -webkit-font-smoothing: antialiased;\r\n}\r\n.wpp-h {\r\n    height: 64px;\r\n    min-height: 64px;\r\n    background: rgb(22, 23, 23);\r\n    display: flex;\r\n    align-items: center;\r\n    padding: 10px 20px;\r\n    box-sizing: border-box;\r\n    flex-shrink: 0;\r\n}\r\n.wpp-hb {\r\n    width: 36px;\r\n    height: 36px;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    cursor: pointer;\r\n    border-radius: 50%;\r\n    margin-right: 16px;\r\n    transition: background 0.12s;\r\n    flex-shrink: 0;\r\n}\r\n.wpp-hb:hover {\r\n    background: rgba(255, 255, 255, 0.1);\r\n}\r\n.wpp-hb svg {\r\n    width: 24px;\r\n    height: 24px;\r\n    fill: rgba(255, 255, 255, 0.6);\r\n}\r\n.wpp-ht {\r\n    font-size: 22px;\r\n    font-weight: 400;\r\n    color: rgb(250, 250, 250);\r\n    line-height: 28px;\r\n}\r\n.wpp-sc {\r\n    flex: 1;\r\n    overflow-y: auto;\r\n    overflow-x: hidden;\r\n    background: rgb(22, 23, 23);\r\n}\r\n.wpp-sc::-webkit-scrollbar {\r\n    width: 6px;\r\n}\r\n.wpp-sc::-webkit-scrollbar-thumb {\r\n    background: rgba(255, 255, 255, 0.13);\r\n    border-radius: 3px;\r\n}\r\n.wpp-r {\r\n    display: flex;\r\n    align-items: center;\r\n    padding: 16px 20px 16px 36px;\r\n    cursor: pointer;\r\n    transition: background 0.08s;\r\n    min-height: 24px;\r\n}\r\n.wpp-r:hover {\r\n    background: rgba(255, 255, 255, 0.04);\r\n}\r\n.wpp-r:active {\r\n    background: rgba(255, 255, 255, 0.06);\r\n}\r\n.wpp-ri {\r\n    width: 20px;\r\n    height: 20px;\r\n    flex-shrink: 0;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    margin-right: 26px;\r\n}\r\n.wpp-ri svg {\r\n    width: 20px;\r\n    height: 20px;\r\n    fill: rgba(255, 255, 255, 0.6);\r\n}\r\n.wpp-rn {\r\n    flex: 1;\r\n    min-width: 0;\r\n}\r\n.wpp-rt {\r\n    font-size: 16px;\r\n    font-weight: 400;\r\n    color: rgb(250, 250, 250);\r\n    line-height: 24px;\r\n}\r\n.wpp-rd {\r\n    font-size: 14px;\r\n    font-weight: 400;\r\n    color: rgba(255, 255, 255, 0.6);\r\n    line-height: 20px;\r\n}\r\n.wpp-rv {\r\n    flex-shrink: 0;\r\n    font-size: 14px;\r\n    color: rgba(255, 255, 255, 0.45);\r\n    margin-left: 12px;\r\n}\r\n.wpp-tg {\r\n    position: relative;\r\n    width: 40px;\r\n    height: 22px;\r\n    border-radius: 11px;\r\n    background: rgba(255, 255, 255, 0.2);\r\n    cursor: pointer;\r\n    transition: background 0.2s;\r\n    flex-shrink: 0;\r\n    margin-left: 12px;\r\n}\r\n.wpp-tg.on {\r\n    background: #25d366;\r\n}\r\n.wpp-tg::after {\r\n    content: '';\r\n    position: absolute;\r\n    top: 2px;\r\n    left: 2px;\r\n    width: 18px;\r\n    height: 18px;\r\n    border-radius: 50%;\r\n    background: #fff;\r\n    transition: transform 0.2s;\r\n    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);\r\n}\r\n.wpp-tg.on::after {\r\n    transform: translateX(18px);\r\n}\r\n.wpp-sec {\r\n    padding: 20px 20px 8px 36px;\r\n    font-size: 14px;\r\n    font-weight: 400;\r\n    color: rgb(0, 168, 132);\r\n    line-height: 20px;\r\n}\r\n.wpp-div {\r\n    margin: 0 20px 0 82px;\r\n    border-bottom: 1px solid rgba(255, 255, 255, 0.08);\r\n}\r\n.wpp-sub {\r\n    max-height: 0;\r\n    overflow: hidden;\r\n    transition: max-height 0.25s ease;\r\n    background: rgb(18, 19, 19);\r\n}\r\n.wpp-sub.open {\r\n    max-height: 6000px;\r\n}\r\n.wpp-dm {\r\n    padding: 10px 20px 10px 36px;\r\n    border-bottom: 1px solid rgba(255, 255, 255, 0.04);\r\n}\r\n.wpp-dm:hover {\r\n    background: rgba(255, 255, 255, 0.015);\r\n}\r\n.wpp-dm-row {\r\n    cursor: pointer;\r\n    display: flex;\r\n    align-items: center;\r\n    gap: 10px;\r\n    padding: 8px 20px 8px 36px;\r\n}\r\n.wpp-dm-icon {\r\n    font-size: 18px;\r\n    width: 24px;\r\n    text-align: center;\r\n    flex-shrink: 0;\r\n}\r\n.wpp-dm-main {\r\n    flex: 1;\r\n    min-width: 0;\r\n}\r\n.wpp-dm-header {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n.wpp-dm-sender {\r\n    font-size: 12px;\r\n}\r\n.wpp-dm-body {\r\n    font-size: 13px;\r\n    color: #d1d7db;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n.wpp-dm-nav {\r\n    font-size: 10px;\r\n    color: rgb(83, 189, 235);\r\n    cursor: pointer;\r\n    white-space: nowrap;\r\n    flex-shrink: 0;\r\n}\r\n.wpp-dmh {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    margin-bottom: 2px;\r\n}\r\n.wpp-dms {\r\n    color: rgb(0, 168, 132);\r\n    font-weight: 500;\r\n    font-size: 13px;\r\n}\r\n.wpp-dmt {\r\n    color: rgba(255, 255, 255, 0.45);\r\n    font-size: 12px;\r\n}\r\n.wpp-dmb {\r\n    color: rgb(209, 215, 219);\r\n    line-height: 1.3;\r\n    word-break: break-word;\r\n    font-size: 14px;\r\n}\r\n.wpp-dmtp {\r\n    display: inline-block;\r\n    font-size: 11px;\r\n    color: rgba(255, 255, 255, 0.45);\r\n    background: rgba(255, 255, 255, 0.06);\r\n    padding: 1px 6px;\r\n    border-radius: 3px;\r\n    margin-top: 3px;\r\n}\r\n.wpp-dme {\r\n    padding: 24px 36px;\r\n    text-align: center;\r\n    color: rgba(255, 255, 255, 0.45);\r\n    font-size: 14px;\r\n}\r\n.wpp-vo {\r\n    padding: 8px 20px 8px 36px;\r\n    display: flex;\r\n    align-items: center;\r\n    gap: 12px;\r\n    border-bottom: 1px solid rgba(255, 255, 255, 0.04);\r\n}\r\n.wpp-vo:hover {\r\n    background: rgba(255, 255, 255, 0.015);\r\n}\r\n.wpp-vodl {\r\n    color: rgb(83, 189, 235);\r\n    font-size: 13px;\r\n    cursor: pointer;\r\n    margin-left: auto;\r\n    white-space: nowrap;\r\n}\r\n.wpp-vodl:hover {\r\n    text-decoration: underline;\r\n}\r\n.wpp-st {\r\n    padding: 14px 36px;\r\n    font-size: 13px;\r\n    color: rgb(209, 215, 219);\r\n    white-space: pre-wrap;\r\n    font-family: Consolas, 'SF Mono', monospace;\r\n    line-height: 1.4;\r\n}\r\n.wpp-st-compact {\r\n    font-size: 12px;\r\n    line-height: 1.5;\r\n}\r\n.wplus-debug-entry {\r\n    padding: 4px 20px 4px 36px;\r\n    border-bottom: 1px solid rgba(255, 255, 255, 0.03);\r\n    font-size: 11px;\r\n    font-family: Consolas, monospace;\r\n}\r\n.wplus-debug-time,\r\n.wplus-debug-data {\r\n    color: #667781;\r\n}\r\n.wplus-debug-category {\r\n    font-weight: 600;\r\n    color: #8696a0;\r\n}\r\n.wplus-debug-category[data-category='init'],\r\n.wplus-debug-category[data-category='boot'] {\r\n    color: #25d366;\r\n}\r\n.wplus-debug-category[data-category='msg'] {\r\n    color: #53bdeb;\r\n}\r\n.wplus-debug-category[data-category='nav'] {\r\n    color: #f5a623;\r\n}\r\n.wplus-debug-category[data-category='cleanup'] {\r\n    color: #ef4444;\r\n}\r\n.wplus-debug-message {\r\n    color: #d1d7db;\r\n}\r\n.wplus-debug-data:empty {\r\n    display: none;\r\n}\r\n.wpp-ft {\r\n    padding: 10px 20px;\r\n    text-align: center;\r\n    flex-shrink: 0;\r\n    border-top: 1px solid rgba(255, 255, 255, 0.08);\r\n}\r\n.wpp-ft a {\r\n    color: rgba(255, 255, 255, 0.35);\r\n    font-size: 12px;\r\n    text-decoration: none;\r\n    font-family:\r\n        'Segoe UI', 'Helvetica Neue', Helvetica, 'Lucida Grande', Arial, Ubuntu,\r\n        Cantarell, 'Fira Sans', sans-serif;\r\n}\r\n.wpp-ft a:hover {\r\n    color: rgba(255, 255, 255, 0.5);\r\n}\r\n.wplus-blur-t {\r\n    filter: blur(5px) !important;\r\n    transition: filter 0.15s;\r\n}\r\n.wplus-blur-t:hover {\r\n    filter: blur(0) !important;\r\n}\r\n.wplus-blur-p {\r\n    filter: blur(8px) !important;\r\n    transition: filter 0.15s;\r\n}\r\n.wplus-blur-p:hover {\r\n    filter: blur(0) !important;\r\n}\r\n#wplus-header-restore svg {\r\n    width: 20px;\r\n    height: 20px;\r\n    fill: rgba(255, 255, 255, 0.6);\r\n    transition: fill 0.15s;\r\n}\r\n#wplus-header-restore:hover svg {\r\n    fill: #25d366;\r\n}\r\n@keyframes wplus-spin {\r\n    from {\r\n        transform: rotate(0);\r\n    }\r\n    to {\r\n        transform: rotate(360deg);\r\n    }\r\n}\r\n#wplus-header-restore .wplus-tip {\r\n    display: none;\r\n    position: absolute;\r\n    bottom: -30px;\r\n    left: 50%;\r\n    transform: translateX(-50%);\r\n    background: rgb(22, 23, 23);\r\n    color: rgba(255, 255, 255, 0.8);\r\n    font-size: 11px;\r\n    padding: 4px 10px;\r\n    border-radius: 6px;\r\n    white-space: nowrap;\r\n    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);\r\n    pointer-events: none;\r\n    z-index: 99999;\r\n}\r\n#wplus-header-restore:hover .wplus-tip {\r\n    display: block;\r\n}\r\n.wplus-msg-highlight {\r\n    animation: wplus-flash 3s ease;\r\n}\r\n@keyframes wplus-flash {\r\n    0%,\r\n    20%,\r\n    40%,\r\n    60% {\r\n        box-shadow: 0 0 0 3px #25d366;\r\n        background: rgba(37, 211, 102, 0.08);\r\n    }\r\n    10%,\r\n    30%,\r\n    50%,\r\n    100% {\r\n        box-shadow: none;\r\n        background: transparent;\r\n    }\r\n}\r\n#wplus-scroll-up {\r\n    position: fixed;\r\n    z-index: 999997;\r\n    bottom: 78px;\r\n    right: 65px;\r\n    width: 42px;\r\n    height: 42px;\r\n    border-radius: 50%;\r\n    background: rgb(32, 44, 51);\r\n    border: 0;\r\n    cursor: pointer;\r\n    display: none;\r\n    align-items: center;\r\n    justify-content: center;\r\n    box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 8px 0px;\r\n    transition: background 0.15s;\r\n}\r\n#wplus-scroll-up.visible {\r\n    display: flex;\r\n}\r\n#wplus-scroll-up:hover {\r\n    background: rgb(42, 57, 66);\r\n}\r\n#wplus-scroll-up svg {\r\n    width: 20px;\r\n    height: 20px;\r\n    fill: rgba(255, 255, 255, 0.85);\r\n}\r\n#wplus-scroll-up.loading svg {\r\n    animation: wplus-spin 1s linear infinite;\r\n}\r\n#wplus-scroll-up .wplus-count {\r\n    position: absolute;\r\n    top: -4px;\r\n    left: 50%;\r\n    transform: translateX(-50%);\r\n    background: #25d366;\r\n    color: #fff;\r\n    font-size: 9px;\r\n    font-weight: 700;\r\n    min-width: 16px;\r\n    height: 16px;\r\n    line-height: 16px;\r\n    text-align: center;\r\n    border-radius: 8px;\r\n    padding: 0 3px;\r\n    font-family: sans-serif;\r\n    display: none;\r\n}\r\n#wplus-scroll-up .wplus-count.visible {\r\n    display: block;\r\n}\r\n#wplus-update-bar {\r\n    display: none;\r\n    padding: 8px 20px;\r\n    background: rgba(37, 211, 102, 0.1);\r\n    border-bottom: 1px solid rgba(37, 211, 102, 0.2);\r\n    cursor: pointer;\r\n    font-size: 13px;\r\n    color: #25d366;\r\n}\r\n#wplus-update-bar.visible {\r\n    display: block;\r\n}\r\n#wplus-update-bar span:first-child {\r\n    margin-right: 6px;\r\n}\r\n.wplus-update-dot {\r\n    position: absolute;\r\n    top: 2px;\r\n    right: 2px;\r\n    width: 10px;\r\n    height: 10px;\r\n    border-radius: 50%;\r\n    background: #ef4444;\r\n    border: 2px solid #222e35;\r\n}\r\n.wplus-position-relative {\r\n    position: relative;\r\n}\r\n.wplus-preview-overlay {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    right: 0;\r\n    bottom: 0;\r\n    z-index: 9999999;\r\n    background: rgba(0, 0, 0, 0.7);\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    font-family:\r\n        Segoe UI,\r\n        sans-serif;\r\n}\r\n.wplus-preview-popup {\r\n    background: rgb(22, 23, 23);\r\n    border-radius: 12px;\r\n    width: 420px;\r\n    max-width: 90vw;\r\n    max-height: 80vh;\r\n    overflow: hidden;\r\n    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);\r\n    display: flex;\r\n    flex-direction: column;\r\n}\r\n.wplus-preview-header {\r\n    padding: 12px 16px;\r\n    background: rgb(30, 31, 31);\r\n    display: flex;\r\n    align-items: center;\r\n    gap: 12px;\r\n    border-bottom: 1px solid rgba(255, 255, 255, 0.06);\r\n}\r\n.wplus-preview-avatar {\r\n    width: 36px;\r\n    height: 36px;\r\n    border-radius: 50%;\r\n    background: #25d366;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    flex-shrink: 0;\r\n}\r\n.wplus-preview-avatar span {\r\n    color: #fff;\r\n    font-size: 14px;\r\n    font-weight: 600;\r\n}\r\n.wplus-preview-sender {\r\n    flex: 1;\r\n    color: #e9edef;\r\n    font-size: 14px;\r\n    font-weight: 500;\r\n}\r\n.wplus-preview-time {\r\n    color: #8696a0;\r\n    font-size: 11px;\r\n}\r\n.wplus-preview-close {\r\n    cursor: pointer;\r\n    color: #8696a0;\r\n    font-size: 20px;\r\n    padding: 4px 8px;\r\n}\r\n.wplus-preview-body {\r\n    padding: 16px;\r\n    overflow-y: auto;\r\n    flex: 1;\r\n    background: rgb(17, 20, 20);\r\n}\r\n.wplus-preview-bubble {\r\n    max-width: 320px;\r\n    background: rgb(32, 44, 51);\r\n    border-radius: 0 8px 8px 8px;\r\n    padding: 6px 8px 4px;\r\n    position: relative;\r\n}\r\n.wplus-preview-deleted {\r\n    color: #ef4444;\r\n    font-size: 12px;\r\n    font-weight: 600;\r\n    margin-bottom: 4px;\r\n}\r\n.wplus-preview-img {\r\n    max-width: 100%;\r\n    max-height: 250px;\r\n    border-radius: 6px;\r\n    margin: 6px 0;\r\n    cursor: pointer;\r\n    object-fit: contain;\r\n}\r\n.wplus-preview-image-hint {\r\n    text-align: center;\r\n    font-size: 10px;\r\n    color: #667781;\r\n    margin-bottom: 4px;\r\n}\r\n.wplus-preview-video-thumb {\r\n    position: relative;\r\n    cursor: pointer;\r\n}\r\n.wplus-preview-video-thumb img {\r\n    max-width: 100%;\r\n    border-radius: 6px;\r\n    margin: 6px 0;\r\n    opacity: 0.7;\r\n}\r\n.wplus-preview-play {\r\n    position: absolute;\r\n    top: 50%;\r\n    left: 50%;\r\n    transform: translate(-50%, -50%);\r\n    font-size: 40px;\r\n}\r\n.wplus-preview-video-note {\r\n    text-align: center;\r\n    font-size: 11px;\r\n    color: #8696a0;\r\n    margin-bottom: 4px;\r\n}\r\n.wplus-preview-video {\r\n    max-width: 100%;\r\n    max-height: 250px;\r\n    border-radius: 6px;\r\n    margin: 6px 0;\r\n    background: #000;\r\n}\r\n.wplus-preview-fullscreen {\r\n    text-align: center;\r\n    margin: 2px 0;\r\n}\r\n.wplus-preview-fullscreen span {\r\n    color: #53bdeb;\r\n    font-size: 11px;\r\n    cursor: pointer;\r\n}\r\n.wplus-preview-audio {\r\n    padding: 8px 0;\r\n    display: flex;\r\n    align-items: center;\r\n    gap: 8px;\r\n}\r\n.wplus-preview-audio span {\r\n    font-size: 22px;\r\n}\r\n.wplus-preview-audio audio {\r\n    flex: 1;\r\n    height: 36px;\r\n}\r\n.wplus-preview-unavailable {\r\n    color: #8696a0;\r\n    font-size: 13px;\r\n    font-style: italic;\r\n    padding: 12px 0;\r\n    text-align: center;\r\n}\r\n.wplus-preview-caption {\r\n    color: #d1d7db;\r\n    font-size: 13px;\r\n    line-height: 1.3;\r\n    margin: 4px 0;\r\n}\r\n.wplus-preview-text {\r\n    color: #e9edef;\r\n    font-size: 14px;\r\n    line-height: 1.4;\r\n    word-break: break-word;\r\n    margin: 4px 0;\r\n}\r\n.wplus-preview-caption-full {\r\n    color: #8696a0;\r\n    font-size: 12px;\r\n    margin-top: 2px;\r\n}\r\n.wplus-preview-time-type {\r\n    display: flex;\r\n    justify-content: flex-end;\r\n    align-items: center;\r\n    gap: 6px;\r\n    margin-top: 2px;\r\n}\r\n.wplus-preview-type,\r\n.wplus-preview-clock {\r\n    font-size: 10px;\r\n    color: #667781;\r\n}\r\n.wplus-preview-type {\r\n    background: rgba(255, 255, 255, 0.06);\r\n    padding: 1px 6px;\r\n    border-radius: 3px;\r\n}\r\n.wplus-preview-footer {\r\n    padding: 10px 16px;\r\n    border-top: 1px solid rgba(255, 255, 255, 0.06);\r\n    display: flex;\r\n    gap: 8px;\r\n    justify-content: flex-end;\r\n}\r\n.wplus-preview-button {\r\n    padding: 6px 14px;\r\n    border-radius: 6px;\r\n    cursor: pointer;\r\n    font-size: 12px;\r\n    font-family: inherit;\r\n}\r\n.wplus-preview-goto {\r\n    background: transparent;\r\n    border: 1px solid rgba(255, 255, 255, 0.15);\r\n    color: #53bdeb;\r\n}\r\n.wplus-preview-download {\r\n    background: #25d366;\r\n    border: 0;\r\n    color: #fff;\r\n}\r\n.wplus-media-viewer {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    right: 0;\r\n    bottom: 0;\r\n    z-index: 99999999;\r\n    background: rgba(0, 0, 0, 0.95);\r\n    display: flex;\r\n    flex-direction: column;\r\n    font-family:\r\n        Segoe UI,\r\n        sans-serif;\r\n}\r\n.wplus-media-topbar {\r\n    height: 48px;\r\n    display: flex;\r\n    align-items: center;\r\n    padding: 0 16px;\r\n    flex-shrink: 0;\r\n    background: rgba(0, 0, 0, 0.5);\r\n    z-index: 1;\r\n}\r\n.wplus-media-title {\r\n    color: #fff;\r\n    font-size: 14px;\r\n    flex: 1;\r\n}\r\n.wplus-media-actions {\r\n    display: flex;\r\n    align-items: center;\r\n}\r\n.wplus-media-save {\r\n    color: #53bdeb;\r\n    font-size: 13px;\r\n    cursor: pointer;\r\n    margin-right: 16px;\r\n}\r\n.wplus-media-close {\r\n    color: #fff;\r\n    font-size: 24px;\r\n    cursor: pointer;\r\n    width: 36px;\r\n    height: 36px;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    border-radius: 50%;\r\n    transition: background 0.15s;\r\n}\r\n.wplus-media-container {\r\n    flex: 1;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    overflow: hidden;\r\n    position: relative;\r\n}\r\n.wplus-media-image {\r\n    max-width: 95vw;\r\n    max-height: calc(100vh - 100px);\r\n    object-fit: contain;\r\n    cursor: grab;\r\n    transition: transform 0.2s;\r\n    user-select: none;\r\n    -webkit-user-drag: none;\r\n}\r\n.wplus-media-image.is-grabbing {\r\n    cursor: grabbing;\r\n}\r\n.wplus-media-image.is-fit {\r\n    cursor: default;\r\n}\r\n.wplus-media-hint {\r\n    position: absolute;\r\n    bottom: 12px;\r\n    left: 50%;\r\n    transform: translateX(-50%);\r\n    color: rgba(255, 255, 255, 0.5);\r\n    font-size: 11px;\r\n    pointer-events: none;\r\n}\r\n.wplus-media-video {\r\n    max-width: 95vw;\r\n    max-height: calc(100vh - 100px);\r\n    outline: none;\r\n    border-radius: 4px;\r\n}\r\n.wplus-media-volume {\r\n    position: absolute;\r\n    top: 50%;\r\n    left: 50%;\r\n    transform: translate(-50%, -50%);\r\n    background: rgba(0, 0, 0, 0.7);\r\n    color: #fff;\r\n    font-size: 16px;\r\n    padding: 8px 16px;\r\n    border-radius: 8px;\r\n    opacity: 0;\r\n    transition: opacity 0.2s;\r\n    pointer-events: none;\r\n    font-family: sans-serif;\r\n}\r\n.wplus-media-volume.visible {\r\n    opacity: 1;\r\n}\r\n.wplus-media-audio {\r\n    width: 400px;\r\n    max-width: 90vw;\r\n}\r\n.wplus-header-restore-wrap {\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n}\r\n.wplus-header-restore-button {\r\n    width: 40px;\r\n    height: 40px;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    cursor: pointer;\r\n    border-radius: 50%;\r\n    border: 0;\r\n    background: transparent;\r\n    padding: 0;\r\n    outline: 0;\r\n    transition: background 0.15s;\r\n    position: relative;\r\n}\r\n.wplus-header-restore-button:hover {\r\n    background: rgba(255, 255, 255, 0.1);\r\n}\r\n#wplus-header-restore .wplus-header-restore-button.loading svg {\r\n    animation: wplus-spin 1s linear infinite;\r\n}\r\n#wplus-header-restore .wplus-header-restore-button.restored svg {\r\n    fill: #25d366;\r\n}\r\n#wplus-header-restore .wplus-header-restore-button.failed svg {\r\n    fill: #ef4444;\r\n}\r\n.wplus-scroll-icon {\r\n    width: 20px;\r\n    height: 20px;\r\n}\r\n";

  // src/templates/ui.html
  var ui_default2 = `<template id="wplus-trigger-template">\r
    <button\r
        class="wplus-b"\r
        id="wplus-btn"\r
        type="button"\r
        title="Open WPlus"\r
        aria-label="Open WPlus"\r
        aria-expanded="false"\r
    >\r
        <svg viewBox="0 0 24 24">\r
            <path\r
                d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 16v-2h2v2h-2zm0-4V7h2v6h-2z"\r
            />\r
        </svg>\r
        <span class="wd"></span>\r
        <span class="wc" id="wplus-c"></span>\r
    </button>\r
</template>\r
<template id="wplus-panel-template">\r
    <div class="wpp" id="wplus-panel">\r
        <div class="wpp-h">\r
            <div class="wpp-hb" id="wp-x">\r
                <svg viewBox="0 0 24 24">\r
                    <path\r
                        d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"\r
                    />\r
                </svg>\r
            </div>\r
            <div class="wpp-ht">WPlus</div>\r
        </div>\r
        <div id="wplus-update-bar">\r
            <span>&#11014;</span\r
            ><span id="wplus-update-text">Update available</span>\r
        </div>\r
        <div class="wpp-sc">\r
            <div class="wpp-sec">Privacy</div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Blur messages</div>\r
                    <div class="wpp-rd">Hover to reveal</div>\r
                </div>\r
                <div class="wpp-tg" data-t="blurMessages"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92C19.14 16.38 20 14.26 20 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Blur contacts</div>\r
                    <div class="wpp-rd">Hides names everywhere</div>\r
                </div>\r
                <div class="wpp-tg" data-t="blurContacts"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Blur photos</div>\r
                    <div class="wpp-rd">Hides all images</div>\r
                </div>\r
                <div class="wpp-tg" data-t="blurPhotos"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Blur avatars</div>\r
                    <div class="wpp-rd">Hides profile pictures everywhere</div>\r
                </div>\r
                <div class="wpp-tg" data-t="blurAvatar"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Hide typing</div>\r
                    <div class="wpp-rd">Others can't see you type</div>\r
                </div>\r
                <div class="wpp-tg" data-t="hideTyping"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92C19.14 16.38 20 14.26 20 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Hide online</div>\r
                    <div class="wpp-rd">Appear offline</div>\r
                </div>\r
                <div class="wpp-tg" data-t="hideOnline"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">No blue ticks</div>\r
                    <div class="wpp-rd">Read without receipts</div>\r
                </div>\r
                <div class="wpp-tg" data-t="disableReceipts"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Private listen</div>\r
                    <div class="wpp-rd">No play notification</div>\r
                </div>\r
                <div class="wpp-tg" data-t="playAudioPrivate"></div>\r
            </div>\r
            <div class="wpp-sec">Deleted messages</div>\r
            <div class="wpp-r" data-a="del">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Saved messages</div>\r
                    <div class="wpp-rd">Tap to view</div>\r
                </div>\r
                <div class="wpp-rv" id="wp-dc"></div>\r
            </div>\r
            <div class="wpp-sub" id="wp-dl"></div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r" data-a="del-clear">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8.46 11.88l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Clear all</div>\r
                    <div class="wpp-rd">Remove saved messages</div>\r
                </div>\r
            </div>\r
            <div class="wpp-sec">Tools</div>\r
            <div class="wpp-r" data-a="export">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Export contacts</div>\r
                    <div class="wpp-rd">Download as CSV</div>\r
                </div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r" data-a="stats">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Chat stats</div>\r
                    <div class="wpp-rd">View analytics</div>\r
                </div>\r
            </div>\r
            <div class="wpp-sub" id="wp-sp"></div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-sec">Settings</div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Check for updates</div>\r
                    <div class="wpp-rd">Notify when new version available</div>\r
                </div>\r
                <div class="wpp-tg" data-t="checkUpdates"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Debug logging</div>\r
                    <div class="wpp-rd">Track all WPlus events</div>\r
                </div>\r
                <div class="wpp-tg" data-t="debugEnabled"></div>\r
            </div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r" data-a="debug-status">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">System status</div>\r
                    <div class="wpp-rd">Engine, hooks, storage info</div>\r
                </div>\r
            </div>\r
            <div class="wpp-sub" id="wp-ds"></div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r" data-a="debug-log">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">View debug log</div>\r
                    <div class="wpp-rd">All events and errors</div>\r
                </div>\r
            </div>\r
            <div class="wpp-sub" id="wp-dlog"></div>\r
            <div class="wpp-div"></div>\r
            <div class="wpp-r" data-a="debug-clear">\r
                <div class="wpp-ri">\r
                    <svg viewBox="0 0 24 24">\r
                        <path\r
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8.46 11.88l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"\r
                        />\r
                    </svg>\r
                </div>\r
                <div class="wpp-rn">\r
                    <div class="wpp-rt">Clear debug log</div>\r
                </div>\r
            </div>\r
        </div>\r
        <div class="wpp-ft">\r
            <a href="https://github.com/KuchiSofts/WPlus" target="_blank"\r
                >WPlus v2.0 by KuchiSofts</a\r
            >\r
        </div>\r
    </div>\r
</template>\r
<template id="wplus-empty-template"\r
    ><div class="wpp-dme" data-text></div\r
></template>\r
<template id="wplus-message-row-template">\r
    <div class="wpp-dm wpp-dm-row" data-idx="">\r
        <span class="wpp-dm-icon" data-icon></span>\r
        <div class="wpp-dm-main">\r
            <div class="wpp-dm-header">\r
                <span class="wpp-dms wpp-dm-sender" data-sender></span\r
                ><span class="wpp-dmt" data-time></span>\r
            </div>\r
            <div class="wpp-dm-body" data-body></div>\r
        </div>\r
        <span class="wpp-dm-nav" data-nav="" data-go-to-chat>&#8594;</span>\r
    </div>\r
</template>\r
<template id="wplus-stats-template"\r
    ><div class="wpp-st" data-text></div\r
></template>\r
<template id="wplus-status-template"\r
    ><div class="wpp-st wpp-st-compact" data-text></div\r
></template>\r
<template id="wplus-debug-row-template">\r
    <div class="wplus-debug-entry">\r
        <span class="wplus-debug-time" data-time></span\r
        ><span class="wplus-debug-category" data-category></span\r
        ><span class="wplus-debug-message" data-message></span\r
        ><span class="wplus-debug-data" data-data></span>\r
    </div>\r
</template>\r
<template id="wplus-preview-template">\r
    <div class="wplus-preview-overlay" id="wplus-preview">\r
        <div class="wplus-preview-popup">\r
            <div class="wplus-preview-header">\r
                <div class="wplus-preview-avatar"><span>+</span></div>\r
                <div class="wplus-preview-sender" data-sender></div>\r
                <div class="wplus-preview-time" data-header-time></div>\r
                <div class="wplus-preview-close" id="wplus-preview-close">\r
                    &#10005;\r
                </div>\r
            </div>\r
            <div class="wplus-preview-body">\r
                <div class="wplus-preview-bubble">\r
                    <div class="wplus-preview-deleted">\r
                        &#128683; This message was deleted\r
                    </div>\r
                    <div data-media></div>\r
                    <div class="wplus-preview-time-type">\r
                        <span class="wplus-preview-type" data-type></span\r
                        ><span class="wplus-preview-clock" data-clock></span>\r
                    </div>\r
                </div>\r
            </div>\r
            <div class="wplus-preview-footer">\r
                <button\r
                    class="wplus-preview-button wplus-preview-goto"\r
                    id="wplus-preview-goto"\r
                >\r
                    &#8594; Go to chat</button\r
                ><button\r
                    class="wplus-preview-button wplus-preview-download"\r
                    id="wplus-preview-dl"\r
                    hidden\r
                >\r
                    &#11123; Save file\r
                </button>\r
            </div>\r
        </div>\r
    </div>\r
</template>\r
<template id="wplus-preview-image-template"\r
    ><img class="wplus-preview-img" id="wplus-preview-img" alt=""\r
/></template>\r
<template id="wplus-preview-image-hint-template"\r
    ><div class="wplus-preview-image-hint">Click image to zoom</div></template\r
>\r
<template id="wplus-preview-video-thumb-template"\r
    ><div class="wplus-preview-video-thumb" id="wplus-preview-vid-thumb">\r
        <img alt="" />\r
        <div class="wplus-preview-play">&#9654;</div>\r
    </div></template\r
>\r
<template id="wplus-preview-video-note-template"\r
    ><div class="wplus-preview-video-note">Video thumbnail only</div></template\r
>\r
<template id="wplus-preview-video-template"\r
    ><video\r
        class="wplus-preview-video"\r
        id="wplus-preview-vid"\r
        controls\r
        playsinline\r
    >\r
        <source /></video\r
></template>\r
<template id="wplus-preview-fullscreen-template"\r
    ><div class="wplus-preview-fullscreen" id="wplus-preview-fullscreen">\r
        <span>&#9974; Fullscreen</span>\r
    </div></template\r
>\r
<template id="wplus-preview-audio-template"\r
    ><div class="wplus-preview-audio">\r
        <span>&#127908;</span><audio controls></audio></div\r
></template>\r
<template id="wplus-preview-unavailable-template"\r
    ><div class="wplus-preview-unavailable" data-label></div\r
></template>\r
<template id="wplus-preview-caption-template"\r
    ><div class="wplus-preview-caption" data-text></div\r
></template>\r
<template id="wplus-preview-text-template"\r
    ><div class="wplus-preview-text" data-text></div\r
></template>\r
<template id="wplus-preview-full-caption-template"\r
    ><div class="wplus-preview-caption-full" data-text></div\r
></template>\r
<template id="wplus-viewer-template">\r
    <div class="wplus-media-viewer" id="wplus-media-viewer">\r
        <div class="wplus-media-topbar">\r
            <div class="wplus-media-title" data-title></div>\r
            <div class="wplus-media-actions" data-actions></div>\r
        </div>\r
        <div class="wplus-media-container" data-container></div>\r
    </div>\r
</template>\r
<template id="wplus-viewer-save-template"\r
    ><span class="wplus-media-save" data-text></span\r
></template>\r
<template id="wplus-viewer-close-template"\r
    ><span class="wplus-media-close" data-text></span\r
></template>\r
<template id="wplus-viewer-hint-template"\r
    ><div class="wplus-media-hint" data-text></div\r
></template>\r
<template id="wplus-restore-button-template">\r
    <div id="wplus-header-restore" class="wplus-header-restore-wrap">\r
        <button class="wplus-header-restore-button">\r
            <svg viewBox="0 0 24 24">\r
                <path\r
                    d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 16v-2h2v2h-2zm0-4V7h2v6h-2z"\r
                /></svg\r
            ><span class="wplus-tip">Restore deleted</span>\r
        </button>\r
    </div>\r
</template>\r
<template id="wplus-scroll-button-template">\r
    <button id="wplus-scroll-up" title="Load older messages">\r
        <svg class="wplus-scroll-icon" viewBox="0 0 24 24">\r
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg\r
        ><span class="wplus-count"></span>\r
    </button>\r
</template>\r
`;

  // src/ui.ts
  function waRequire(name) {
    return window.require(name);
  }
  (function() {
    ;
    ["wplus-btn", "wplus-panel", "wplus-css"].forEach(function(id) {
      var e = document.getElementById(id);
      if (e) e.remove();
    });
    var W = window.__wplus || {};
    function cfg(k) {
      try {
        return (JSON.parse(localStorage.getItem("wplus_cfg") || "{}") || {})[k] || false;
      } catch (e) {
        return false;
      }
    }
    function setCfg(k, v) {
      try {
        var s = JSON.parse(
          localStorage.getItem("wplus_cfg") || "{}"
        );
        s[k] = v;
        localStorage.setItem("wplus_cfg", JSON.stringify(s));
      } catch (e) {
      }
    }
    function delC() {
      try {
        return (W.deletedMsgs ? W.deletedMsgs("get") : JSON.parse(
          localStorage.getItem("wplus_del") || "[]"
        )).length;
      } catch (e) {
        return 0;
      }
    }
    function byId(id) {
      return document.getElementById(id);
    }
    function query(root, selector) {
      return root.querySelector(selector);
    }
    function queryAll(root, selector) {
      return root.querySelectorAll(selector);
    }
    var templateBank = new DOMParser().parseFromString(ui_default2, "text/html");
    function cloneTemplate(id) {
      var template = templateBank.querySelector("#" + id);
      var root = template?.content.firstElementChild;
      if (!root) throw new Error("Missing UI template: " + id);
      return root.cloneNode(true);
    }
    function appendTemplate(parent, id) {
      var element = cloneTemplate(id);
      parent.appendChild(element);
      return element;
    }
    function setEmptyState(target, message) {
      var emptyState = cloneTemplate("wplus-empty-template");
      query(emptyState, "[data-text]").textContent = message;
      target.replaceChildren(emptyState);
    }
    var css = document.createElement("style");
    css.id = "wplus-css";
    css.textContent = ui_default;
    document.head.appendChild(css);
    var dc = delC();
    var btn = cloneTemplate("wplus-trigger-template");
    var countBadge = query(btn, "#wplus-c");
    countBadge.textContent = String(dc || 0);
    if (dc > 0) countBadge.style.display = "";
    document.body.appendChild(btn);
    var P = cloneTemplate("wplus-panel-template");
    query(P, "#wp-dc").textContent = String(dc);
    queryAll(P, ".wpp-tg").forEach(function(toggle) {
      var id = toggle.dataset.t || "";
      var on = id === "checkUpdates" || id === "debugEnabled" ? cfg(id) !== false : cfg(id);
      toggle.classList.toggle("on", on);
    });
    document.body.appendChild(P);
    function uiLog(action, data) {
      if (W.debug && W.debug.isEnabled && W.debug.isEnabled()) {
        var entry = {
          t: Date.now(),
          ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
          cat: "ui",
          msg: action
        };
        if (data)
          entry.data = typeof data === "object" ? JSON.stringify(data).substring(0, 300) : String(data);
        try {
          var log = JSON.parse(
            localStorage.getItem("wplus_log") || "[]"
          );
          log.push(entry);
          if (log.length > 500) log = log.slice(-500);
          localStorage.setItem("wplus_log", JSON.stringify(log));
        } catch (e) {
        }
        console.log(
          "[WPlus:ui] " + action + (data ? " | " + entry.data : "")
        );
      }
    }
    function open() {
      P.classList.add("open");
      btn.classList.add("on");
      btn.setAttribute("aria-expanded", "true");
      refresh();
    }
    function close() {
      P.classList.remove("open");
      btn.classList.remove("on");
      btn.setAttribute("aria-expanded", "false");
    }
    function closeAll() {
      queryAll(P, ".wpp-sub.open").forEach(function(e) {
        e.classList.remove("open");
      });
    }
    function refresh() {
      var d = delC();
      var a = document.getElementById("wp-dc");
      if (a) a.textContent = String(d);
      var c = document.getElementById("wplus-c");
      if (c) {
        c.textContent = String(d);
        c.style.display = d > 0 ? "" : "none";
      }
    }
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      var isOpen = P.classList.contains("open");
      isOpen ? close() : open();
      uiLog(isOpen ? "Panel CLOSED" : "Panel OPENED");
    });
    byId("wp-x").onclick = function() {
      close();
      uiLog("Panel closed (back)");
    };
    document.addEventListener("click", function(e) {
      if (!P.classList.contains("open")) return;
      if (P.contains(e.target) || btn.contains(e.target))
        return;
      var preview = document.getElementById("wplus-preview");
      if (preview && preview.contains(e.target)) return;
      close();
    });
    window.addEventListener("wplus-update", refresh);
    queryAll(P, ".wpp-tg").forEach(function(el) {
      el.onclick = function(e) {
        e.stopPropagation();
        var id = el.dataset.t || "", on = !el.classList.contains("on");
        el.classList.toggle("on");
        setCfg(id, on);
        if (W.applyToggle) W.applyToggle(id, on);
        localStorage.setItem("wplus_sync_now", "1");
        uiLog("Toggle: " + id + " \u2192 " + (on ? "ON" : "OFF"));
      };
    });
    query(P, '[data-a="del"]').onclick = function() {
      var el = byId("wp-dl");
      if (el.classList.contains("open")) {
        el.classList.remove("open");
        return;
      }
      closeAll();
      refresh();
      var msgs = W.deletedMsgs ? W.deletedMsgs("get") : JSON.parse(
        localStorage.getItem("wplus_del") || "[]"
      );
      if (!msgs.length) {
        var emptyState = cloneTemplate(
          "wplus-empty-template"
        );
        query(emptyState, "[data-text]").textContent = "No deleted messages yet";
        el.replaceChildren(emptyState);
        el.classList.add("open");
        return;
      }
      var rows = document.createDocumentFragment();
      msgs.slice().reverse().forEach(function(m, idx) {
        var t = new Date(m.time).toLocaleString();
        var s = m.sender ? m.sender.split("@")[0] : "?";
        var typeIcon = {
          image: "\u{1F4F7}",
          video: "\u{1F3AC}",
          ptt: "\u{1F3A4}",
          audio: "\u{1F3B5}",
          sticker: "\u{1F3A8}",
          vcard: "\u{1F464}",
          location: "\u{1F4CD}"
        }[m.type] || "\u{1F4AC}";
        var rawBody = m.body || m.text || "";
        var body = "";
        var isBase64 = rawBody.length > 100 && (rawBody.indexOf("/9j/") === 0 || rawBody.indexOf("data:") === 0 || rawBody.indexOf("AAAA") === 0 || /^[A-Za-z0-9+/=]{50,}/.test(rawBody));
        if (isBase64 || [
          "image",
          "video",
          "ptt",
          "audio",
          "sticker",
          "document"
        ].indexOf(m.type) !== -1) {
          body = typeIcon + " " + (m.type === "ptt" ? "Voice message" : m.type.charAt(0).toUpperCase() + m.type.slice(1)) + (m.caption ? " \u2014 " + m.caption.substring(0, 40) : "");
        } else {
          body = rawBody.substring(0, 80);
        }
        if (!body) body = "(empty)";
        var row = cloneTemplate(
          "wplus-message-row-template"
        );
        row.dataset.idx = String(idx);
        query(row, "[data-icon]").textContent = typeIcon;
        query(row, "[data-sender]").textContent = "+" + s;
        query(row, "[data-time]").textContent = t;
        query(row, "[data-body]").textContent = body;
        query(row, "[data-go-to-chat]").dataset.nav = m.id;
        rows.appendChild(row);
      });
      el.replaceChildren(rows);
      queryAll(el, "[data-idx]").forEach(function(row) {
        row.onclick = function(e) {
          if (e.target.dataset?.nav) return;
          var idx = parseInt(row.dataset.idx || "0");
          var allMsgs = W.deletedMsgs ? W.deletedMsgs("get") : JSON.parse(
            localStorage.getItem("wplus_del") || "[]"
          );
          var m = allMsgs.slice().reverse()[idx];
          if (!m) return;
          uiLog("Saved msg clicked", {
            idx,
            id: (m.id || "?").substring(0, 40),
            type: m.type,
            sender: (m.sender || "?").split("@")[0],
            chat: m.chat || "?",
            time: m.time ? new Date(m.time).toLocaleString() : "?",
            bodyLen: (m.body || "").length,
            hasMedia: !!(m.media || m.mediaFile),
            mediaFile: m.mediaFile || ""
          });
          showPreview(m);
        };
      });
      queryAll(el, "[data-nav]").forEach(function(btn2) {
        btn2.onclick = function(e) {
          e.stopPropagation();
          var id = btn2.dataset.nav || "";
          uiLog("Go to chat clicked", { id: id.substring(0, 50) });
          if (W.goToMessage) {
            btn2.textContent = "\u23F3";
            var self = btn2;
            var ok = W.goToMessage(id);
            uiLog("goToMessage returned: " + ok);
            setTimeout(function() {
              self.textContent = "\u2192";
            }, 5e3);
          } else {
            uiLog("goToMessage not available");
          }
        };
      });
      el.classList.add("open");
    };
    query(P, '[data-a="del-clear"]').onclick = function() {
      var c = delC();
      if (!c) return;
      uiLog("Clear history clicked", { count: c });
      if (confirm("Delete " + c + " saved messages?")) {
        if (W.deletedMsgs) W.deletedMsgs("clear");
        else localStorage.removeItem("wplus_del");
        byId("wp-dl").classList.remove("open");
        refresh();
        uiLog("History cleared");
      }
    };
    query(P, '[data-a="export"]').onclick = function() {
      uiLog("Export contacts clicked");
      if (W.exportContacts) W.exportContacts();
      else alert("Loading...");
    };
    query(P, '[data-a="stats"]').onclick = function() {
      var el = byId("wp-sp");
      if (el.classList.contains("open")) {
        el.classList.remove("open");
        return;
      }
      closeAll();
      var stats = cloneTemplate("wplus-stats-template");
      query(stats, "[data-text]").textContent = W.chatStats ? W.chatStats() : "Loading...";
      el.replaceChildren(stats);
      el.classList.add("open");
    };
    query(P, '[data-a="debug-status"]').onclick = function() {
      var el = byId("wp-ds");
      if (el.classList.contains("open")) {
        el.classList.remove("open");
        return;
      }
      closeAll();
      var s = W.debug ? W.debug.status() : { error: "Engine not loaded" };
      var t = "WPlus Debug Status\n" + "\u2500".repeat(30) + "\n\n";
      t += "Version: " + (s.version || "?") + "\n";
      t += "Ready: " + (s.ready ? "YES" : "NO") + "\n";
      t += "Chats: " + (s.chats || 0) + "\n";
      t += "Contacts: " + (s.contacts || 0) + "\n";
      t += "Groups: " + (s.groups || 0) + "\n";
      t += "Hooked chats: " + (s.hookedChats || 0) + "\n";
      t += "Deleted msgs: " + (s.deletedMsgs || 0) + "\n";
      t += "Log entries: " + (s.logEntries || 0) + "\n\n";
      t += "Hooks:\n";
      if (s.hooks) {
        t += "  Composing: " + (s.hooks.composing ? "\u2705" : "\u274C") + "\n";
        t += "  Presence: " + (s.hooks.presence ? "\u2705" : "\u274C") + "\n";
        t += "  ConvSeen: " + (s.hooks.seen ? "\u2705" : "\u274C") + "\n";
        t += "  MarkPlayed: " + (s.hooks.played ? "\u2705" : "\u274C") + "\n";
      }
      t += "\nSettings:\n" + JSON.stringify(s.settings || {}, null, 2);
      var status = cloneTemplate("wplus-status-template");
      query(status, "[data-text]").textContent = t;
      el.replaceChildren(status);
      el.classList.add("open");
    };
    query(P, '[data-a="debug-log"]').onclick = function() {
      var el = byId("wp-dlog");
      if (el.classList.contains("open")) {
        el.classList.remove("open");
        return;
      }
      closeAll();
      if (!W.debug) {
        setEmptyState(el, "Engine not loaded");
        el.classList.add("open");
        return;
      }
      var log = W.debug.getLog();
      if (!log.length) {
        setEmptyState(el, "No log entries yet");
        el.classList.add("open");
        return;
      }
      var rows = document.createDocumentFragment();
      log.slice().reverse().forEach(function(e) {
        var row = cloneTemplate(
          "wplus-debug-row-template"
        );
        query(row, "[data-time]").textContent = e.ts;
        var category = query(row, "[data-category]");
        category.textContent = "[" + e.cat + "]";
        category.dataset.category = e.cat;
        query(row, "[data-message]").textContent = e.msg;
        query(row, "[data-data]").textContent = e.data || "";
        rows.appendChild(row);
      });
      el.replaceChildren(rows);
      el.classList.add("open");
    };
    query(P, '[data-a="debug-clear"]').onclick = function() {
      if (W.debug) {
        W.debug.clear();
        byId("wp-dlog").classList.remove("open");
        byId("wp-dlog").replaceChildren();
      }
    };
    queryAll(P, ".wpp-tg").forEach(function(el) {
      if (el.dataset.t === "debugEnabled") {
        el.onclick = function(e) {
          e.stopPropagation();
          var on = !el.classList.contains("on");
          el.classList.toggle("on");
          setCfg("debugEnabled", on);
          if (W.debug) {
            if (on) W.debug.enable();
            else W.debug.disable();
          }
        };
      }
    });
    function showPreview(m) {
      var old = document.getElementById("wplus-preview");
      if (old) old.remove();
      var sender = m.sender ? (m.sender + "").split("@")[0] : "Unknown";
      var time = new Date(m.time).toLocaleString();
      uiLog("Preview opened", {
        type: m.type,
        sender,
        time,
        id: (m.id || "?").substring(0, 40),
        hasMedia: !!(m.media || m.mediaFile),
        bodyLen: (m.body || "").length,
        chat: m.chat || "?"
      });
      var hasMedia = !!m.media;
      var overlay = cloneTemplate("wplus-preview-template");
      overlay.onclick = function(e) {
        if (e.target === overlay) overlay.remove();
      };
      query(overlay, "[data-sender]").textContent = "+" + sender;
      query(overlay, "[data-header-time]").textContent = time;
      var previewBubble = query(overlay, ".wplus-preview-bubble");
      var detailsRow = query(previewBubble, ".wplus-preview-time-type");
      var mediaContainer = query(overlay, "[data-media]");
      var mediaUrl = null;
      var rawBody = m.body || m.text || "";
      var isBase64 = rawBody.length > 100 && /^\/9j\/|^data:|^AAAA|^UklG|^iVBOR|^T2dn|^GkXE/i.test(rawBody);
      var isMediaType = ["image", "video", "ptt", "audio", "sticker", "document"].indexOf(
        m.type
      ) !== -1;
      var mimeMap = {
        image: "image/jpeg",
        video: "video/mp4",
        ptt: "audio/ogg",
        audio: "audio/mpeg",
        sticker: "image/webp"
      };
      if (m.mediaFile) {
        mediaUrl = "http://127.0.0.1:18733/media/" + m.mediaFile;
      } else if (m.media && m.media.length > 50) {
        mediaUrl = m.media;
      } else if (isBase64 && isMediaType) {
        var bodyData = rawBody.startsWith("data:") ? rawBody : "data:" + (mimeMap[m.type] || "application/octet-stream") + ";base64," + rawBody;
        mediaUrl = bodyData;
      }
      var hasMedia = !!mediaUrl;
      if (hasMedia && (m.type === "image" || m.type === "sticker")) {
        var previewImage = appendTemplate(
          mediaContainer,
          "wplus-preview-image-template"
        );
        previewImage.src = mediaUrl;
        previewImage.onerror = function() {
          previewImage.hidden = true;
        };
        appendTemplate(mediaContainer, "wplus-preview-image-hint-template");
      } else if (hasMedia && m.type === "video") {
        if (!m.mediaFile && !m.media && isBase64 && rawBody.length < 1e4) {
          var thumbnail = appendTemplate(
            mediaContainer,
            "wplus-preview-video-thumb-template"
          );
          query(thumbnail, "img").src = mediaUrl;
          appendTemplate(
            mediaContainer,
            "wplus-preview-video-note-template"
          );
        } else {
          var previewVideo = appendTemplate(
            mediaContainer,
            "wplus-preview-video-template"
          );
          query(previewVideo, "source").src = mediaUrl;
          appendTemplate(
            mediaContainer,
            "wplus-preview-fullscreen-template"
          );
        }
      } else if (hasMedia && (m.type === "ptt" || m.type === "audio")) {
        var audioPreview = appendTemplate(
          mediaContainer,
          "wplus-preview-audio-template"
        );
        query(audioPreview, "audio").src = mediaUrl;
      } else if (isMediaType && !hasMedia) {
        var typeLabel = {
          image: "\u{1F4F7} Image",
          video: "\u{1F3AC} Video",
          ptt: "\u{1F3A4} Voice",
          audio: "\u{1F3B5} Audio",
          sticker: "\u{1F3A8} Sticker",
          document: "\u{1F4C4} Document"
        }[m.type] || m.type;
        var unavailable = appendTemplate(
          mediaContainer,
          "wplus-preview-unavailable-template"
        );
        query(unavailable, "[data-label]").textContent = typeLabel + " \u2014 media not available";
      }
      if (m.caption && hasMedia) {
        var mediaCaption = appendTemplate(
          previewBubble,
          "wplus-preview-caption-template"
        );
        previewBubble.insertBefore(mediaCaption, detailsRow);
        query(mediaCaption, "[data-text]").textContent = m.caption.substring(0, 300);
      }
      if (!isBase64 && rawBody.length > 0 && rawBody.length < 5e3 && (m.type === "chat" || m.type === "vcard" || m.type === "location")) {
        var messageText = appendTemplate(
          previewBubble,
          "wplus-preview-text-template"
        );
        previewBubble.insertBefore(messageText, detailsRow);
        query(messageText, "[data-text]").textContent = rawBody.substring(
          0,
          2e3
        );
      }
      if (m.caption) {
        var fullCaption = appendTemplate(
          previewBubble,
          "wplus-preview-full-caption-template"
        );
        previewBubble.insertBefore(fullCaption, detailsRow);
        query(fullCaption, "[data-text]").textContent = m.caption.substring(
          0,
          500
        );
      }
      query(overlay, "[data-type]").textContent = m.type;
      query(overlay, "[data-clock]").textContent = new Date(
        m.time
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      query(overlay, "#wplus-preview-dl").hidden = !hasMedia;
      document.body.appendChild(overlay);
      byId("wplus-preview-close").onclick = function() {
        overlay.remove();
      };
      byId("wplus-preview-goto").onclick = function() {
        overlay.remove();
        if (W.goToMessage) W.goToMessage(m.id);
      };
      var previewImg = document.getElementById(
        "wplus-preview-img"
      );
      if (previewImg) {
        previewImg.onclick = function() {
          openMediaViewer(mediaUrl, m.type, sender, m.time);
        };
      }
      var fsBtn = document.getElementById("wplus-preview-fullscreen");
      if (fsBtn) {
        fsBtn.onclick = function() {
          openMediaViewer(mediaUrl, "video", sender, m.time);
        };
      }
      var dlBtn = document.getElementById(
        "wplus-preview-dl"
      );
      if (dlBtn && hasMedia) {
        dlBtn.onclick = function() {
          var ext = {
            image: "jpg",
            video: "mp4",
            ptt: "ogg",
            audio: "mp3",
            sticker: "webp"
          }[m.type] || "bin";
          var a = document.createElement("a");
          a.href = mediaUrl;
          a.download = "WPlus_" + m.type + "_" + sender + "_" + new Date(m.time).toISOString().slice(0, 10) + "." + ext;
          a.click();
        };
      }
    }
    function openMediaViewer(dataUrl, type, sender, time) {
      uiLog("Media viewer opened", {
        type,
        sender,
        srcLen: dataUrl ? dataUrl.length : 0,
        isBlob: dataUrl ? dataUrl.indexOf("blob:") === 0 : false,
        isData: dataUrl ? dataUrl.indexOf("data:") === 0 : false,
        isHttp: dataUrl ? dataUrl.indexOf("http") === 0 : false
      });
      var oldViewer = document.getElementById("wplus-media-viewer");
      if (oldViewer) oldViewer.remove();
      var viewer = cloneTemplate("wplus-viewer-template");
      var topBar = query(viewer, ".wplus-media-topbar");
      query(viewer, "[data-title]").textContent = "+" + (sender || "?") + " \xB7 " + new Date(time).toLocaleString();
      var actions = query(viewer, "[data-actions]");
      var dlDiv = appendTemplate(
        actions,
        "wplus-viewer-save-template"
      );
      dlDiv.textContent = "\u2B73 Save";
      dlDiv.onclick = function(e) {
        e.stopPropagation();
        var ext = {
          image: "jpg",
          video: "mp4",
          ptt: "ogg",
          audio: "mp3",
          sticker: "webp"
        }[type] || "bin";
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = "WPlus_" + type + "_" + (sender || "media") + "_" + new Date(time).toISOString().slice(0, 10) + "." + ext;
        a.click();
      };
      topBar.appendChild(dlDiv);
      var closeBtn = appendTemplate(
        actions,
        "wplus-viewer-close-template"
      );
      closeBtn.textContent = "\u2715";
      closeBtn.onclick = function() {
        viewer.remove();
      };
      var container = query(viewer, "[data-container]");
      if (type === "image" || type === "sticker") {
        var img = document.createElement("img");
        img.src = dataUrl;
        img.classList.add("wplus-media-image");
        var scale = 1, posX = 0, posY = 0, isDragging = false, startX = 0, startY = 0;
        img.onwheel = function(e) {
          e.preventDefault();
          var delta = e.deltaY > 0 ? -0.15 : 0.15;
          scale = Math.max(0.5, Math.min(5, scale + delta));
          img.style.transform = "scale(" + scale + ") translate(" + posX + "px," + posY + "px)";
        };
        img.onmousedown = function(e) {
          if (scale <= 1) return;
          isDragging = true;
          startX = e.clientX - posX;
          startY = e.clientY - posY;
          img.classList.add("is-grabbing");
          e.preventDefault();
        };
        container.onmousemove = function(e) {
          if (!isDragging) return;
          posX = e.clientX - startX;
          posY = e.clientY - startY;
          img.style.transform = "scale(" + scale + ") translate(" + posX + "px," + posY + "px)";
        };
        container.onmouseup = function() {
          isDragging = false;
          img.classList.remove("is-grabbing");
          img.classList.toggle("is-fit", scale <= 1);
        };
        img.ondblclick = function() {
          if (scale > 1) {
            scale = 1;
            posX = 0;
            posY = 0;
          } else {
            scale = 2.5;
          }
          img.style.transform = "scale(" + scale + ") translate(0px,0px)";
          posX = 0;
          posY = 0;
        };
        container.appendChild(img);
        var hint = appendTemplate(
          container,
          "wplus-viewer-hint-template"
        );
        hint.textContent = "Scroll to zoom \xB7 Double-click to fit \xB7 Drag to pan";
      } else if (type === "video") {
        var vid = document.createElement("video");
        vid.src = dataUrl;
        vid.controls = true;
        vid.autoplay = true;
        vid.classList.add("wplus-media-video");
        vid.onclick = function(e) {
          e.stopPropagation();
        };
        vid.ondblclick = function() {
          if (vid.requestFullscreen) vid.requestFullscreen();
          else if (vid.webkitRequestFullscreen)
            vid.webkitRequestFullscreen();
        };
        var volIndicator = document.createElement("div");
        volIndicator.className = "wplus-media-volume";
        var volTimer = null;
        vid.onwheel = function(e) {
          e.preventDefault();
          var delta = e.deltaY > 0 ? -0.05 : 0.05;
          vid.volume = Math.max(0, Math.min(1, vid.volume + delta));
          volIndicator.textContent = "\u{1F50A} " + Math.round(vid.volume * 100) + "%";
          volIndicator.classList.add("visible");
          if (volTimer) clearTimeout(volTimer);
          volTimer = setTimeout(function() {
            volIndicator.classList.remove("visible");
          }, 1500);
        };
        container.appendChild(vid);
        container.appendChild(volIndicator);
        var hint2 = appendTemplate(
          container,
          "wplus-viewer-hint-template"
        );
        hint2.textContent = "Double-click for fullscreen \xB7 Scroll to adjust volume";
      } else if (type === "ptt" || type === "audio") {
        var aud = document.createElement("audio");
        aud.src = dataUrl;
        aud.controls = true;
        aud.autoplay = true;
        aud.classList.add("wplus-media-audio");
        aud.onclick = function(e) {
          e.stopPropagation();
        };
        container.appendChild(aud);
      }
      viewer.appendChild(container);
      viewer.onclick = function(e) {
        if (e.target === viewer || e.target === container) viewer.remove();
      };
      var escHandler = function(e) {
        if (e.key === "Escape") {
          viewer.remove();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);
      document.body.appendChild(viewer);
    }
    var updateUrl = null;
    function checkForUpdate() {
      if (cfg("checkUpdates") === false) return;
      try {
        fetch(
          "https://api.github.com/repos/KuchiSofts/WPlus/releases/latest",
          { headers: { Accept: "application/json" } }
        ).then(function(r) {
          return r.json();
        }).then(function(data) {
          var latest = (data.tag_name || "").replace(/^v/, "");
          if (!latest) return;
          var cur = "2.0.0";
          if (latest.split(".").map(Number).join(".") > cur.split(".").map(Number).join(".")) {
            updateUrl = data.html_url || "https://github.com/KuchiSofts/WPlus/releases/latest";
            var bar = document.getElementById("wplus-update-bar");
            if (bar) {
              bar.classList.add("visible");
              byId("wplus-update-text").textContent = "Update v" + latest + " available \u2014 tap to download";
            }
            var dot = document.getElementById("wplus-update-dot");
            if (!dot) {
              dot = document.createElement("span");
              dot.id = "wplus-update-dot";
              dot.className = "wplus-update-dot";
              var sideBtn = document.getElementById("wplus-btn");
              if (sideBtn) {
                sideBtn.classList.add("wplus-position-relative");
                sideBtn.appendChild(dot);
              }
            }
          }
        }).catch(function() {
        });
      } catch (e) {
      }
    }
    var updateBar = document.getElementById("wplus-update-bar");
    if (updateBar) {
      updateBar.onclick = function() {
        if (updateUrl) window.open(updateUrl, "_blank");
        else
          window.open(
            "https://github.com/KuchiSofts/WPlus/releases/latest",
            "_blank"
          );
      };
    }
    setTimeout(checkForUpdate, 15e3);
    function pos() {
      var controls = [];
      document.querySelectorAll("button,[role=button]").forEach(function(element) {
        if (element === btn) return;
        var rect = element.getBoundingClientRect();
        var style = getComputedStyle(element);
        if (rect.left < 64 && rect.left >= 0 && rect.width >= 20 && rect.width <= 60 && rect.height >= 20 && rect.height <= 60 && rect.bottom > 32 && rect.top < window.innerHeight - 32 && style.display !== "none" && style.visibility !== "hidden") {
          controls.push({
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left
          });
        }
      });
      controls.sort(function(a, b) {
        return a.top - b.top;
      });
      var occupied = [];
      controls.forEach(function(control) {
        var last = occupied[occupied.length - 1];
        if (last && control.top <= last.bottom + 8) {
          last.bottom = Math.max(last.bottom, control.bottom);
        } else {
          occupied.push({ top: control.top, bottom: control.bottom });
        }
      });
      var railLeft = controls.length ? Math.min.apply(
        null,
        controls.map(function(control) {
          return control.left;
        })
      ) : 8;
      var safeTop = 40;
      var safeBottom = window.innerHeight - 8;
      var gaps = [];
      var cursor = safeTop;
      occupied.forEach(function(control) {
        var gapEnd = Math.min(control.top - 8, safeBottom);
        if (gapEnd > cursor) {
          gaps.push({ top: cursor, height: gapEnd - cursor });
        }
        cursor = Math.max(cursor, control.bottom + 8);
      });
      if (safeBottom > cursor) {
        gaps.push({ top: cursor, height: safeBottom - cursor });
      }
      gaps.sort(function(a, b) {
        return b.height - a.height;
      });
      var slot = gaps.find(function(gap) {
        return gap.height >= 40;
      });
      if (!slot) {
        slot = gaps.find(function(gap) {
          return gap.height >= 32;
        });
      }
      if (!slot) {
        btn.style.display = "none";
        return;
      }
      var size = Math.min(40, slot.height);
      btn.style.display = "flex";
      btn.style.width = size + "px";
      btn.style.height = size + "px";
      btn.style.left = Math.round(railLeft) + "px";
      btn.style.top = Math.round(slot.top + (slot.height - size) / 2) + "px";
    }
    pos();
    window.addEventListener("resize", pos);
    setInterval(pos, 1e4);
    function injectRestoreBtn() {
      var old = document.getElementById("wplus-header-restore");
      var searchButtons = [];
      document.querySelectorAll("button").forEach(function(el2) {
        var r2 = el2.getBoundingClientRect();
        var t = (el2.title || el2.ariaLabel || "").toLowerCase();
        if (r2.x > 500 && r2.y > 30 && r2.y < 90 && r2.width >= 30 && t.indexOf("search") !== -1)
          searchButtons.push(el2);
      });
      var searchBtn = searchButtons[searchButtons.length - 1];
      if (!searchBtn) {
        if (old) old.remove();
        return;
      }
      var flexContainer = null;
      var el = searchBtn;
      for (var i = 0; i < 6; i++) {
        el = el.parentElement;
        if (!el) break;
        var cs = getComputedStyle(el);
        var r = el.getBoundingClientRect();
        if (cs.display === "flex" && cs.flexDirection === "row" && r.height < 80 && el.children.length >= 2) {
          flexContainer = el;
          break;
        }
      }
      if (!flexContainer) {
        if (old) old.remove();
        return;
      }
      if (old && old.parentElement === flexContainer) return;
      if (old) old.remove();
      var wrapper = cloneTemplate(
        "wplus-restore-button-template"
      );
      var rb = query(wrapper, "button");
      rb.onclick = function(e) {
        e.stopPropagation();
        if (!W || !W.forceRestoreCurrentChat) return;
        rb.classList.add("loading");
        rb.querySelector(".wplus-tip").textContent = "Restoring...";
        W.forceRestoreCurrentChat(function(count) {
          rb.classList.remove("loading");
          rb.classList.toggle("restored", count > 0);
          rb.classList.toggle("failed", count <= 0);
          rb.querySelector(".wplus-tip").textContent = count > 0 ? count + " restored!" : "No deleted found";
          setTimeout(function() {
            rb.querySelector(
              ".wplus-tip"
            ).textContent = "Restore deleted";
            rb.classList.remove("restored", "failed");
          }, 3e3);
        });
      };
      wrapper.appendChild(rb);
      flexContainer.insertBefore(wrapper, flexContainer.firstChild);
    }
    var _injDebounce = null;
    new MutationObserver(function() {
      if (_injDebounce) clearTimeout(_injDebounce);
      _injDebounce = setTimeout(function() {
        injectRestoreBtn();
        checkScrollUp();
      }, 500);
    }).observe(document.getElementById("app") || document.body, {
      childList: true,
      subtree: true
    });
    injectRestoreBtn();
    var scrollUpBtn = cloneTemplate(
      "wplus-scroll-button-template"
    );
    document.body.appendChild(scrollUpBtn);
    var _loadingOlder = false;
    scrollUpBtn.onclick = function(e) {
      e.stopPropagation();
      if (_loadingOlder) return;
      _loadingOlder = true;
      scrollUpBtn.classList.add("loading");
      try {
        var CC = waRequire("WAWebChatCollection").ChatCollection;
        var chatState = { current: null };
        var headers = document.querySelectorAll("header");
        headers.forEach(function(h) {
          var r = h.getBoundingClientRect();
          if (r.x > 400 && r.width > 200) {
            h.querySelectorAll(
              'span[dir="auto"],span.x1iyjqo2'
            ).forEach(function(s) {
              var name = s.textContent.trim();
              if (name && !chatState.current)
                (CC._models || []).forEach(function(c) {
                  if (c.__x_name === name || c.__x_formattedTitle === name)
                    chatState.current = c;
                });
            });
          }
        });
        if (!chatState.current)
          (CC._models || []).forEach(function(c) {
            if (c.__x_active) chatState.current = c;
          });
        var chat = chatState.current;
        if (!chat) {
          _loadingOlder = false;
          scrollUpBtn.classList.remove("loading");
          return;
        }
        var activeChat = chat;
        var loader = waRequire("WAWebChatLoadMessages");
        var before = activeChat.msgs && activeChat.msgs._models ? activeChat.msgs._models.length : 0;
        loader.loadEarlierMsgs(activeChat).then(function() {
          var after = activeChat.msgs && activeChat.msgs._models ? activeChat.msgs._models.length : 0;
          var loaded = after - before;
          _loadingOlder = false;
          scrollUpBtn.classList.remove("loading");
          var badge = scrollUpBtn.querySelector(
            ".wplus-count"
          );
          if (loaded > 0) {
            badge.textContent = "+" + loaded;
            badge.classList.add("visible");
            setTimeout(function() {
              badge.classList.remove("visible");
            }, 3e3);
            setTimeout(function() {
              var scrolled = false;
              document.querySelectorAll(
                '[role="application"] div, #main div, [data-tab] div'
              ).forEach(function(el) {
                if (scrolled) return;
                if (el.scrollHeight > el.clientHeight + 100 && el.clientHeight > 200) {
                  var r = el.getBoundingClientRect();
                  if (r.x > 400 && r.width > 300) {
                    el.scrollTop = 0;
                    scrolled = true;
                  }
                }
              });
            }, 300);
          } else {
            badge.textContent = "\u2714";
            badge.classList.add("visible");
            scrollUpBtn.title = "No more messages";
            setTimeout(function() {
              badge.classList.remove("visible");
              scrollUpBtn.title = "Load older messages";
            }, 2e3);
          }
        }).catch(function() {
          _loadingOlder = false;
          scrollUpBtn.classList.remove("loading");
        });
      } catch (ex) {
        _loadingOlder = false;
        scrollUpBtn.classList.remove("loading");
      }
    };
    function checkScrollUp() {
      var hasChat = false;
      document.querySelectorAll("header").forEach(function(h) {
        if (h.getBoundingClientRect().x > 400 && h.getBoundingClientRect().width > 200)
          hasChat = true;
      });
      scrollUpBtn.classList.toggle("visible", hasChat);
    }
    checkScrollUp();
    return "ok";
  })();
})();
