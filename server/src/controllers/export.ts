import type { UID } from '@strapi/types'

const exportController = ({ strapi }) => ({
  /**
   * Stream CSV export endpoint
   */
  async streamCsv(ctx) {
    try {
      const { contentType } = ctx.params
      const { filters = {}, sort = {} } = ctx.request.body

      const exportService = strapi.plugin('export-csv').service('export')
      await exportService.streamCsvData(contentType as UID.Schema, { ...filters, sort }, ctx)
    } catch (error) {
      strapi.log.error('CSV export controller error:', error)
      if (!ctx.res.headersSent) {
        return ctx.internalServerError('Export failed')
      }
    }
  },

  /**
   * Bulk export CSV endpoint for selected documents
   */
  async bulkExport(ctx) {
    try {
      const { contentType } = ctx.params
      const { documentIds } = ctx.request.body

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return ctx.badRequest('documentIds array is required and cannot be empty')
      }

      for (const id of documentIds) {
        if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
          return ctx.badRequest(`Invalid documentId: ${id}. Expected string or number.`)
        }
      }

      const exportService = strapi.plugin('export-csv').service('export')
      const filters = { documentId: { $in: documentIds } }

      strapi.log.info(`Bulk export requested for ${contentType} (${documentIds.length} documents)`)
      await exportService.streamCsvData(contentType as UID.Schema, filters, ctx)
    } catch (error) {
      strapi.log.error('Bulk CSV export controller error:', error)
      if (!ctx.res.headersSent) {
        return ctx.internalServerError('Bulk export failed')
      }
    }
  },
})

export default exportController
