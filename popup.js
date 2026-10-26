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

/* 洛谷背景替换 —— popup
 * 存 chrome.storage.local，content.js 监听 storage.onChanged 实时应用。
 */
(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    source: "local",
    localImage: "",
    localName: "",
    url: "",
    mode: "banner",
    brightness: 100,
    blur: 0
  };

  const MAX_WIDTH = 2560;
  const MAX_HEIGHT = 1600;
  const MAX_DATA_LENGTH = 4_500_000; // 约 3.4MB 二进制

  const $ = (id) => document.getElementById(id);

  const els = {
    enabled: $("enabled"),
    status: $("status"),
    sourceSeg: $("sourceSeg"),
    localPanel: $("localPanel"),
    urlPanel: $("urlPanel"),
    fileInput: $("fileInput"),
    dropZone: $("dropZone"),
    previewRow: $("previewRow"),
    preview: $("preview"),
    fileName: $("fileName"),
    changeImage: $("changeImage"),
    removeImage: $("removeImage"),
    localHint: $("localHint"),
    urlInput: $("urlInput"),
    applyUrl: $("applyUrl"),
    urlPreview: $("urlPreview"),
    urlHint: $("urlHint"),
    brightness: $("brightness"),
    brightnessOut: $("brightnessOut"),
    blur: $("blur"),
    blurOut: $("blurOut"),
    reset: $("reset")
  };

  let state = { ...DEFAULTS };
  let tabInfo = { isLuogu: false, tabId: null, injected: false };
  let saveTimer = null;
  let dirty = false;
  let urlPreviewToken = 0;

  /* ---------------- 基础工具 ---------------- */

  /* 兼容 chrome.*（回调）与 browser.*（Promise）；必须带上 this，否则会 Illegal invocation */
  function callChrome(target, fn, ...args) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      try {
        const ret = fn.call(target, ...args, (value) => {
          void (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError);
          done(value);
        });
        if (ret && typeof ret.then === "function") ret.then(done, () => done(undefined));
      } catch (err) {
        done(undefined);
      }
    });
  }

  function isLuoguUrl(url) {
    if (!url) return false;
    try {
      const host = new URL(url).hostname;
      return /(^|\.)luogu\.(com\.cn|com|org)$/.test(host);
    } catch (err) {
      return false;
    }
  }

  function activeImage() {
    return state.source === "url" ? String(state.url || "").trim() : String(state.localImage || "");
  }

  function humanSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /* ---------------- 读写设置 ---------------- */

  function commit(patch) {
    if (patch) Object.assign(state, patch);
    dirty = true;
    renderAll();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 90);
  }

  function flush() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!dirty) return;
    dirty = false;
    callChrome(chrome.storage.local, chrome.storage.local.set, { ...state });
  }

  window.addEventListener("pagehide", flush);
  window.addEventListener("blur", flush);

  /* ---------------- 渲染 ---------------- */

  function renderAll() {
    els.enabled.checked = Boolean(state.enabled);

    els.sourceSeg.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.source === state.source);
    });

    els.localPanel.hidden = state.source !== "local";
    els.urlPanel.hidden = state.source !== "url";

    if (state.localImage) {
      els.dropZone.hidden = true;
      els.previewRow.hidden = false;
      els.preview.style.backgroundImage = `url("${state.localImage}")`;
      els.fileName.textContent = state.localName || "本地图片";
      els.fileName.title = state.localName || "";
    } else {
      els.dropZone.hidden = false;
      els.previewRow.hidden = true;
      els.preview.style.backgroundImage = "none";
    }

    if (document.activeElement !== els.urlInput) {
      els.urlInput.value = state.url || "";
    }

    document.querySelectorAll('input[name="mode"]').forEach((input) => {
      input.checked = input.value === state.mode;
    });

    els.brightness.value = String(state.brightness);
    els.brightnessOut.textContent = `${state.brightness}%`;
    els.blur.value = String(state.blur);
    els.blurOut.textContent = `${state.blur}px`;

    renderStatus();
  }

  function renderStatus() {
    const el = els.status;
    el.className = "status";

    if (!tabInfo.isLuogu) {
      el.textContent = "非洛谷页面 · 设置已保存";
      el.classList.add("warn");
      return;
    }
    if (!state.enabled) {
      el.textContent = "已停用 · 洛谷恢复原背景";
      return;
    }
    if (!tabInfo.injected) {
      el.textContent = "页面未连接 · 刷新后生效";
      el.classList.add("warn");
      return;
    }
    if (!activeImage()) {
      el.textContent = "还没有选择图片";
      el.classList.add("warn");
      return;
    }
    el.textContent = "已在当前洛谷页面生效";
    el.classList.add("ok");
  }

  function setLocalHint(text, kind) {
    els.localHint.hidden = !text;
    els.localHint.textContent = text || "";
    els.localHint.className = `hint${kind ? " " + kind : ""}`;
  }

  function setUrlHint(text, kind) {
    els.urlHint.textContent = text;
    els.urlHint.className = `hint${kind ? " " + kind : ""}`;
  }

  const URL_HINT_DEFAULT = "支持 http / https 图片直链，只要图片能直接打开就能用作背景。";

  /* ---------------- 图片处理 ---------------- */

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("无法读取这张图片"));
      };
      img.src = objectUrl;
    });
  }

  function encode(canvas, quality) {
    let data = canvas.toDataURL("image/webp", quality);
    if (!data.startsWith("data:image/webp")) {
      data = canvas.toDataURL("image/jpeg", quality);
    }
    return data;
  }

  async function compressImage(file) {
    const img = await loadImageFile(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) throw new Error("图片尺寸无效");

    const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    let data = encode(canvas, 0.9);

    // 仍然太大就再降一档
    if (data.length > MAX_DATA_LENGTH) {
      const shrink = Math.min(1, 1920 / w);
      const canvas2 = document.createElement("canvas");
      canvas2.width = Math.max(1, Math.round(w * shrink));
      canvas2.height = Math.max(1, Math.round(h * shrink));
      const ctx2 = canvas2.getContext("2d");
      ctx2.imageSmoothingEnabled = true;
      ctx2.imageSmoothingQuality = "high";
      ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
      data = encode(canvas2, 0.82);
    }

    return { data, width: w, height: h };
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalHint("请选择图片文件（png / jpg / webp / gif）", "err");
      return;
    }

    setLocalHint("正在压缩…");
    try {
      const result = await compressImage(file);
      const bytes = Math.round(result.data.length * 0.75);

      commit({
        source: "local",
        localImage: result.data,
        localName: file.name,
        enabled: true
      });

      setLocalHint(`已载入 ${result.width}×${result.height} · ${humanSize(bytes)}`, "ok");
      els.fileInput.value = "";
    } catch (err) {
      setLocalHint(err && err.message ? err.message : "图片处理失败", "err");
    }
  }

  /* ---------------- URL 预览 ---------------- */

  function previewUrl(url) {
    const token = ++urlPreviewToken;
    els.urlPreview.classList.remove("err");
    els.urlPreview.style.backgroundImage = "none";
    els.urlPreview.textContent = "加载中…";

    if (!url) {
      els.urlPreview.textContent = "可以直接粘贴洛谷的背景图地址";
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (token !== urlPreviewToken) return;
      const safe = url.replace(/["\\()\r\n]/g, (ch) => encodeURIComponent(ch));
      els.urlPreview.textContent = "";
      els.urlPreview.style.backgroundImage = `url("${safe}")`;
    };
    img.onerror = () => {
      if (token !== urlPreviewToken) return;
      els.urlPreview.textContent = "图片加载失败：检查地址是否可直连";
      els.urlPreview.classList.add("err");
    };
    img.src = url;
  }

  function applyUrl() {
    const raw = els.urlInput.value.trim();

    if (!raw) {
      setUrlHint("先填一个图片地址", "err");
      return;
    }

    let parsed;
    try {
      parsed = new URL(raw);
    } catch (err) {
      setUrlHint("地址格式不对，需要以 http:// 或 https:// 开头", "err");
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setUrlHint("只支持 http / https 地址", "err");
      return;
    }

    commit({ source: "url", url: parsed.href, enabled: true });
    setUrlHint("已应用，页面上会立即更新", "ok");
    previewUrl(parsed.href);
  }

  /* ---------------- 事件绑定 ---------------- */

  function bindEvents() {
    els.enabled.addEventListener("change", () => {
      commit({ enabled: els.enabled.checked });
    });

    els.sourceSeg.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-source]");
      if (!btn) return;
      const source = btn.dataset.source;
      commit({ source });
      if (source === "url") previewUrl(state.url);
    });

    els.dropZone.addEventListener("click", () => els.fileInput.click());
    els.changeImage.addEventListener("click", () => els.fileInput.click());

    els.fileInput.addEventListener("change", () => {
      handleFile(els.fileInput.files && els.fileInput.files[0]);
    });

    ["dragenter", "dragover"].forEach((type) => {
      els.dropZone.addEventListener(type, (event) => {
        event.preventDefault();
        els.dropZone.classList.add("drag");
      });
    });

    ["dragleave", "dragend"].forEach((type) => {
      els.dropZone.addEventListener(type, () => els.dropZone.classList.remove("drag"));
    });

    els.dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      els.dropZone.classList.remove("drag");
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      handleFile(file);
    });

    els.removeImage.addEventListener("click", () => {
      commit({ localImage: "", localName: "" });
      setLocalHint("");
    });

    els.applyUrl.addEventListener("click", applyUrl);
    els.urlInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyUrl();
      }
    });

    document.querySelectorAll('input[name="mode"]').forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) commit({ mode: input.value });
      });
    });

    els.brightness.addEventListener("input", () => {
      commit({ brightness: Number(els.brightness.value) });
    });

    els.blur.addEventListener("input", () => {
      commit({ blur: Number(els.blur.value) });
    });

    els.reset.addEventListener("click", () => {
      state = { ...DEFAULTS };
      dirty = true;
      flush();
      renderAll();
      els.urlInput.value = "";
      setLocalHint("");
      setUrlHint(URL_HINT_DEFAULT);
      els.urlPreview.classList.remove("err");
      els.urlPreview.style.backgroundImage = "none";
      els.urlPreview.textContent = "可以直接粘贴洛谷的背景图地址";
    });
  }

  /* ---------------- 初始化 ---------------- */

  async function refreshTab() {
    const tabs = await callChrome(chrome.tabs, chrome.tabs.query, { active: true, currentWindow: true });
    const tab = Array.isArray(tabs) ? tabs[0] : null;

    tabInfo.isLuogu = Boolean(tab && isLuoguUrl(tab.url));
    tabInfo.tabId = tab ? tab.id : null;
    tabInfo.injected = false;

    if (tabInfo.isLuogu && tabInfo.tabId != null) {
      const response = await callChrome(chrome.tabs, chrome.tabs.sendMessage, tabInfo.tabId, { type: "lgbg-ping" });
      tabInfo.injected = Boolean(response && response.ok);
    }

    renderStatus();
  }

  async function init() {
    const stored = await callChrome(chrome.storage.local, chrome.storage.local.get, DEFAULTS);
    state = { ...DEFAULTS, ...(stored || {}) };

    bindEvents();
    renderAll();

    if (state.source === "url" && state.url) previewUrl(state.url);
    if (state.localImage) {
      const bytes = Math.round(state.localImage.length * 0.75);
      setLocalHint(`当前图片 ${humanSize(bytes)}`, "ok");
    }

    await refreshTab();
  }

  init();
})();
