import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: required('DB_HOST'),
  port: Number(required('DB_PORT')),
  username: required('DB_USER'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: ['error'],
  namingStrategy: new SnakeNamingStrategy(),
});
