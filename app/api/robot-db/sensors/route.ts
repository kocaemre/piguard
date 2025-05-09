import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const API_BASE_URL = 'http://10.146.42.252:8501';

// Define interface for log file entries
interface LogFile {
  filename: string;
  url: string;
}

export async function GET() {
  try {
    // First fetch the list of available log files
    const logsResponse = await fetch(`${API_BASE_URL}/logs`, {
      cache: 'no-store',
      next: { revalidate: 20 }
    });
    
    if (!logsResponse.ok) {
      throw new Error(`Failed to fetch logs list: ${logsResponse.status}`);
    }
    
    const logs = await logsResponse.json() as LogFile[];
    
    // Filter Arduino logs and find the most recent one
    const arduinoLogs = logs.filter((log: LogFile) => 
      log.filename.startsWith('Arduino_') && log.filename.endsWith('.json')
    );
    
    if (arduinoLogs.length === 0) {
      throw new Error('No Arduino logs found');
    }
    
    // Sort by filename in descending order (newest first)
    arduinoLogs.sort((a: LogFile, b: LogFile) => b.filename.localeCompare(a.filename));
    
    // Get the most recent log file
    const latestLog = arduinoLogs[0];
    
    // Fetch the actual log data
    const apiResponse = await fetch(`${API_BASE_URL}${latestLog.url}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`Failed to fetch log data: ${apiResponse.status}`);
    }
    
    const arduinoData = await apiResponse.json();
    
    // Save the fetched data to our database for caching
    try {
      await prisma.arduinoLogCache.create({
        data: {
          gyroX: arduinoData.Gyro.X,
          gyroY: arduinoData.Gyro.Y,
          gyroZ: arduinoData.Gyro.Z,
          servoNeck: arduinoData.ServoAngles.Neck,
          servoHead: arduinoData.ServoAngles.Head,
          distFront: arduinoData.Distances.Front,
          distLeft: arduinoData.Distances.Left,
          distRight: arduinoData.Distances.Right,
          motorState: arduinoData.MotorState,
          timestamp: new Date(arduinoData.Timestamp),
        }
      });
      
      // Keep only the latest 10 records
      const allRecords = await prisma.arduinoLogCache.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (allRecords.length > 10) {
        const recordsToDelete = allRecords.slice(10);
        for (const record of recordsToDelete) {
          await prisma.arduinoLogCache.delete({
            where: { id: record.id }
          });
        }
      }
    } catch (dbError) {
      console.error('Failed to cache Arduino data:', dbError);
      // Continue even if caching fails
    }
    
    // Format the response to match our frontend expectations
    const formattedResponse = {
      gyro: {
        x: arduinoData.Gyro.X,
        y: arduinoData.Gyro.Y,
        z: arduinoData.Gyro.Z
      },
      servo: {
        neck: arduinoData.ServoAngles.Neck,
        head: arduinoData.ServoAngles.Head
      },
      distances: {
        front: arduinoData.Distances.Front,
        left: arduinoData.Distances.Left,
        right: arduinoData.Distances.Right
      },
      motorState: arduinoData.MotorState,
      timestamp: arduinoData.Timestamp,
      isFromCache: false
    };
    
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching Arduino data from API:', error);
    
    // Try to get the last cached record from the database
    try {
      const cachedData = await prisma.arduinoLogCache.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (cachedData) {
        // Format the cached data
        const formattedCachedResponse = {
          gyro: {
            x: cachedData.gyroX,
            y: cachedData.gyroY,
            z: cachedData.gyroZ
          },
          servo: {
            neck: cachedData.servoNeck,
            head: cachedData.servoHead
          },
          distances: {
            front: cachedData.distFront,
            left: cachedData.distLeft,
            right: cachedData.distRight
          },
          motorState: cachedData.motorState,
          timestamp: cachedData.timestamp.toISOString(),
          isFromCache: true,
          lastUpdated: cachedData.createdAt.toISOString()
        };
        
        // Return cached data with a 200 status but add warning header
        return NextResponse.json(formattedCachedResponse, {
          status: 200,
          headers: {
            'X-Data-Source': 'cache',
            'X-Cache-Date': cachedData.createdAt.toISOString()
          }
        });
      }
      
      // If no cached data, return a 503 Service Unavailable
      return NextResponse.json(
        { 
          error: 'Arduino data not available and no cached data found',
          status: 503
        },
        { status: 503 }
      );
    } catch (dbError) {
      console.error('Error fetching cached Arduino data:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch Arduino data', 
          details: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        },
        { status: 500 }
      );
    }
  } finally {
    // Revalidate the path
    revalidatePath('/dashboard/sensors');
    await prisma.$disconnect();
  }
} 