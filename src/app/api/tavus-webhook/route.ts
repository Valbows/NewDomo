// Backward compatibility route - forwards to new location
import { NextRequest, NextResponse } from 'next/server';
import { handlePOST } from '../tavus/webhook/handler';

// Maintain backward compatibility for existing webhook URLs
export const POST = handlePOST;
 
