import type { ExportCsvConfig, ResolvedConfig } from '../types/config'
import type { Core } from '@strapi/strapi'
import type { Metadatas } from '@strapi/content-manager/dist/shared/contracts/content-types'
import type { UID } from '@strapi/types'

const configService = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get the resolved configuration for a specific content type
   */
  getResolvedConfig(contentType: UID.Schema): ResolvedConfig {
    const pluginConfig = this.getPluginConfig()
    const model = strapi.getModel(contentType)

    if (!model) {
      throw new Error(`Content type ${contentType} not found`)
    }

    // Start with default configuration
    const defaults = this.getDefaults()

    // Get content-type specific configuration
    const contentTypeConfig = pluginConfig.contentTypes?.[contentType] || {}

    const mergedConfig = {
      fieldTransforms: {
        ...defaults.fieldTransforms,
        ...pluginConfig.fieldTransforms,
        ...contentTypeConfig.fieldTransforms,
      },
      headerTransforms: {
        ...defaults.headerTransforms,
        ...pluginConfig.headerTransforms,
        ...contentTypeConfig.headerTransforms,
      },
      excludedColumns:
        contentTypeConfig.excludedColumns ||
        pluginConfig.excludedColumns ||
        defaults.excludedColumns,
      maxRecords: contentTypeConfig.maxRecords || pluginConfig.maxRecords || defaults.maxRecords,
      batchSize: contentTypeConfig.batchSize || pluginConfig.batchSize || defaults.batchSize,
      populate: contentTypeConfig.populate || pluginConfig.populate || defaults.populate,
      csvOptions: {
        ...defaults.csvOptions,
        ...pluginConfig.csvOptions,
        ...contentTypeConfig.csvOptions,
      },
      useContentManagerLabels:
        contentTypeConfig.useContentManagerLabels !== undefined
          ? contentTypeConfig.useContentManagerLabels
          : pluginConfig.useContentManagerLabels !== undefined
            ? pluginConfig.useContentManagerLabels
            : defaults.useContentManagerLabels,
      debug:
        contentTypeConfig.debug !== undefined
          ? contentTypeConfig.debug
          : pluginConfig.debug !== undefined
            ? pluginConfig.debug
            : defaults.debug,
      headers: [],
    }

    const allHeaders = Object.keys(model.attributes)
    const filteredHeaders = allHeaders.filter(
      (header) => !mergedConfig.excludedColumns.includes(header),
    )

    mergedConfig.headers = filteredHeaders

    return mergedConfig
  },

  /**
   * Get the plugin configuration from Strapi config
   */
  getPluginConfig(): ExportCsvConfig {
    return strapi.config.get('plugin::export-csv', {})
  },

  getDefaults(): ResolvedConfig {
    const pluginDefaults = this.getPluginConfig()

    return {
      fieldTransforms: pluginDefaults.fieldTransforms || {},
      headerTransforms: pluginDefaults.headerTransforms || {},
      excludedColumns: pluginDefaults.excludedColumns || [],
      maxRecords: pluginDefaults.maxRecords || 10000,
      batchSize: pluginDefaults.batchSize || 100,
      populate: pluginDefaults.populate || '*',
      csvOptions: pluginDefaults.csvOptions || {},
      useContentManagerLabels:
        pluginDefaults.useContentManagerLabels !== undefined
          ? pluginDefaults.useContentManagerLabels
          : true,
      debug: pluginDefaults.debug !== undefined ? pluginDefaults.debug : false,
      headers: [],
    }
  },

  async getFieldLabels(contentType: string): Promise<Record<string, string>> {
    try {
      const contentTypeService = strapi.plugin('content-manager').service('content-types')
      const configuration = await contentTypeService.findConfiguration({ uid: contentType })

      const fieldLabels: Record<string, string> = {}

      if (configuration?.metadatas) {
        Object.entries(configuration.metadatas).forEach(
          ([fieldName, metadata]: [string, Metadatas[string]]) => {
            fieldLabels[fieldName] = metadata?.edit?.label || metadata?.list?.label || undefined
          },
        )
      }

      return fieldLabels
    } catch (error) {
      strapi.log.warn(`Could not get field labels for ${contentType}: ${error.message}`)
      return {}
    }
  },

  async getTransformedHeaders(contentType: string, config: ResolvedConfig): Promise<string[]> {
    let headerTransforms = config.headerTransforms

    if (config.useContentManagerLabels) {
      const fieldLabels = await this.getFieldLabels(contentType)
      headerTransforms = {
        ...fieldLabels,
        ...headerTransforms,
      }
    }

    return config.headers.map((header) => headerTransforms[header] || header)
  },
})

export default configService
