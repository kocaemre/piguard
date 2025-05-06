import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.146.42.252:8500';

interface LogFile {
  filename: string;
  url: string;
}

export async function GET() {
  try {
    // First try to fetch from the robot API
    const apiResponse = await fetch(`${API_BASE_URL}/logs`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`Failed to fetch from API: ${apiResponse.status}`);
    }
    
    const logsList = await apiResponse.json() as LogFile[];
    
    // Check if we have any logs
    if (!logsList || logsList.length === 0) {
      throw new Error('No logs available from the API');
    }
    
    // Save each log file info to our database for caching
    try {
      for (const log of logsList) {
        await prisma.logFileCache.create({
          data: {
            filename: log.filename,
            url: log.url,
            timestamp: new Date(),
          }
        });
      }
      
      // Keep only the latest 10 records
      const allRecords = await prisma.logFileCache.findMany({
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      if (allRecords.length > 30) { // Keep more log references
        const recordsToDelete = allRecords.slice(30);
        for (const record of recordsToDelete) {
          await prisma.logFileCache.delete({
            where: { id: record.id }
          });
        }
      }
    } catch (dbError) {
      console.error('Failed to cache log files data:', dbError);
      // Continue even if caching fails
    }
    
    // Format the response
    const formattedResponse = {
      logs: logsList.map((log: LogFile) => ({
        filename: log.filename,
        url: `${API_BASE_URL}${log.url}`,
        timestamp: new Date().toISOString()
      })),
      isFromCache: false
    };
    
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching logs from API:', error);
    
    // Try to get the last cached records from the database
    try {
      const cachedLogs = await prisma.logFileCache.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        take: 20 // Return up to 20 cached logs
      });
      
      if (cachedLogs && cachedLogs.length > 0) {
        // Format the cached data
        const formattedCachedResponse = {
          logs: cachedLogs.map(log => ({
            filename: log.filename,
            url: log.url,
            timestamp: log.timestamp.toISOString()
          })),
          isFromCache: true,
          lastUpdated: cachedLogs[0].timestamp.toISOString()
        };
        
        // Return cached data with a 200 status but add warning header
        return NextResponse.json(formattedCachedResponse, {
          status: 200,
          headers: {
            'X-Data-Source': 'cache',
            'X-Cache-Date': cachedLogs[0].timestamp.toISOString()
          }
        });
      }
      
      // If no cached data, return a 503 Service Unavailable with a clear message
      return NextResponse.json(
        { 
          error: 'Log files not available and no cached data found',
          message: 'Robot API is unreachable and no cached data is available. Please check your connection.',
          status: 503
        },
        { status: 503 }
      );
    } catch (dbError) {
      console.error('Error fetching cached log files data:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch log files', 
          details: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        },
        { status: 500 }
      );
    }
  } finally {
    // Revalidate the path
    revalidatePath('/dashboard/logs');
    await prisma.$disconnect();
  }
}

// Specific log file endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { logUrl } = body;
    
    if (!logUrl) {
      return NextResponse.json({ error: 'Log URL is required' }, { status: 400 });
    }
    
    // Make sure the URL is from our known API
    let fullUrl = logUrl;
    if (!logUrl.startsWith('http')) {
      fullUrl = `${API_BASE_URL}${logUrl}`;
    }
    
    // Fetch the specific log file
    const logResponse = await fetch(fullUrl, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!logResponse.ok) {
      throw new Error(`Failed to fetch log file: ${logResponse.status}`);
    }
    
    const logContent = await logResponse.json();
    
    return NextResponse.json({ log: logContent });
  } catch (error) {
    console.error('Error fetching specific log file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch log file content', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      },
      { status: 500 }
    );
  }
} 