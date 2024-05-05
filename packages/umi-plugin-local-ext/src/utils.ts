import path from 'path'
import type { IApi } from 'umi'
import fs from 'fs'
import { umiIcon } from './icon'

export function createLocalExtApi(api: IApi) {
  const rootPath = path.dirname(api.pkgPath)
  const vscExtensionPath = path.join(rootPath, '.vscode', 'extensions', 'umi')
  const dynamicPath = path.join(vscExtensionPath, 'dynamic')
  const currenPkgPath = path.join(__dirname, '..', 'package.json')
  const currentPkg = require(currenPkgPath)

  let isExtSourceFileWritten = false
  function writeExtSourceFile(name: string, content: string) {
    if (isExtSourceFileWritten) {
      throw new Error(
        `Location extension source file has been written, only write once. (${name})`,
      )
    }
    const writeDir = path.join(dynamicPath, name)
    if (!fs.existsSync(writeDir)) {
      fs.mkdirSync(writeDir, { recursive: true })
    }
    const writePath = path.join(writeDir, 'index.js')
    isExtSourceFileWritten = true
    fs.writeFileSync(writePath, content, 'utf-8')
  }

  function writeDynamicDataFileToExtDir(
    name: string,
    subPath: string,
    content: string,
  ) {
    const writeDir = path.join(dynamicPath, name)
    const writePath = path.join(writeDir, subPath)
    if (!fs.existsSync(writeDir)) {
      fs.mkdirSync(writeDir, { recursive: true })
    }
    if (fs.existsSync(writePath)) {
      const originContent = fs.readFileSync(writePath, 'utf-8')
      if (originContent === content) {
        // skip
        return
      }
    }
    fs.writeFileSync(writePath, content, 'utf-8')
  }

  async function init() {
    // create .vscode/extensions/umi
    if (!fs.existsSync(vscExtensionPath)) {
      fs.mkdirSync(vscExtensionPath, { recursive: true })
    }
    // mkdir dynamic
    if (!fs.existsSync(dynamicPath)) {
      fs.mkdirSync(dynamicPath, { recursive: true })
    }
    // create package.json
    const pkg: Record<string, any> = {
      name: 'umi-local-ext',
      displayName: 'Umi Local Extension',
      description: 'Local development extension for Umi projects',
      publisher: 'umijs',
      icon: 'icon.png',
      version: currentPkg.version,
      engines: {
        vscode: '^1.89.0',
      },
      categories: ['Other'],
      activationEvents: [
        // ts
        'onLanguage:typescript',
        // tsx
        'onLanguage:typescriptreact',
      ],
      main: './out/extension.js',
      contributes: {},
    }
    const pkgPath = path.join(vscExtensionPath, 'package.json')
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8')
    // write icon
    const iconPath = path.join(vscExtensionPath, 'icon.png')
    const umiIconBase64 = umiIcon.replace(/^data:image\/\w+;base64,/, '')
    fs.writeFileSync(iconPath, umiIconBase64, 'base64')
    // write extension.js
    const outDir = path.join(vscExtensionPath, 'out')
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }
    const extensionJsPath = path.join(outDir, 'extension.js')
    const originPath = path.join(__dirname, './out/extension.js')
    const originExtContent = fs.readFileSync(originPath, 'utf-8')
    // import vars
    const importDeps: Record<string, string> = {
      lodash: path.dirname(require.resolve('lodash/package.json')),
      chokidar: path.dirname(require.resolve('chokidar/package.json')),
    }
    let newExtContent = originExtContent
    Object.entries(importDeps).forEach(([name, depPath]) => {
      const matchReg = new RegExp(`require\\("${name}"\\)`, 'g')
      newExtContent = newExtContent.replace(matchReg, `require("${depPath}")`)
    })
    fs.writeFileSync(extensionJsPath, newExtContent, 'utf-8')
    // update git ignore file
    const ignorePath = path.join(vscExtensionPath, '.gitignore')
    const ignoreContent = `*`
    fs.writeFileSync(ignorePath, ignoreContent, 'utf-8')
  }

  return {
    writeDynamicDataFileToExtDir,
    writeExtSourceFile,
    init,
  }
}
