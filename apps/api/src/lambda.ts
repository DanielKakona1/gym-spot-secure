import type { FastifyInstance } from 'fastify';
import { buildApp } from './app';

interface LambdaHttpContext {
  http: {
    method: string;
  };
}

interface LambdaHttpEvent {
  rawPath: string;
  rawQueryString?: string;
  headers?: Record<string, string | undefined>;
  body?: string;
  isBase64Encoded?: boolean;
  requestContext: LambdaHttpContext;
}

interface LambdaHttpResponse {
  statusCode: number;
  headers?: Record<string, string | number | string[] | undefined>;
  body: string;
  isBase64Encoded: boolean;
}

let appInstance: FastifyInstance | null = null;

async function getApp(): Promise<FastifyInstance> {
  if (!appInstance) {
    appInstance = await buildApp();
    await appInstance.ready();
  }

  return appInstance;
}

export async function handler(event: LambdaHttpEvent): Promise<LambdaHttpResponse> {
  const app = await getApp();
  const queryString = event.rawQueryString ? `?${event.rawQueryString}` : '';
  const payload = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body
    : undefined;

  const response = await app.inject({
    method: event.requestContext.http.method as never,
    url: `${event.rawPath}${queryString}`,
    headers: event.headers,
    payload,
  });

  return {
    statusCode: response.statusCode,
    headers: response.headers as Record<string, string | number | string[] | undefined>,
    body: response.body,
    isBase64Encoded: false,
  };
}
