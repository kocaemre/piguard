import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.146.42.252:8501';

export async function GET() {
  try {
    // First try to fetch from the robot API
    const imageListResponse = await fetch(`${API_BASE_URL}/images`, {
      cache: 'no-store',
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000) // 5 saniye timeout
    });
    
    if (!imageListResponse.ok) {
      throw new Error(`Failed to fetch image list: ${imageListResponse.status}`);
    }
    
    const imageList = await imageListResponse.json();
    
    // Check if we have any images
    if (!imageList || imageList.length === 0) {
      throw new Error('No images available from the API');
    }
    
    // Get the latest image
    const latestImageUrl = imageList[0].url;
    console.log(`Latest image URL: ${API_BASE_URL}${latestImageUrl}`);
    
    // Son imajı al
    const imageResponse = await fetch(`${API_BASE_URL}${latestImageUrl}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    // Image data'sını doğrudan döndür
    const imageData = await imageResponse.arrayBuffer();
    return new Response(imageData, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('Error fetching camera image from API:', error);
    
    // Try to get the last cached record from the database
    try {
      const cachedData = await prisma.imageCache.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (cachedData) {
        // Fallback: önbellekteki görüntüyü döndürelim
        console.log(`Fallback to cached image: ${cachedData.url}`);
        
        try {
          // Önbellekteki URL'den görüntüyü almaya çalış
          const cachedImageResponse = await fetch(cachedData.url, { 
            cache: 'no-store',
            signal: AbortSignal.timeout(3000)
          });
          
          if (cachedImageResponse.ok) {
            const cachedImageData = await cachedImageResponse.arrayBuffer();
            return new Response(cachedImageData, {
              headers: {
                'Content-Type': 'image/jpeg',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'X-Data-Source': 'cache'
              }
            });
          }
        } catch (fetchError) {
          console.error('Error fetching cached image:', fetchError);
        }
      }
      
      // Fallback olarak statik bir hata görseli döndür
      return NextResponse.json(
        { 
          error: 'Camera image not available',
          message: 'Could not fetch image from robot and no cached data available',
          status: 503
        },
        { 
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    } catch (dbError) {
      console.error('Error fetching cached image data:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch camera image', 
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
  } finally {
    // Revalidate the path
    revalidatePath('/dashboard/camera');
    await prisma.$disconnect();
  }
}

// CORS preflight için OPTIONS metodu
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 