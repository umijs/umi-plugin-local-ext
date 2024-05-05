
# umi-plugin-ext-link-checker

给 `<Link to="${path}" />` 的 `path` 输入部分添加 IDE 提示，并自动检查该 `path` 是否使用了不存在的路由。

预览：

<img src='https://cdn.jsdelivr.net/gh/fz6m/Private-picgo@moe-2024/img/202405051248500.gif' width='25%' />

> 注：需先安装工作区插件，仅 VSCode >= 1.89.0 版本生效。

### Install

```bash
  pnpm add -D umi-plugin-ext-link-checker
```

### Usage

```ts
// .umirc.ts
import { defineConfig } from "umi";

export default defineConfig({
  plugins: ['umi-plugin-ext-link-checker'],
  linkChecker: {}
});
```
