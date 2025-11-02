import {wrapRouteHandlerWithSentry} from '@/lib/sentry-utils';
import {handlePOST} from './handler';

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/tavus-webhook',
});