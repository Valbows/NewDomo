import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { handlePOST } from './handler';

// Export the Next.js-compliant POST route using our conditional Sentry wrapper
export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/tavus-webhook',
});
 
