/**
 * Category Export Excel API Route
 */

import { NextRequest } from 'next/server';
import { proxyCategoryExcelExport } from '@/lib/api/categoryEncryptedProxy';

export async function GET(request: NextRequest) {
  return proxyCategoryExcelExport(request);
}
