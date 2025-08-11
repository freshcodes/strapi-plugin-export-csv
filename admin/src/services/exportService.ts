import axios from 'axios'
import qs from 'qs'

export interface ExportOptions {
  contentType: string
  filters?: Record<string, unknown>
  sort?: Record<string, unknown>
  search?: string
  documentIds?: string[] // For bulk export
}

export class ExportService {
  private getCurrentFilters() {
    try {
      const parsed = qs.parse(window.location.search, { ignoreQueryPrefix: true })

      return {
        filters: parsed.filters || {},
        sort: parsed.sort || {},
        search: parsed.search || '',
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(
        `Failed to parse current filters: ${errorMessage}. Please try again or contact support.`,
      )
    }
  }

  private generateFilename(contentType: string, isSelected: boolean = false): string {
    const timestamp = new Date().toISOString().slice(0, 10)
    const prefix = isSelected ? 'selected-' : ''
    return `${prefix}${contentType.replace('api::', '').replace('.', '-')}-export-${timestamp}.csv`
  }

  private downloadBlob(blob: Blob, contentType: string, isSelected: boolean = false): void {
    if (!blob || blob.size === 0) {
      throw new Error('No data received or empty file')
    }

    const url = window.URL.createObjectURL(blob)
    const filename = this.generateFilename(contentType, isSelected)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  async performExport(options: ExportOptions, token: string): Promise<void> {
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const isSelected = options.documentIds && options.documentIds.length > 0
    const endpoint = isSelected
      ? `/export-csv/bulk/${options.contentType}`
      : `/export-csv/export/${options.contentType}`

    const payload = isSelected
      ? { documentIds: options.documentIds }
      : {
          filters: options.filters || this.getCurrentFilters().filters,
          sort: options.sort || this.getCurrentFilters().sort,
          search: options.search || this.getCurrentFilters().search,
        }

    const response = await axios.post(endpoint, payload, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    this.downloadBlob(response.data, options.contentType, isSelected)
  }
}

// Singleton instance
export const exportService = new ExportService()
