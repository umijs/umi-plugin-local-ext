import { existsSync, readdirSync, statSync } from 'fs'
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
      `Loaded Umi local plugin: ${path.basename(path.dirname(file))}`,
    )
    return mod
  }
  if (loadedMap[file]) {
    // skip
    return
  }
  return
}

export function activate(context: vscode.ExtensionContext) {
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
      const { activate } = mod
      if (activate && typeof activate === 'function') {
        activate(context)
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
}

export function deactivate() {}
