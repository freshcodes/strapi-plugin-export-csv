import type { Options as CsvStringifyOptions } from 'csv-stringify'
import type { UID } from '@strapi/types'

/**
 * Field transform function type
 *
 * @param value - The field value from the database (can be any type)
 * @param record - The complete record object
 * @param field - The field name being transformed
 * @returns The transformed value for CSV output (typically string/number/boolean)
 */
export interface FieldTransform {
  (value: any, record?: any, field?: string): any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface HeaderTransform {
  [fieldName: string]: string
}

export interface FieldTransforms {
  [fieldName: string]: FieldTransform
}

export type PopulateConfig = Parameters<typeof strapi.entityService.findMany>[1]['populate']

// Use csv-stringify's Options type directly
export type CsvOptions = CsvStringifyOptions

export interface ContentTypeConfig {
  fieldTransforms?: FieldTransforms
  headerTransforms?: HeaderTransform
  excludedColumns?: string[]
  maxRecords?: number
  batchSize?: number
  populate?: PopulateConfig
  csvOptions?: CsvOptions
  useContentManagerLabels?: boolean
  debug?: boolean
}

export interface ExportCsvConfig {
  // Global settings (unwrapped)
  fieldTransforms?: FieldTransforms
  headerTransforms?: HeaderTransform
  excludedColumns?: string[]
  maxRecords?: number
  batchSize?: number
  populate?: PopulateConfig
  csvOptions?: CsvOptions
  useContentManagerLabels?: boolean
  debug?: boolean

  // Content-type specific overrides
  contentTypes?: {
    [contentType in UID.Schema]?: ContentTypeConfig
  }
}

export interface ResolvedConfig {
  fieldTransforms: FieldTransforms
  headerTransforms: HeaderTransform
  excludedColumns: string[]
  maxRecords: number
  batchSize: number
  populate: PopulateConfig
  csvOptions: CsvOptions
  useContentManagerLabels: boolean
  debug: boolean
  headers: string[] // Final list of headers after exclusions and transforms
}
