import contentAPIRoutes from './content-api'
import adminRoutes from './admin'

export default {
  'content-api': {
    type: 'content-api',
    routes: contentAPIRoutes,
  },
  'admin': {
    type: 'admin',
    routes: adminRoutes,
  },
}
