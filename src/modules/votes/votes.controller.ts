import { Controller, Get, Post, Param, UseGuards, UseInterceptors, ClassSerializerInterceptor, ForbiddenException } from '@nestjs/common';
import { GetCurrentUser } from '../../decorators/get-current-user.decorator';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { VotesService } from './votes.service';
import { QuotesService } from '../quotes/quotes.service';

@Controller('votes')
@UseInterceptors(ClassSerializerInterceptor)
export class VotesController {
  constructor(private readonly votesService: VotesService, 
              private readonly quotesService: QuotesService,) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/upvote')
  async createUpvote(@GetCurrentUser() user: User, @Param('id') quoteId: number) {
    if(await this.quotesService.isUserAuthor(user, quoteId)){
      throw new ForbiddenException("You can't upvote your own quote.")
    }
    else{
      return this.votesService.createVote(true, user, quoteId);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/downvote')
  async createDownvote(@GetCurrentUser() user: User, @Param('id') quoteId: number) {
    if(await this.quotesService.isUserAuthor(user, quoteId)){
      throw new ForbiddenException("You can't downvote your own quote.")
    }
    else{
    return this.votesService.createVote(false, user, quoteId);
    }
  }

  @Get('user/:id')
  async findAllVotesOfUser(@Param('id') id: number) {
    return this.votesService.findAllVotesOfUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findAllCurrentUserUpvotes(@GetCurrentUser() user: User) {
    return this.votesService.findAllCurrentUserUpvotes(user);
  }
  
  @Get()
  async findAllVotes() {
    return this.votesService.findAllVotes();
  }
}