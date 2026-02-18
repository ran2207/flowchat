import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserPayload {
  userId: string
  tenantId: string
  role: string
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext): CurrentUserPayload | string => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as CurrentUserPayload

    return data ? user[data] : user
  },
)
