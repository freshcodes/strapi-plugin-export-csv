import { useState } from 'react'
import { useNotification, useAuth } from '@strapi/strapi/admin'
import { useIntl } from 'react-intl'
import { exportService, type ExportOptions } from '../services/exportService'
import { getTranslation } from '../utils/getTranslation'

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false)
  const { toggleNotification } = useNotification()
  const { formatMessage } = useIntl()
  const { token } = useAuth('ExportService', (state) => ({ token: state.token }))

  const performExport = async (options: ExportOptions) => {
    try {
      setIsExporting(true)

      if (!token) {
        throw new Error('Authentication token not found')
      }

      await exportService.performExport(options, token)

      const messageKey =
        options.documentIds && options.documentIds.length > 0
          ? 'notification.export.success.selected'
          : 'notification.export.success.filtered'

      const messageValues =
        options.documentIds && options.documentIds.length > 0
          ? { count: options.documentIds.length }
          : {}

      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTranslation(messageKey) }, messageValues),
      })
    } catch (error) {
      console.error('Export error:', error)

      toggleNotification({
        type: 'danger',
        message: formatMessage(
          { id: getTranslation('notification.export.error') },
          { message: (error as Error).message },
        ),
      })
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    performExport,
  }
}
