import type {
  ExportCsvConfig,
  FieldTransforms,
  HeaderTransform,
  PopulateConfig,
  CsvOptions,
} from '../types/config'

// Export the main config type for users
export type PluginConfig = ExportCsvConfig

const defaultCsvOptions: CsvOptions = {
  header: true,
  quoted_string: true,
  escape: '"',
  quote: '"',
  cast: {},
}

const defaultFieldTransforms: FieldTransforms = {
  updatedBy: (value) => value?.username ?? '',
  createdBy: (value) => value?.username ?? '',
}

const defaultHeaderTransforms: HeaderTransform = {}

const defaultConfig: ExportCsvConfig = {
  fieldTransforms: defaultFieldTransforms,
  headerTransforms: defaultHeaderTransforms,
  excludedColumns: ['password', 'resetPasswordToken', 'registrationToken'],
  maxRecords: 10000,
  batchSize: 100,
  populate: '*', // Default to populate all relations
  csvOptions: defaultCsvOptions,
  useContentManagerLabels: true, // Default to using Strapi configured field labels
  debug: false, // Default to no debug logging
  contentTypes: {},
}

function validateCsvOptions(csvOptions: CsvOptions, path: string): void {
  if (typeof csvOptions !== 'object' || csvOptions === null) {
    throw new Error(`${path} must be an object`)
  }

  // Basic type checks for common options
  if (csvOptions.delimiter !== undefined && typeof csvOptions.delimiter !== 'string') {
    throw new Error(`${path}.delimiter must be a string`)
  }

  if (csvOptions.quote !== undefined && typeof csvOptions.quote !== 'string') {
    throw new Error(`${path}.quote must be a string`)
  }

  if (csvOptions.bom !== undefined && typeof csvOptions.bom !== 'boolean') {
    throw new Error(`${path}.bom must be a boolean`)
  }

  if (csvOptions.header !== undefined && typeof csvOptions.header !== 'boolean') {
    throw new Error(`${path}.header must be a boolean`)
  }

  if (csvOptions.cast && typeof csvOptions.cast !== 'object') {
    throw new Error(`${path}.cast must be an object`)
  }

  if (csvOptions.cast) {
    Object.entries(csvOptions.cast).forEach(([type, fn]) => {
      if (typeof fn !== 'function') {
        throw new Error(`${path}.cast.${type} must be a function`)
      }
    })
  }
}

function validatePopulateConfig(populate: PopulateConfig, path: string): void {
  if (typeof populate === 'string') {
    // String populate (like '*') is valid
    return
  }

  if (Array.isArray(populate)) {
    // Array of strings is valid
    populate.forEach((field, index) => {
      if (typeof field !== 'string') {
        throw new Error(`${path}[${index}] must be a string`)
      }
    })
    return
  }

  if (typeof populate === 'object' && populate !== null) {
    // Object populate is valid (complex populate configuration)
    return
  }

  throw new Error(`${path} must be a string ('*'), array of strings, or populate object`)
}

function validator(config: ExportCsvConfig): void {
  // Validate root level config
  if (config.maxRecords && (typeof config.maxRecords !== 'number' || config.maxRecords < 1)) {
    throw new Error('maxRecords must be a positive number')
  }

  if (config.batchSize && (typeof config.batchSize !== 'number' || config.batchSize < 1)) {
    throw new Error('batchSize must be a positive number')
  }

  if (config.excludedColumns && !Array.isArray(config.excludedColumns)) {
    throw new Error('excludedColumns must be an array of strings')
  }

  if (config.fieldTransforms && typeof config.fieldTransforms !== 'object') {
    throw new Error('fieldTransforms must be an object')
  }

  if (config.headerTransforms && typeof config.headerTransforms !== 'object') {
    throw new Error('headerTransforms must be an object')
  }

  if (config.populate) {
    validatePopulateConfig(config.populate, 'populate')
  }

  if (config.csvOptions) {
    validateCsvOptions(config.csvOptions, 'csvOptions')
  }

  if (
    config.useContentManagerLabels !== undefined &&
    typeof config.useContentManagerLabels !== 'boolean'
  ) {
    throw new Error('useContentManagerLabels must be a boolean')
  }

  if (config.debug !== undefined && typeof config.debug !== 'boolean') {
    throw new Error('debug must be a boolean')
  }

  // Validate content-type specific configs
  if (config.contentTypes) {
    if (typeof config.contentTypes !== 'object') {
      throw new Error('contentTypes must be an object')
    }

    Object.entries(config.contentTypes).forEach(([contentType, ctConfig]) => {
      if (
        ctConfig.maxRecords &&
        (typeof ctConfig.maxRecords !== 'number' || ctConfig.maxRecords < 1)
      ) {
        throw new Error(`contentTypes.${contentType}.maxRecords must be a positive number`)
      }

      if (
        ctConfig.batchSize &&
        (typeof ctConfig.batchSize !== 'number' || ctConfig.batchSize < 1)
      ) {
        throw new Error(`contentTypes.${contentType}.batchSize must be a positive number`)
      }

      if (ctConfig.excludedColumns && !Array.isArray(ctConfig.excludedColumns)) {
        throw new Error(`contentTypes.${contentType}.excludedColumns must be an array of strings`)
      }

      if (ctConfig.fieldTransforms && typeof ctConfig.fieldTransforms !== 'object') {
        throw new Error(`contentTypes.${contentType}.fieldTransforms must be an object`)
      }

      if (ctConfig.headerTransforms && typeof ctConfig.headerTransforms !== 'object') {
        throw new Error(`contentTypes.${contentType}.headerTransforms must be an object`)
      }

      if (ctConfig.populate) {
        validatePopulateConfig(ctConfig.populate, `contentTypes.${contentType}.populate`)
      }

      if (ctConfig.csvOptions) {
        validateCsvOptions(ctConfig.csvOptions, `contentTypes.${contentType}.csvOptions`)
      }

      if (
        ctConfig.useContentManagerLabels !== undefined &&
        typeof ctConfig.useContentManagerLabels !== 'boolean'
      ) {
        throw new Error(`contentTypes.${contentType}.useContentManagerLabels must be a boolean`)
      }

      if (ctConfig.debug !== undefined && typeof ctConfig.debug !== 'boolean') {
        throw new Error(`contentTypes.${contentType}.debug must be a boolean`)
      }
    })
  }

  // Validate field transforms are functions
  const allFieldTransforms = {
    ...config.fieldTransforms,
    ...Object.values(config.contentTypes || {}).reduce(
      (acc, ctConfig) => ({
        ...acc,
        ...ctConfig.fieldTransforms,
      }),
      {},
    ),
  }

  Object.entries(allFieldTransforms).forEach(([field, transform]) => {
    if (typeof transform !== 'function') {
      throw new Error(`fieldTransform for ${field} must be a function`)
    }
  })
}

export default {
  default: defaultConfig,
  validator,
}
