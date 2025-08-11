import React from 'react'
import { Button } from '@strapi/design-system'
import { Download } from '@strapi/icons'
import { useIntl } from 'react-intl'
import { useExport } from '../hooks/useExport'
import { getTranslation } from '../utils/getTranslation'

interface ExportButtonProps {
  contentType: string
}

export const ExportButton: React.FC<ExportButtonProps> = ({ contentType }) => {
  const { isExporting, performExport } = useExport()
  const { formatMessage } = useIntl()

  const handleExport = () => {
    performExport({ contentType })
  }

  return (
    <Button
      onClick={handleExport}
      loading={isExporting}
      startIcon={<Download />}
      variant='secondary'
      size='S'
      disabled={isExporting}
    >
      {isExporting
        ? formatMessage({ id: getTranslation('button.exporting') })
        : formatMessage({ id: getTranslation('button.export') })}
    </Button>
  )
}
