import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
  } from '@nestjs/common'
  import { Quote } from '../../entities/quote.entity'
  import { PaginatedResult } from '../../interfaces/paginated-result.interface'
  import { CreateQuoteDto } from './dto/create-quote.dto'
  import { QuotesService } from './quotes.service'
  import { UpdateQuoteDto } from './dto/update-quote.dto'
  import { JwtAuthGuard } from '../auth/guards'
  import { GetCurrentUser } from 'src/decorators/get-current-user.decorator'
  import { User } from 'src/entities/user.entity'
  
  @Controller('quotes')
  export class QuotesController {
    constructor(private readonly quotesService: QuotesService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post('me/myquote')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createQuoteDto: CreateQuoteDto, @GetCurrentUser() user: User): Promise<Quote> {
      return this.quotesService.create(createQuoteDto, user)
    }
  
    @UseGuards(JwtAuthGuard, )
    @Patch('me/myquote/:id')
    @HttpCode(HttpStatus.OK)
    async update(@GetCurrentUser() user: User, @Param('id') id: number, @Body() updateQuoteDto: UpdateQuoteDto): Promise<Quote> {
      if(await this.quotesService.isUserAuthor(user, id)){
      return this.quotesService.update(id, updateQuoteDto)
      } else {
        throw new ForbiddenException("You can only edit your own quotes.")
      }
    }
  
    @UseGuards(JwtAuthGuard, )
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@GetCurrentUser() user: User, @Param('id') id: number): Promise<Quote> {
      if(await this.quotesService.isUserAuthor(user, id)){
        return this.quotesService.remove(id)
      } else {
        throw new ForbiddenException("You can only delete your own quotes.")
      }
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(@Query('page') page: number): Promise<PaginatedResult> {
      return this.quotesService.paginate(page)
    }

    @Get('mostupvoted') 
    MostUpvoted(@Query('limit') limit: number) {
      return this.quotesService.findMostUpvotedQuote(limit);
    }
  
    @Get('mostrecent') 
    MostRecent(@Query('limit') limit: number) {
      return this.quotesService.findMostRecentQuote(limit);
    }
      
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id') id: number): Promise<Quote> {
      return this.quotesService.findById(id)
    }
    
    @Get('user/:id')
    async findAllQuotesOfUser(@Param('id') id: number) {
      return this.quotesService.findAllQuotesOfUser(id);
    }
    
    @Get('user/karma/:id')
    async calculateKarma(@Param('id') id: number) {
      return this.quotesService.calculateKarma(id);
    }
  }
  