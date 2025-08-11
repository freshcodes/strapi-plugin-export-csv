import React from 'react'
import { ExportButton } from './ExportButton'

export const ExportButtonInjection: React.FC = () => {
  const contentType =
    window.location.pathname.match(/\/content-manager\/collection-types\/([^/]+)/)?.[1] ||
    window.location.pathname.match(/\/content-manager\/single-types\/([^/]+)/)?.[1]

  if (!contentType) return null

  return <ExportButton contentType={contentType} />
}
