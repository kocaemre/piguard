import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.146.42.252:8500';

export async function GET() {
  try {
    // First try to fetch from the robot API
    const apiResponse = await fetch(`${API_BASE_URL}/images`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`Failed to fetch from API: ${apiResponse.status}`);
    }
    
    const imagesList = await apiResponse.json();
    
    // Check if we have any images
    if (!imagesList || imagesList.length === 0) {
      throw new Error('No images available from the API');
    }
    
    // Get the latest image
    const latestImage = imagesList[0];
    const imageUrl = `${API_BASE_URL}${latestImage.url}`;
    
    // Save the fetched data to our database for caching
    try {
      await prisma.imageCache.create({
        data: {
          filename: latestImage.filename,
          url: imageUrl,
          timestamp: new Date(),
        }
      });
      
      // Keep only the latest 10 records
      const allRecords = await prisma.imageCache.findMany({
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (allRecords.length > 10) {
        const recordsToDelete = allRecords.slice(10);
        for (const record of recordsToDelete) {
          await prisma.imageCache.delete({
            where: { id: record.id }
          });
        }
      }
    } catch (dbError) {
      console.error('Failed to cache image data:', dbError);
      // Continue even if caching fails
    }
    
    // Format the response to match our frontend expectations
    const formattedResponse = {
      image_url: imageUrl,
      filename: latestImage.filename,
      timestamp: new Date().toISOString(),
      isFromCache: false
    };
    
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching camera image from API:', error);
    
    // Try to get the last cached record from the database
    try {
      const cachedImage = await prisma.imageCache.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (cachedImage) {
        // Format the cached data
        const formattedCachedResponse = {
          image_url: cachedImage.url,
          filename: cachedImage.filename,
          timestamp: cachedImage.timestamp.toISOString(),
          isFromCache: true,
          lastUpdated: cachedImage.timestamp.toISOString()
        };
        
        // Return cached data with a 200 status but add warning header
        return NextResponse.json(formattedCachedResponse, {
          status: 200,
          headers: {
            'X-Data-Source': 'cache',
            'X-Cache-Date': cachedImage.timestamp.toISOString()
          }
        });
      }
      
      // If no cached data, return a 503 Service Unavailable with a fallback image
      return NextResponse.json(
        { 
          image_url: '/placeholder-camera.jpg',
          filename: 'placeholder.jpg',
          timestamp: new Date().toISOString(),
          error: 'Camera image not available and no cached image found',
          status: 503
        },
        { status: 200 } // Still return 200 with the placeholder
      );
    } catch (dbError) {
      console.error('Error fetching cached image data:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch camera image', 
          details: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
          image_url: '/placeholder-camera.jpg' // Fallback image
        },
        { status: 200 } // Still return 200 with the placeholder
      );
    }
  } finally {
    // Revalidate the path
    revalidatePath('/dashboard/camera');
    await prisma.$disconnect();
  }
} 