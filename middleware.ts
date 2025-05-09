import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // API rotaları için CORS header'larını ekle
  if (request.nextUrl.pathname.startsWith('/api/robot-db')) {
    // OPTIONS istekleri için response oluştur (CORS preflight)
    if (request.method === 'OPTIONS') {
      return NextResponse.json({}, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Diğer istekler için response'a header'ları ekle
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  return NextResponse.next();
}

// Middlewarenin çalışacağı rotaları belirle
export const config = {
  matcher: '/api/robot-db/:path*',
}; 