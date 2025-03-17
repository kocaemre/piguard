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

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: PostgreSQL with Prisma ORM
- **Monitoring**: Sentry for error tracking and performance monitoring
- **Maps**: Leaflet for interactive mapping capabilities
- **Real-time Communication**: Socket.io for live data updates

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Next.js and Vercel for the framework and deployment platform
- shadcn/ui for UI components
- Leaflet for mapping capabilities
- All open-source libraries used in this project
