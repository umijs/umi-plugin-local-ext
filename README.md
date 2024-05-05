# umi-plugin-local-ext

使用 Umi 插件控制你的 VSCode IDE ，获取更好的开发体验。 

## 动机

VSCode 自 `>= 1.89.0` 支持从工作区（项目根目录）加载本地 VSCode 插件，这使我们可以使用 Umi 插件来为 VSCode 新增一项或多项功能，而不是单独发布一个 VSCode 插件。

这种做法有三个好处：

#### 一次性

开发 VSCode 插件易，但管理难，为每种场景都开发和安装一个 VSCode 插件，让 IDE 安装满了各种不必要的插件，安装了用不到会干扰视野，降低性能，而卸载了在真正使用时又要麻烦安装回来，食之无味、弃之可惜。

项目内 VSCode 插件解决了这个问题，仅在开发此项目时生效，无需 Hack TS 依赖。

#### 联动性

VSCode 插件能做到的事情无限大，但它是外部独立运行的，和项目运行时数据很难联动。

项目内 VSCode 插件更好的解决了这个问题，让 VSCode 插件利用项目内数据的难度更低。

#### 扩展性

把自定义 IDE 功能的粒度从 IDE 插件降为 npm 上的一个包，这使管理、开发、使用更容易和简单。

VSCode 插件会自动更新，很难管理版本，不同 VSCode 插件版本间可能要做历史逻辑兼容，而 Umi 插件只跟 npm 包版本有关，控制更灵活。

## 开发一个 Umi Local Ext 插件来自定义 VSCode

要给 VSCode 新增一项功能，我们需要开发一个 Umi 插件，在其中添加 VSCode 插件功能，并使用 `umi-plugin-local-ext` 与 Umi 集成，这是一个提供了工具方法的 SDK 。

#### 实例

给 `<Link to="${path}" />` 的 `path` 输入部分添加 IDE 提示，并自动检查该 `path` 是否合法

 - 源码：[`umi-plugin-ext-link-checker`](./packages/umi-plugin-ext-link-checker)
