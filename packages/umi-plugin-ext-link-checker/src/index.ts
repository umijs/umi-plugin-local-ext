import { readFileSync } from 'fs'
import { isEqual, trim, uniq } from 'lodash'
import { join } from 'path'
import type { IApi } from 'umi'
import { createLocalExtApi } from 'umi-plugin-local-ext'

export default async function (api: IApi) {
  api.describe({
    key: 'linkChecker',
    config: {
      schema({ zod }) {
        return zod.record(zod.string())
      },
    },
  })

  const extName = 'linkChecker'

  const localExt = createLocalExtApi(api)
  await localExt.init({
    activationEvents: [
      'onLanguage:typescriptreact',
      'onLanguage:javascriptreact',
    ],
  })

  // write dynamic/routes.js
  let prevRoutes: any
  api.onGenerateFiles(() => {
    const routes = api.appData.routes
    if (isEqual(prevRoutes, routes)) {
      return
    } else {
      prevRoutes = routes
    }
    const paths = Object.values(routes).map((route: any) => {
      const currentPath = route.path
      const totalPath = [currentPath]
      let parentId = route.parentId
      if (parentId?.length) {
        while (parentId) {
          const parentRoute = routes[parentId]
          totalPath.unshift(parentRoute.path)
          parentId = parentRoute.parentId
        }
      }
      const path = totalPath
        .map((p: string) => {
          p = trim(p, '/')
          return p
        })
        .join('/')
      return path
    })
    const handlePaths = paths.filter(Boolean).map((path) => {
      path = trim(path, '/')
      path = `/${path}`
      return path
    })
    const uniqPaths = uniq(handlePaths)
    uniqPaths.sort((a, b) => {
      return a.localeCompare(b)
    })
    const linkContent = `
module.exports = {
  routes: ${JSON.stringify(uniqPaths, null, 2)}
}    
    `
    // write
    localExt.writeDynamicDataFileToExtDir(extName, 'routes.js', linkContent)
  })

  // write ext source
  const extSourcePath = join(__dirname, './extension.js')
  const extSourceContent = readFileSync(extSourcePath, 'utf-8')
  localExt.writeExtSourceFile(extName, extSourceContent)
}
