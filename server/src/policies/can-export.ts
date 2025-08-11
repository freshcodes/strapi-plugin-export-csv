import { type Core } from '@strapi/strapi'

/**
 * Policy to check if user can export a specific content type
 */
export default async (
  policyContext: unknown,
  _config: unknown,
  { strapi }: { strapi: Core.Strapi },
): Promise<boolean> => {
  // @ts-expect-error - policyContext is a wrapper around controller context with params/state
  const { contentType } = policyContext.params
  // @ts-expect-error - policyContext.state contains the authenticated user
  const { user } = policyContext.state

  if (!user || !contentType) {
    return false
  }

  try {
    const permissionService = strapi.service('admin::permission')
    const userAbility = await permissionService.engine.generateUserAbility(user)
    const canRead = userAbility.can('plugin::content-manager.explorer.read', contentType)

    return canRead
  } catch (error) {
    strapi.log.error('Permission check failed:', error)
    return false
  }
}
