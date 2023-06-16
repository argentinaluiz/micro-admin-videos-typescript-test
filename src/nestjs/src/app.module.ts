import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { ShareModule } from './@share/@share.module';
import { CastMembersModule } from './cast-members/cast-members.module';
import { GenresModule } from './genres/genres.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot(),
    ShareModule,
    DatabaseModule.forRoot(),
    CategoriesModule,
    GenresModule,
    CastMembersModule,
  ],
})
export class AppModule {}
