import { existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import path, { join } from 'path'
import * as vscode from 'vscode'
import chokidar from 'chokidar'
import { debounce } from 'lodash' 

const loadedMap: Record<
  string,
  {
    module: any
  }
> = {}
function loadPlugin(file: string) {
  if (!existsSync(file)) {
    return
  }
  if (!loadedMap[file]) {
    // load new
    delete require.cache[file]
    const mod = require(file)
    loadedMap[file] = {
      module: mod,
    }
    vscode.window.showInformationMessage(
      `Umi local plugin: ${path.basename(path.dirname(file))} has been loaded`,
    )
    return mod
  }
  if (loadedMap[file]) {
    // skip
    return
  }
  return
}

interface IVersion {
  usingVersion: string
}

let unwatch: (() => void) | undefined
let dispose: (() => void) | undefined

const extPkgPath = path.join(__dirname, '../package.json')
const versionInfoPath = path.join(__dirname, '../version.json')
function checkUpdate() {
  delete require.cache[extPkgPath]
  const extPkg = require(extPkgPath)
  if (!existsSync(versionInfoPath)) {
    // create
    const versionInfo: IVersion = {
      usingVersion: extPkg.version,
    }
    writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2), 'utf-8')
  } else {
    delete require.cache[versionInfoPath]
    const versionInfo: IVersion = require(versionInfoPath)
    const isVersionChanged = versionInfo.usingVersion !== extPkg.version
    // show reload vscode message
    if (isVersionChanged) {
      vscode.window.showInformationMessage(
        'Umi local extension has been updated, please reload vscode window to take effect',
        'Reload Window',
      ).then((res) => {
        if (res === 'Reload Window') {
          // update version
          versionInfo.usingVersion = extPkg.version
          writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2), 'utf-8')
          vscode.commands.executeCommand('workbench.action.reloadWindow')
        }
      })
    }
  }
}
const checkUpdateDebounce = debounce(checkUpdate, 1000)

export function activate(context: vscode.ExtensionContext) {
  checkUpdate()
  // watch version change
  const pkgWatcher = chokidar.watch(extPkgPath)
  pkgWatcher.on('change', () => {
    try {
      checkUpdateDebounce()
    } catch {}
  })

  const loadNewPlugin = () => {
    const dynamicDir = path.join(__dirname, '../dynamic')
    if (!existsSync(dynamicDir)) {
      return
    }
    const dirs = readdirSync(dynamicDir)
      .filter((file) => {
        return file !== '.DS_Store'
      })
      .map((file) => {
        return join(dynamicDir, file)
      })
      .filter((absPath) => {
        const isDir = statSync(absPath).isDirectory()
        return isDir
      })
    dirs.forEach((dir) => {
      const indexFile = join(dir, 'index.js')
      const mod = loadPlugin(indexFile)
      if (!mod) {
        return
      }
      const { activate, deactivate } = mod
      if (activate && typeof activate === 'function') {
        activate(context)
      }
      if (deactivate && typeof deactivate === 'function') {
        const originDispose = dispose
        dispose = () => {
          originDispose?.()
          deactivate()
        }
      }
    })
  }
  const loadNewPluginDebounce = debounce(loadNewPlugin, 500)
  // watch dir change
  const dynamicDir = path.join(__dirname, '../dynamic')
  // const chokidar = require('chokidar')
  const watcher = chokidar.watch(dynamicDir)
  watcher.on('ready', () => {
    loadNewPluginDebounce()
    // watch dir add
    watcher.on('addDir', () => {
      loadNewPluginDebounce()
    })
  })

  unwatch = () => {
    watcher.close()
    pkgWatcher.close()
  }
}

export function deactivate() {
  unwatch?.()
  dispose?.()
}
