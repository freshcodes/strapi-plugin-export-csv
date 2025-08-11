import { Readable } from 'stream'
import { stringify } from 'csv-stringify'
import type { Context } from 'koa'
import type { Params } from '@strapi/database/dist/entity-manager/types'
import type { UID } from '@strapi/types'
import type { ResolvedConfig } from '../types/config'

const exportService = ({ strapi }) => ({
  /**
   * Create a streaming CSV response for a content type
   */
  async streamCsvData(contentType: UID.Schema, filters: Params['filters'], ctx: Context) {
    try {
      const model = strapi.getModel(contentType)
      if (!model) {
        throw new Error('Content type not found')
      }

      const configService = strapi.plugin('export-csv').service('config')
      const config = configService.getResolvedConfig(contentType)

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const filename = `${contentType.replace('api::', '').replace('.', '-')}_${timestamp}.csv`

      ctx.set('Content-Type', 'text/csv; charset=utf-8')
      ctx.set('Content-Disposition', `attachment; filename="${filename}"`)
      ctx.set('Cache-Control', 'no-cache')
      ctx.set('Transfer-Encoding', 'chunked')

      const transformedHeaders = await configService.getTransformedHeaders(contentType, config)
      const dataStream = Readable.from(this.generateCsvData(contentType, filters, config))
      const csvStringifier = stringify({
        ...config.csvOptions,
        columns: transformedHeaders,
      })

      ctx.body = dataStream.pipe(csvStringifier)
    } catch (error) {
      strapi.log.error('CSV export service error:', error)
      throw error
    }
  },

  /**
   * Generate CSV data using async generator for memory efficiency
   */
  async *generateCsvData(
    contentType: UID.Schema,
    rawFilters: Params['filters'],
    config: ResolvedConfig,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pagination, page, pageSize, start, limit, offset, sort, ...filters } =
        rawFilters || {}
      const { batchSize, maxRecords, headers, debug } = config
      let batchStart = 0
      let totalProcessed = 0

      if (debug) {
        strapi.log.debug(`[CSV Export Debug] Starting export for ${contentType}`)
        strapi.log.debug(
          `[CSV Export Debug] Config: ${JSON.stringify({ batchSize, maxRecords, headers }, null, 2)}`,
        )
        strapi.log.debug(`[CSV Export Debug] Filters: ${JSON.stringify(filters, null, 2)}`)
        strapi.log.debug(`[CSV Export Debug] Sort: ${JSON.stringify(sort, null, 2)}`)
      }

      while (totalProcessed < maxRecords) {
        const response = await strapi.documents(contentType).findMany({
          filters,
          sort: sort || { id: 'asc' },
          start: batchStart,
          limit: batchSize,
          status: 'draft',
          populate: config.populate,
        })

        const records = Array.isArray(response) ? response : response?.data || []
        if (!records.length) {
          break
        }

        if (debug) {
          strapi.log.debug(
            `[CSV Export Debug] Processing batch ${batchStart}-${batchStart + records.length - 1} (${records.length} records)`,
          )
        }

        for (const record of records) {
          if (config.debug) {
            strapi.log.debug(
              `[CSV Export Debug] Processing record: ${JSON.stringify(record, null, 2)}`,
            )
          }

          const row = headers.map((field) => {
            let value = record[field]

            if (config.debug) {
              strapi.log.debug(
                `[CSV Export Debug] Field "${field}" original value: ${JSON.stringify(value)} (${typeof value})`,
              )
            }

            const transformer = config.fieldTransforms[field]
            if (transformer && typeof transformer === 'function') {
              try {
                value = transformer(value, record, field)
                if (config.debug) {
                  strapi.log.debug(
                    `[CSV Export Debug] Field "${field}" after transform: ${JSON.stringify(value)} (${typeof value})`,
                  )
                }
              } catch (error) {
                strapi.log.error(`Field transform error for ${field}:`, error)
              }
            }

            return value
          })

          yield row
          totalProcessed++

          if (totalProcessed >= maxRecords) {
            if (config.debug) {
              strapi.log.debug(`[CSV Export Debug] Export limited to ${maxRecords} records`)
            }
            yield [
              'INFO',
              `Export limited to ${maxRecords} records`,
              'Apply filters for complete export',
            ]
            break
          }
        }

        batchStart += batchSize
      }

      if (totalProcessed === 0) {
        yield new Array(headers.length).fill('')
      }
    } catch (error) {
      strapi.log.error('CSV data generation error:', error)
      yield ['ERROR', error.message, 'Contact support if this persists']
    }
  },
})

export default exportService
