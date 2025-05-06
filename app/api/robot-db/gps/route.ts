import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.146.42.252:8500';

// Fixed Istanbul coordinates for fallback
const BASE_LAT = 41.015137;
const BASE_LNG = 28.979530;

export async function GET() {
  try {
    // First try to fetch from the robot API
    const apiResponse = await fetch(`${API_BASE_URL}/gps`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`Failed to fetch from API: ${apiResponse.status}`);
    }
    
    const gpsData = await apiResponse.json();
    
    // Check if we have any GPS data
    if (!gpsData || gpsData.length === 0) {
      throw new Error('No GPS data available from the API');
    }
    
    // Validate GPS data to ensure it has valid coordinates
    const validatedGpsData = gpsData.filter(point => 
      point && point.latitude && point.longitude && 
      !isNaN(point.latitude) && !isNaN(point.longitude)
    );
    
    if (validatedGpsData.length === 0) {
      throw new Error('No valid GPS coordinates in the data');
    }
    
    return NextResponse.json(validatedGpsData);
  } catch (error) {
    console.error('Error fetching GPS data:', error);
    
    // Generate mock GPS data as fallback
    const fallbackGpsData = generateGpsPath(20);
    
    return NextResponse.json(
      fallbackGpsData,
      { 
        status: 200,
        headers: {
          'X-Data-Source': 'fallback',
          'X-Error': error instanceof Error ? error.message : 'Unknown error'
        }
      }
    );
  } finally {
    revalidatePath('/dashboard');
    await prisma.$disconnect();
  }
}

// Generate realistic movement path with smooth curves
function generateGpsPath(count) {
  // First data point at base coordinates
  const data = [];
  
  // Create an initial path pattern that looks like a robot exploration
  let currentLat = BASE_LAT;
  let currentLng = BASE_LNG;
  
  // Direction changes to create a more realistic path
  const movementPatterns = [
    { lat: 0.0002, lng: 0.0001 },   // Northeast
    { lat: 0.0001, lng: 0.0003 },   // East
    { lat: -0.0001, lng: 0.0002 },  // Southeast
    { lat: -0.0002, lng: 0 },       // South
    { lat: -0.0001, lng: -0.0002 }, // Southwest
    { lat: 0.0001, lng: -0.0002 },  // West
    { lat: 0.0003, lng: 0 },        // North
  ];
  
  // Generate the path
  for (let i = 0; i < count; i++) {
    // Gradually change direction to create a smooth path
    const pattern = movementPatterns[Math.floor(i / 3) % movementPatterns.length];
    const randomFactor = 0.6 + Math.random() * 0.8; // Randomize the movement a bit
    
    currentLat += pattern.lat * randomFactor;
    currentLng += pattern.lng * randomFactor;
    
    // Add some very small random noise for naturalness
    currentLat += (Math.random() - 0.5) * 0.00005;
    currentLng += (Math.random() - 0.5) * 0.00005;
    
    // Calculate time for this point (going backwards from now)
    const time = new Date(Date.now() - (count - i) * 15000);
    
    data.push({
      latitude: currentLat,
      longitude: currentLng,
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      altitude: 100 + Math.sin(i / 5) * 5 + Math.random() * 2,
      satellites: Math.floor(Math.random() * 3) + 6,
      signalStrength: 75 + Math.sin(i / 10) * 10 + Math.random() * 5,
    });
  }
  
  return data;
} 