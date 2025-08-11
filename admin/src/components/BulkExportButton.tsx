import React from 'react'
import { Download } from '@strapi/icons'
import { useNotification, useAuth } from '@strapi/strapi/admin'
import { useIntl } from 'react-intl'
import type {
  BulkActionComponent,
  BulkActionComponentProps,
  BulkActionDescription,
} from '@strapi/content-manager/strapi-admin'
import { exportService } from '../services/exportService'
import { getTranslation } from '../utils/getTranslation'

export const BulkExportButton: BulkActionComponent = (
  props: BulkActionComponentProps,
): BulkActionDescription => {
  const { documents, model } = props
  const { toggleNotification } = useNotification()
  const { formatMessage } = useIntl()
  const { token } = useAuth('BulkExportButton', (state) => ({ token: state.token }))

  return {
    label: formatMessage({ id: getTranslation('button.bulk-export') }, { count: documents.length }),
    icon: <Download />,
    variant: 'secondary',
    type: 'default',
    disabled: documents.length === 0,
    onClick: async () => {
      try {
        if (!token) {
          throw new Error('Authentication token not found')
        }

        const documentIds = documents.map((doc) => doc.documentId)

        await exportService.performExport(
          {
            contentType: model,
            documentIds,
          },
          token,
        )

        toggleNotification({
          type: 'success',
          message: formatMessage(
            { id: getTranslation('notification.export.success.selected') },
            { count: documentIds.length },
          ),
        })
      } catch (error) {
        console.error('Bulk export error:', error)
        toggleNotification({
          type: 'danger',
          message: formatMessage(
            { id: getTranslation('notification.export.error') },
            { message: (error as Error).message },
          ),
        })
      }
    },
  }
}
