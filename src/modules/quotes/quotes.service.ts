import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Quote } from '../../entities/quote.entity'
import { AbstractService } from '../common/abstract.service'
import { Repository } from 'typeorm'
import { CreateQuoteDto } from './dto/create-quote.dto'
import { UpdateQuoteDto } from './dto/update-quote.dto'
import { User } from 'src/entities/user.entity'
import Logging from '../../library/Logging'

@Injectable()
export class QuotesService extends AbstractService {
  constructor(@InjectRepository(Quote) private readonly quotesRepository: Repository<Quote>) {
    super(quotesRepository)
  }

  async create(createQuoteDto: CreateQuoteDto, user: User): Promise<Quote> {
    try {
      const quote = this.quotesRepository.create({
        text: createQuoteDto.text,
        author: user, 
      });
      return this.quotesRepository.save(quote);
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Something went wrong while creating a new quote.');
    }
  }
  
  async update(quoteId: number, updateQuoteDto: UpdateQuoteDto): Promise<Quote> {
    const quote = (await this.findById(quoteId)) as Quote
    try {
      quote.text = updateQuoteDto.text,
      quote.karma = updateQuoteDto.karma
      return this.quotesRepository.save(quote)
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException('Something went wrong while updating your quote.')
    }
  }
  
  async isUserAuthor(user: User, quoteId: number): Promise<Quote> {
    return await this.quotesRepository.findOne({ where: { author: { email: user.email }, id: quoteId }, relations: ['author'] });
  }

  findMostUpvotedQuote(limit:number): Promise<Quote[]> {
    return this.quotesRepository
    .createQueryBuilder('quote')
    .leftJoinAndSelect('quote.votes', 'vote')
    .leftJoinAndSelect('vote.user', 'user')
    .leftJoinAndSelect('quote.author', 'author')
    .orderBy('quote.karma', 'DESC')
    .take(limit)
    .getMany();
  }

  findMostRecentQuote(limit:number): Promise<Quote[]> {
    return this.quotesRepository    
    .createQueryBuilder('quote')
    .leftJoinAndSelect('quote.votes', 'vote')
    .leftJoinAndSelect('vote.user', 'user')
    .leftJoinAndSelect('quote.author', 'author')
    .orderBy('quote.createdAt', 'DESC')
    .take(limit)
    .getMany();
  }
  
  async findAllQuotesOfUser(userId: number) {
    return this.quotesRepository.find({ where: { author: { id: userId } }, relations: ['author'] });
  }

  async calculateKarma(userId: number) {
    const quotes = await this.findAllQuotesOfUser(userId);
    const combinedKarma = quotes.reduce((acc, quote) => {
      const quoteKarma = quote.karma || 0;
      return acc + quoteKarma;
    }, 0);
    return combinedKarma;
  };
}
