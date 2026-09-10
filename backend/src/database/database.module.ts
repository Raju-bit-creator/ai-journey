import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // No migration system exists yet, so schema sync stays on by
        // default even in production containers. Set DB_SYNCHRONIZE=false
        // once real migrations replace this.
        synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
      }),
    }),
  ],
})
export class DatabaseModule {}
