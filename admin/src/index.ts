import { PLUGIN_ID } from './pluginId'
import { Initializer } from './components/Initializer'
import { ExportButtonInjection } from './components/ExportButtonInjection'
import { BulkExportButton } from './components/BulkExportButton'
import { StrapiApp } from '@strapi/strapi/admin'

export default {
  register(app: StrapiApp) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    })

    app.getPlugin('content-manager')?.injectComponent('listView', 'actions', {
      name: 'export-csv-button',
      Component: ExportButtonInjection,
    })
  },

  bootstrap(app: StrapiApp) {
    const apis = app.getPlugin('content-manager').apis //as ContentManagerPlugin['config']['apis']
    // @ts-expect-error it seems ContentManagerPlugin type is not properly exported https://github.com/strapi/strapi/issues/24148
    apis.addBulkAction([BulkExportButton])
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`)

          return { data, locale }
        } catch {
          return { data: {}, locale }
        }
      }),
    )
  },
}
