/*!
 * 洛谷背景替换 · Luogu Background Replacer
 * Copyright (C) 2026 fish
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* 洛谷背景替换 —— content script
 * 思路：洛谷把主题写成 .theme-page 上的内联 CSS 变量，再由 .theme-page::before 绘制背景。
 * 这里只做两件事：在 <html> 上挂状态属性 + 写入 --lgbg-* 变量，剩下交给 theme.css 覆盖。
 */
(() => {
  "use strict";

  if (window.__lgbgLoaded) return;
  window.__lgbgLoaded = true;

  const DEFAULTS = {
    enabled: true,
    source: "local",       // local | url
    localImage: "",        // data URL
    localName: "",
    url: "",
    mode: "banner",        // banner | full
    brightness: 100,       // 百分比
    blur: 0                // px
  };

  const api = typeof chrome !== "undefined" && chrome.storage
    ? chrome
    : (typeof browser !== "undefined" ? browser : null);
  if (!api) return;

  const root = document.documentElement;
  let state = { ...DEFAULTS };

  /* chrome.* 用回调，browser.* 用 Promise，这里统一成 Promise 并做超时兜底；必须带上 this */
  function call(target, fn, ...args) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      try {
        const ret = fn.call(target, ...args, (value) => done(value));
        if (ret && typeof ret.then === "function") ret.then(done, () => done(undefined));
      } catch (err) {
        done(undefined);
      }
    });
  }

  function toCssUrl(raw) {
    const value = String(raw)
      .replace(/[\r\n\t]/g, "")
      .replace(/[\\"()']/g, (ch) => encodeURIComponent(ch));
    return `url("${value}")`;
  }

  function activeImage(s) {
    return s.source === "url" ? String(s.url || "").trim() : String(s.localImage || "");
  }

  function apply(next) {
    state = { ...DEFAULTS, ...(next || {}) };

    const image = activeImage(state);
    const on = Boolean(state.enabled) && Boolean(image);

    root.setAttribute("data-lgbg-on", on ? "1" : "0");
    root.setAttribute("data-lgbg-mode", state.mode === "full" ? "full" : "banner");

    if (!on) {
      root.style.removeProperty("--lgbg-image");
      root.style.removeProperty("--lgbg-filter");
      return;
    }

    root.style.setProperty("--lgbg-image", toCssUrl(image));

    const brightness = Math.min(2, Math.max(0.2, (Number(state.brightness) || 100) / 100));
    const blur = Math.min(50, Math.max(0, Number(state.blur) || 0));

    const parts = [];
    if (Math.round(brightness * 100) !== 100) {
      parts.push(`brightness(${Math.round(brightness * 100) / 100})`);
    }
    if (blur > 0) parts.push(`blur(${Math.round(blur)}px)`);

    root.style.setProperty("--lgbg-filter", parts.length ? parts.join(" ") : "none");
  }

  apply(state);

  call(api.storage.local, api.storage.local.get, DEFAULTS).then((stored) => {
    if (stored) apply(stored);
  });

  api.storage.onChanged.addListener((changes, area) => {
    if (area && area !== "local") return;
    const patch = {};
    for (const key of Object.keys(changes)) {
      patch[key] = changes[key].newValue;
    }
    apply({ ...state, ...patch });
  });

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "lgbg-ping") {
      sendResponse({
        ok: true,
        enabled: state.enabled,
        mode: state.mode,
        hasImage: Boolean(activeImage(state))
      });
    }
    return false;
  });
})();
