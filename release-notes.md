## 更新日志 · Changelog

### v1.1.0 —— 首个公开版本：支持洛谷首页

**新功能**：

1. **首页背景**：`https://www.luogu.com.cn/` 的经典布局也支持换背景，顶部横幅和整页铺满两种模式都可用；首页卡片本身是 70% 白，图片会自然透出。
2. **本地图片与图片直链**：本地图片自动压缩到最长边 2560px 的 WebP 后保存在浏览器本地；URL 直链带加载预览。
3. **亮度与模糊**：亮度 20%–150%，模糊 0–24px，拖动即时生效。
4. **只作用于洛谷**：`luogu.com.cn` / `luogu.com` / `luogu.org`，其他网站不注入。

**升级注意**：

- 首次安装需要刷新一次洛谷页面；之后换图不需要刷新。
- 扩展目录已改为英文 `luogu-background-replacer`，加载路径变化会改变扩展 ID，请先移除旧条目再重新加载。

**说明**：题目页、题目列表使用 `.theme-page` 变量覆盖；首页使用 `.main-container` 的伪元素，滚动时背景固定。

**下载 · Downloads**

| 文件 | 用途 |
|---|---|
| `luogu-background-replacer-v1.1.0.zip` | Chrome / Edge 扩展，解压后「加载已解压的扩展程序」 |

---

## Changelog (English)

### v1.1.0 — first public release, with homepage support

**New**:

1. **Homepage background**: the classic layout at `https://www.luogu.com.cn/` now supports both banner and full-page modes; its 70%-white cards let the image show through.
2. **Local image and image URL**: local files are resized to a 2560px WebP and stored locally; URLs get a live preview.
3. **Brightness and blur**: 20–150% brightness and 0–24px blur, applied live.
4. **Luogu only**: `luogu.com.cn` / `luogu.com` / `luogu.org`; no other sites are touched.

**Upgrade notes**:

- Reload the Luogu page once after installing; subsequent image changes apply without a reload.
- The extension folder is now the English `luogu-background-replacer`; loading from a new path changes the extension ID, so remove the old entry before loading the new one.

**Notes**: problem pages and problem lists use `.theme-page` variable overrides; the homepage uses a pseudo-element on `.main-container`, with a fixed background while scrolling.

**Downloads**

| File | Purpose |
|---|---|
| `luogu-background-replacer-v1.1.0.zip` | Chrome / Edge extension; unzip and “Load unpacked” |
