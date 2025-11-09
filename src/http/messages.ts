export const HttpMessage = {
  ENDPOINT_NOT_FOUND: 'Endpoint not found',
  RESOURCE_NOT_FOUND: 'Requested resource was not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;

export type HttpMessageValue = (typeof HttpMessage)[keyof typeof HttpMessage];
