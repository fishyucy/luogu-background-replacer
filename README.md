# 洛谷背景替换 · Luogu Background Replacer

> 把洛谷的页面背景换成你自己的图片，支持本地图片、图片直链、亮度、模糊和两种显示模式。 · Replace Luogu's page background with your own image.
>
> 当前版本 · Version **1.1.0** · [跳到 English](#english)

---

# 中文

## 这是什么

一个只在洛谷生效的浏览器扩展（Chrome / Edge，Manifest V3）。它把你选的图片铺到洛谷的题目页、题目列表和首页上，可以调亮度和模糊，也可以选择只替换顶部 400px 的横幅。所有设置保存在浏览器本地，不联网、不上传。

和“换肤脚本”的区别：扩展不修改洛谷的 DOM，只覆盖它自己的 CSS 变量和一层伪元素，所以卡片、磨砂和响应式布局都保持原样。

## 特性

- **本地图片**：选择或拖入文件，自动压缩到最长边 2560px 的 WebP 再保存，原图不动
- **图片 URL**：任意 http / https 直链，带加载预览与失败提示
- **两种模式**
  - 顶部横幅：保留洛谷原本的 400px 渐隐横幅，只换成你的图
  - 整页铺满：固定全屏背景，滚动页面时不移动
- **首页也生效**：`https://www.luogu.com.cn/` 的经典布局通过半透明卡片透出背景
- **亮度 20% – 150%、模糊 0 – 24px**：拖动滑块即时预览
- **只作用于洛谷**：`luogu.com.cn` / `luogu.com` / `luogu.org`
- **停用即还原**：关掉开关，页面回到洛谷原来的背景
- 权限只有 `storage`、`unlimitedStorage` 和洛谷站点访问

## 安装

### Chrome / Edge

1. 打开 `chrome://extensions`（Edge 为 `edge://extensions`）
2. 打开右上角的「开发者模式」
3. 点「加载已解压的扩展程序」，选择含 `manifest.json` 的目录
4. 打开任意洛谷页面，点工具栏里的扩展图标

### 从发布包安装

`release/` 目录里的 zip 是本地打包产物（不进仓库、只保留最新版），解压后按上面的步骤加载即可：

```text
release/luogu-background-replacer-v1.1.0.zip
```

### Firefox

`about:debugging#/runtime/this-firefox` → 「临时载入附加组件」→ 选择本目录下的 `manifest.json`。

Firefox 109+ 支持 MV3，功能一致；本项目暂未做 AMO 签名，重启浏览器后需要重新加载。

## 使用

1. 在洛谷页面点扩展图标
2. 「本地图片」选择文件，或切到「图片 URL」粘贴地址后点「应用」
3. 选「顶部横幅」或「整页铺满」
4. 按需拖动亮度 / 模糊
5. 想临时对比原背景，点右上角开关即可

换图后如果页面已经开着，通常不需要刷新：设置会通过 `chrome.storage.onChanged` 实时推送过去。只有在扩展刚安装、当前页面还没注入脚本时才需要刷新一次（弹窗会提示「页面未连接 · 刷新后生效」）。

## 工作原理

### 新版主题页（题目、题目列表等）

洛谷把主题写成了 `.theme-page` 上的内联 CSS 变量，真正的背景由 `.theme-page::before` 绘制。扩展在 `<html>` 上挂 `data-lgbg-on` / `data-lgbg-mode`，再用带 `!important` 的样式表规则覆盖这些变量：

```css
html[data-lgbg-on="1"] .theme-page {
  --theme-body-image: var(--lgbg-image) !important;
  --theme-body-image-size: cover !important;
  --theme-body-color-filter: var(--lgbg-filter) !important;
}
```

### 经典首页

首页没有 `.theme-page`，背景挂在 `.main-container` 上。扩展加了一个 `z-index: -1` 的伪元素，配合 `isolation: isolate` 垫在灰色底色和内容之间；首页卡片本身是 70% 白，图片会自然透出。整页模式用 `background-attachment: fixed` 固定在视口。

两种页面都不需要改 DOM，也不会影响洛谷自己的布局。

## 目录结构

```text
manifest.json          扩展清单（Manifest V3，无后台脚本）
content.js             注入页面、写入 CSS 变量
theme.css              主题页 / 首页的背景覆盖
popup.html/.css/.js    设置面板与图片压缩
icons/                 16/32/48/128 图标
scripts/make-icons.ps1 重新生成图标的脚本（Windows PowerShell）
release.config.json    发布包配置
release-notes.md       当前版本更新日志
```

## 常见问题

**装了没反应？**
先到 `chrome://extensions` 确认扩展已启用，再刷新洛谷页面；如果刚改过扩展文件，要先点扩展卡片上的刷新按钮。

**图片 URL 显示加载失败？**
这个地址不能直接打开，或者做了防盗链。换一个能直接访问的直链，或改用本地图片。

**整页模式下首页卡片发灰、能看到背景？**
这是首页卡片本来的 70% 白半透明设计，背景会透出来；题目页的卡片是磨砂玻璃，效果更明显。

**会上传我的图片吗？**
不会。图片只保存在 `chrome.storage.local`，扩展没有任何网络请求（除了加载你填的图片 URL）。

## 已知限制

- 洛谷前端改版后，如果 `.theme-page` / `.main-container` 这些结构变了，需要同步调整 `theme.css`
- GIF 会按静态图处理，只保留第一帧
- 有防盗链或依赖特殊请求头的图片可能加载失败（浏览器按普通图片请求处理）
- 移动端布局未测试
- 未上架 Chrome Web Store / AMO，需要手动加载

## 许可 · License

本项目采用 **GNU General Public License v3.0**，全文见 [LICENSE](LICENSE)。

---

# English

## What it is

A Manifest V3 extension for Chrome / Edge that replaces Luogu's page background with your own image — on problem pages, problem lists, and the classic homepage. Brightness, blur and two display modes are adjustable. Everything is stored locally; nothing is uploaded.

Unlike userstyle scripts, it does not touch Luogu's DOM: it overrides the site's own CSS variables and paints a single pseudo-element, so cards, frosted glass and responsive layout stay intact.

## Features

- **Local image** or **image URL**, with automatic resize to a 2560px WebP
- **Two modes**: top banner (400px with a fade) or fixed full-page background
- **Homepage support** via the semi-transparent cards of the classic layout
- **Brightness 20–150%** and **blur 0–24px**, with live preview
- **Luogu only** — no injection on any other site
- Disabling restores the original background instantly
- Permissions: `storage`, `unlimitedStorage`, and Luogu host access

## Install

1. Open `chrome://extensions` (Edge: `edge://extensions`)
2. Enable Developer mode
3. Click “Load unpacked” and pick the folder containing `manifest.json`
4. Open Luogu and click the toolbar icon

A locally built zip is available under `release/` (generated from `release.config.json`, latest version only, not committed):

```text
release/luogu-background-replacer-v1.1.0.zip
```

Firefox 109+: `about:debugging#/runtime/this-firefox` → “Load Temporary Add-on” → `manifest.json`.
The project is not AMO-signed yet, so the add-on must be reloaded after a browser restart.

## Usage

Pick a local file or paste an image URL, choose banner or full-page mode, then adjust brightness and blur. Settings are pushed to open tabs through `chrome.storage.onChanged`, so a reload is normally unnecessary once the content script is injected. Reload the page only after installing the extension or editing its files.

## How it works

On the new frontend, Luogu writes its theme into inline CSS variables on `.theme-page`, and `.theme-page::before` paints the background. The extension sets `data-lgbg-*` attributes on `<html>` and overrides those variables with `!important` rules.

The classic homepage has no `.theme-page`; the extension adds a `z-index: -1` pseudo-element inside `.main-container` (with `isolation: isolate`) so the image sits between the grey page background and the content. The homepage cards are 70% white, so the image shows through. Full-page mode uses `background-attachment: fixed`.

## Layout

```text
manifest.json          Manifest V3, no background worker
content.js             Injects attributes and CSS variables
theme.css              Theme page / homepage overrides
popup.html/.css/.js    Options UI and image compression
icons/                 Toolbar icons
scripts/               Icon generator
release.config.json    Release packaging config
release-notes.md       Current changelog
```

## FAQ

**Nothing happens.**
Enable the extension on `chrome://extensions`, reload the Luogu page, and reload the extension after editing files.

**The image URL fails to load.**
The URL is not directly accessible or is hotlink-protected. Use a local file instead.

**Homepage cards look grey.**
The classic homepage cards are 70% white by design, so the background shows through.

**Is my image uploaded?**
No. Images stay in `chrome.storage.local`; the only network request is loading the URL you provide.

## Known limitations

- Luogu front-end changes may break the selectors in `theme.css`
- Animated GIFs keep only the first frame
- Images protected by hotlink rules or custom headers may fail to load (they are fetched as ordinary images)
- Mobile layout is untested
- Not published on the Chrome Web Store / AMO yet

## License

This project is licensed under the **GNU General Public License v3.0** — see [LICENSE](LICENSE).
