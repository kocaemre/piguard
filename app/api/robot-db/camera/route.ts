import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.146.42.252:8501';

// Define interface for image entries
interface ImageEntry {
  filename: string;
  url: string;
}

export async function GET() {
  try {
    // First try to fetch from the robot API
    const imageListResponse = await fetch(`${API_BASE_URL}/images`, {
      cache: 'no-store',
      next: { revalidate: 10 }, // Revalidate every 10 seconds
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!imageListResponse.ok) {
      throw new Error(`Failed to fetch image list: ${imageListResponse.status}`);
    }
    
    const imageList = await imageListResponse.json() as ImageEntry[];
    
    // Check if we have any images
    if (!imageList || imageList.length === 0) {
      throw new Error('No images available from the API');
    }
    
    // Filter photos that match the format photo_YYYYMMDD_HHMMSS_XXX.jpg
    const photoRegex = /photo_\d{8}_\d{6}_\d{3}\.jpg/;
    const photoImages = imageList.filter((img: ImageEntry) => photoRegex.test(img.filename));
    
    if (photoImages.length === 0) {
      throw new Error('No photo images found with the correct format');
    }
    
    // Sort by timestamp in the filename (descending)
    photoImages.sort((a: ImageEntry, b: ImageEntry) => {
      // Extract the timestamp part from filename
      const getTimestamp = (filename: string) => {
        const match = filename.match(/photo_(\d{8})_(\d{6})_/);
        if (match) {
          const [_, date, time] = match;
          return date + time; // Combine YYYYMMDD and HHMMSS for sorting
        }
        return '';
      };
      
      const timestampA = getTimestamp(a.filename);
      const timestampB = getTimestamp(b.filename);
      
      // Sort in descending order (newest first)
      return timestampB.localeCompare(timestampA);
    });
    
    // Get the latest photo image
    const latestImage = photoImages[0];
    console.log(`Latest photo image: ${latestImage.filename}`);
    
    // Create the full URL to the image
    const fullImageUrl = `${API_BASE_URL}${latestImage.url}`;
    
    // Cache the image information
    try {
      await prisma.imageCache.create({
        data: {
          url: fullImageUrl,
          filename: latestImage.filename,
          timestamp: new Date()
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
    
    // Instead of returning the image data directly, return JSON with image URL
    return NextResponse.json({
      image_url: fullImageUrl,
      filename: latestImage.filename,
      timestamp: new Date().toISOString(),
      isFromCache: false
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
        // Return cached image information
        console.log(`Fallback to cached image: ${cachedData.url}`);
        
        return NextResponse.json({
          image_url: cachedData.url,
          filename: cachedData.filename || 'cached-image.jpg',
          timestamp: cachedData.timestamp.toISOString(),
          isFromCache: true,
          lastUpdated: cachedData.timestamp.toISOString()
        });
      }
      
      // If no cached data, return an error
      return NextResponse.json(
        { 
          error: 'Camera image not available',
          message: 'Could not fetch image from robot and no cached data available',
          status: 503
        },
        { status: 503 }
      );
    } catch (dbError) {
      console.error('Error fetching cached image data:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch camera image', 
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        },
        { status: 500 }
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