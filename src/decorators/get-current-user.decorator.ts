import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetCurrentUser = createParamDecorator((d: never, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest()
  return request.user
})
