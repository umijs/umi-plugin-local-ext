import { existsSync, statSync } from 'fs'
import path from 'path'
import * as vscode from 'vscode'

function getFileLoader<T>(p: string) {
  let lastUpdateTime = 0
  let prevModule: T
  const fullPath = path.join(__dirname, p)
  const load = () => {
    if (!existsSync(fullPath)) {
      return
    }
    const stats = statSync(fullPath)
    if (stats.mtimeMs > lastUpdateTime) {
      lastUpdateTime = stats.mtimeMs
      // changed
      delete require.cache[fullPath]
      const module = require(fullPath)
      prevModule = module
    }
    return prevModule
  }
  return {
    load,
  }
}

const endsWithLinkReg = /<\s*Link\s+to\s*=\s*("|')/
const linkMatchReg = /<\s*Link\s+to\s*=\s*("|')([^"']*)("|')/g

const routesLoader = getFileLoader<{
  routes: string[]
}>('./routes.js')

function detectLinkToPath() {
  const item = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file', language: 'typescriptreact' },
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
      ) {
        const linePrefix = document
          .lineAt(position)
          .text.slice(0, position.character)
        // TODO: check Link is import from 'umi'
        const isEndsWithLink = endsWithLinkReg.test(linePrefix)
        if (!isEndsWithLink) {
          return undefined
        }

        const routes = routesLoader.load()?.routes || []
        const items = routes.map((route) => {
          return new vscode.CompletionItem(route)
        })

        return items
      },
    },
    '"',
    "'",
  )
  return item
}

function detectLinkToPathDignostic() {
  const dignosticCollection = vscode.languages.createDiagnosticCollection('umi')
  vscode.workspace.onDidChangeTextDocument((event) => {
    const lang = event.document.languageId
    const schema = event.document.uri.scheme
    if (lang !== 'typescriptreact' || schema !== 'file') {
      return
    }
    updateDiagnostics(event.document, dignosticCollection)
  })
  function updateDiagnostics(
    document: vscode.TextDocument,
    collection: vscode.DiagnosticCollection,
  ) {
    const diagnostics: vscode.Diagnostic[] = []
    const text = document.getText()
    // TODO: use ast to parse
    const matched = Array.from(text.matchAll(linkMatchReg))
    if (!matched.length) {
      collection.set(document.uri, [])
      return
    }
    const allowRoutes = routesLoader.load()?.routes || []
    matched.forEach((match) => {
      const toPath = match?.[2]
      if (toPath?.length && !allowRoutes.includes(toPath)) {
        const startIdx = match.index! + match[0].indexOf(toPath)
        const endIdx = startIdx + toPath.length
        const start = document.positionAt(startIdx)
        const end = document.positionAt(endIdx)
        const range = new vscode.Range(start, end)
        const diagnostic = new vscode.Diagnostic(
          range,
          `Invalid path: ${toPath}`,
          vscode.DiagnosticSeverity.Error,
        )
        diagnostics.push(diagnostic)
      }
    })
    collection.set(document.uri, diagnostics)
  }
  return dignosticCollection
}

export function activate(context: vscode.ExtensionContext) {
  // detect `<Link to="" />` add intellisense
  context.subscriptions.push(detectLinkToPath())
  // if using illegal to path, show dignostic error
  context.subscriptions.push(detectLinkToPathDignostic())
}
