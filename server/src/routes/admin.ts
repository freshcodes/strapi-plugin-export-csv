export default [
  {
    method: 'POST',
    path: '/export/:contentType',
    handler: 'export.streamCsv',
    config: {
      auth: {
        strategy: 'admin',
      },
      policies: ['plugin::export-csv.can-export'],
    },
  },
  {
    method: 'POST',
    path: '/bulk/:contentType',
    handler: 'export.bulkExport',
    config: {
      auth: {
        strategy: 'admin',
      },
      policies: ['plugin::export-csv.can-export'],
    },
  },
]
