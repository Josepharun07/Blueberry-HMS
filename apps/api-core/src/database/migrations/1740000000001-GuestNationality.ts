import { MigrationInterface, QueryRunner } from 'typeorm';

export class GuestNationality1740000000001 implements MigrationInterface {
  name = 'GuestNationality1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE guests ADD COLUMN IF NOT EXISTS nationality varchar(80);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE guests DROP COLUMN IF EXISTS nationality`);
  }
}
