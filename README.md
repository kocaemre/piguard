# PiGuard - Raspberry Pi Based Security System

PiGuard is a comprehensive security monitoring and management system that integrates with Raspberry Pi devices to provide real-time surveillance, sensor monitoring, and remote control capabilities. Built with Next.js, TypeScript, and modern web technologies, PiGuard offers a robust, user-friendly interface for managing your security infrastructure.

## Features

- **Real-time Camera Surveillance**: Access live video feeds from connected cameras
- **Sensor Monitoring**: Track environment data like temperature, humidity, and motion detection
- **Interactive Dashboard**: View system status, alerts, and sensor readings in a clean interface
- **User Management**: Role-based access control with ADMIN and APPROVED user permissions
- **Geolocation Tracking**: Monitor security device locations on an interactive map
- **Command Interface**: Send direct commands to connected Raspberry Pi devices
- **System Logs**: Comprehensive logging for all system events and activities
- **Remote Configuration**: Configure Raspberry Pi settings remotely through the web interface
- **Demo Mode**: Test functionality without actual hardware for development and demonstration
- **Offline Capability**: Automatic caching of data with fallback to cached values when robot connection is lost

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: PostgreSQL with Prisma ORM
- **Monitoring**: Sentry for error tracking and performance monitoring
- **Maps**: Leaflet for interactive mapping capabilities
- **Real-time Communication**: Socket.io for live data updates
- **Data Caching**: Prisma ORM for local caching of robot data

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- PostgreSQL database
- npm or yarn package manager
- Raspberry Pi (for production deployment)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/piguard.git
cd piguard
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables by creating a `.env` file in the root directory:

```
DATABASE_URL="postgresql://username:password@localhost:5432/piguard"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

4. Set up the database:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Admin Setup

On first run, you'll need to create an admin user:

1. Register a new user at `/auth/register`
2. Manually update the user role to "ADMIN" in the database or use the Prisma Studio:

```bash
npx prisma studio
```

## Deployment

### Vercel Deployment

To deploy PiGuard on Vercel:

1. Connect your repository to Vercel
2. Add the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: A secure secret for NextAuth
   - `NEXTAUTH_URL`: Your application URL on Vercel

#### Troubleshooting Prisma on Vercel

If you encounter the following error:
```
Error [PrismaClientInitializationError]: Prisma has detected that this project was built on Vercel, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered.
```

The project is already configured to handle this issue with the following settings in package.json:
```json
"build": "prisma generate && next build",
"postinstall": "prisma generate"
```

These settings ensure that Prisma Client is properly generated during the build process on Vercel.

### Raspberry Pi Setup

For deploying the companion app on Raspberry Pi:

1. Install required dependencies on your Raspberry Pi
2. Configure the Pi's IP address and port in the dashboard settings
3. Set up the appropriate sensors and cameras on your Raspberry Pi
4. Start the companion service on the Raspberry Pi

### Production Deployment

To deploy PiGuard to a production environment:

```bash
npm run build
npm run start
```

For continuous deployment, consider using a platform like Vercel or containerizing the application with Docker.

## Usage

### Dashboard

The dashboard provides a comprehensive overview of your security system, including:

- Status indicators for all connected devices
- Latest sensor readings
- Interactive map showing device locations
- Recent activity logs

### Camera Monitoring

Access live and recorded footage from the Camera section. Features include:

- Multiple camera view support
- Motion detection alerts
- Video recording and playback

### Sensor Data

Monitor environmental conditions and sensor readings:

- Temperature and humidity trends
- Motion detection events
- Distance sensors and other connected devices

### User Management

Administrators can manage users through the settings panel:

- Add new administrators
- Approve pending user registrations
- Revoke access when needed

## API Integration Guide

PiGuard integrates with the robot's API to fetch real-time data. Here's how the integration works:

### API Endpoint Structure

All API requests are made to the Raspberry Pi server running at a configurable URL (default: `http://10.146.42.252:8500`). The following endpoints are used:

1. **GET /logs** - Retrieves a list of all log files
   - Returns an array of log file information including filename and URL

2. **GET /log/Arduino_*.json** - Fetches Arduino sensor data
   - Contains Gyro data (X, Y, Z axes)
   - Servo angles (Neck, Head)
   - Distance measurements (Front, Left, Right)
   - Motor state
   - Timestamp

3. **GET /log/Pi5_Latest.json** - Retrieves Raspberry Pi system information
   - CPU and GPU temperatures
   - CPU usage percentage
   - RAM usage
   - Network traffic (Upload/Download)
   - Timestamp

4. **GET /images** - Gets a list of available camera images
   - Returns array of image objects with filename and URL
   
### Offline Mode & Data Caching

PiGuard implements an intelligent caching system to ensure continuous operation even when the robot connection is lost:

1. **Automatic Caching**:
   - Every successful API response is stored in the local database
   - The system maintains the last 10 records of each data type
   - Each record contains a timestamp for tracking freshness

2. **Fallback Mechanism**:
   - When the API is unreachable, the system automatically retrieves the latest cached data
   - A visual indicator shows when viewing cached data, including the last update time
   - You can manually refresh to attempt reconnection

3. **Cache Management**:
   - Old cache entries are automatically pruned to prevent database bloat
   - The cache is refreshed with each successful API connection

### Data Flow

The data flow from the robot to the user interface follows this path:

1. API endpoint requests data from the robot
2. Data is validated and transformed into the required format
3. A copy is stored in the cache database
4. The formatted data is sent to the frontend
5. The UI components render the data with appropriate visualizations
6. If connection fails, cached data is retrieved and displayed with an offline indicator

### Security Considerations

- All API requests are made server-side to prevent exposing the robot's API directly to clients
- Authentication is required to access any sensor or camera data
- Error handling prevents exposure of sensitive information in case of API failures

## Troubleshooting API Connections

If you're experiencing issues with the API connection:

1. **Check Robot Connectivity**:
   - Verify the Raspberry Pi is powered on and connected to the network
   - Confirm the correct IP address in the application settings
   - Test connectivity using `ping [robot-ip]` from a terminal

2. **Review Error Messages**:
   - The application displays specific error messages when API calls fail
   - Check browser console for detailed error information
   - System logs may contain additional context about connection failures

3. **Inspect Cached Data**:
   - When in offline mode, verify the cached data timestamp to understand how old the data is
   - If needed, you can inspect the cache directly using Prisma Studio: `npx prisma studio`

4. **Reset Connections**:
   - Use the "Refresh" button on each component to attempt reconnection
   - Restart the robot API service if it's unresponsive
   - In persistent issues, check the robot's network configuration and logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Next.js and Vercel for the framework and deployment platform
- shadcn/ui for UI components
- Leaflet for mapping capabilities
- All open-source libraries used in this project
