import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from 'src/entities/quote.entity';
import { UpvoteDownvote } from 'src/entities/upvote-downvote.entity';
import { QuotesService } from '../quotes/quotes.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([UpvoteDownvote]), TypeOrmModule.forFeature([Quote])],
  controllers: [VotesController],
  providers: [VotesService, QuotesService],
  exports: [VotesService],
})
export class VotesModule {}
