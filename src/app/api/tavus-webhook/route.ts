import * as Sentry from '@sentry/nextjs';
import { handlePOST } from './handler';

// Export only the Next.js-compliant POST for routing
export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/tavus-webhook',
});
 
