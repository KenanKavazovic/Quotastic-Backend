import { Module, RequestMethod } from '@nestjs/common';
import { NestModule } from '@nestjs/common'
import { MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from 'src/config/schema.config';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from 'src/middleware/logger.middleware';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { QuotesModule } from './quotes/quotes.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.STAGE}`],
      validationSchema: configValidationSchema,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    QuotesModule,
    VotesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
