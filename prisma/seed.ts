import { PrismaClient, LogLevel } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Örnek kullanıcı oluştur
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: await hash('iku1234', 10),
      role: 'ADMIN',
    },
  });

  console.log({ admin });

  // Örnek sistem logları oluştur
  const logSources = [
    'system', 'camera', 'gps', 'api', 'database', 'authentication', 'network', 'hardware'
  ];

  const logMessages = {
    DEBUG: [
      'Initializing component',
      'Connection attempt',
      'Data processing started',
      'Configuration loaded',
      'Cache hit',
      'Memory usage at 45%',
      'Received request',
      'Processing sensor data'
    ],
    INFO: [
      'System started successfully',
      'User logged in',
      'Data synchronized',
      'Connection established',
      'Image captured',
      'GPS position updated',
      'Configuration updated',
      'API request completed'
    ],
    WARNING: [
      'High CPU usage detected',
      'Low disk space',
      'Connection unstable',
      'GPS signal weak',
      'Cache miss',
      'Authentication attempt failed',
      'Request timeout',
      'Battery below 30%'
    ],
    ERROR: [
      'Failed to connect to database',
      'API request failed',
      'Image processing error',
      'GPS data invalid',
      'Memory allocation failed',
      'Authentication failed',
      'Network timeout',
      'Hardware error detected'
    ],
    CRITICAL: [
      'System crash detected',
      'Database corruption',
      'Security breach detected',
      'Hardware failure',
      'Connection lost',
      'Data loss detected',
      'Power failure imminent',
      'GPS module malfunction'
    ]
  };

  // Önceki logları temizle
  await prisma.logEntry.deleteMany({});

  // Son 7 gün için örnek loglar oluştur
  const now = new Date();
  const logs = [];

  for (let i = 0; i < 200; i++) {
    const randomTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const levelKeys = Object.keys(logMessages) as LogLevel[];
    const randomLevel = levelKeys[Math.floor(Math.random() * levelKeys.length)];
    const randomSource = logSources[Math.floor(Math.random() * logSources.length)];
    const randomMessage = logMessages[randomLevel][Math.floor(Math.random() * logMessages[randomLevel].length)];
    
    const details = randomLevel === 'ERROR' || randomLevel === 'CRITICAL' 
      ? `Stack trace:\n  at Function.${randomSource}Module.method (${randomSource}.ts:${Math.floor(Math.random() * 1000)}:${Math.floor(Math.random() * 100)})\n  at processTicksAndRejections (node:internal/process/task_queues:95:5)`
      : null;
    
    const metadata = {
      sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
      deviceInfo: {
        model: 'Raspberry Pi 5',
        os: 'Raspberry Pi OS',
        version: '12.0'
      }
    };

    logs.push({
      timestamp: randomTime,
      level: randomLevel,
      source: randomSource,
      message: randomMessage,
      details,
      metadata
    });
  }

  // Tüm logları tek seferde oluştur
  await prisma.logEntry.createMany({
    data: logs,
  });

  console.log(`Oluşturulan loglar: ${logs.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 