import { DataSource } from 'typeorm';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export class TestDatabaseHelper {
  private static dataSource: DataSource;

  static async setupTestDatabase(): Promise<DataSource> {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: requiredEnv('DB_HOST'),
      port: Number(requiredEnv('DB_PORT')),
      username: requiredEnv('DB_USER'),
      password: requiredEnv('DB_PASSWORD'),
      database: requiredEnv('TEST_DB_NAME'),
      entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
      synchronize: true,
      dropSchema: true,
    });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  static async cleanDatabase(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  }

  static async closeDatabase(dataSource: DataSource): Promise<void> {
    await dataSource.destroy();
  }
}
