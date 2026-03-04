import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST') || 'localhost',
  port: configService.get<number>('DB_PORT') || 5432,
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  
  // IMPORTANT: This scans ALL entity files
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: false,
  
  // Enable auto-loading of entities
  autoLoadEntities: true,
});
