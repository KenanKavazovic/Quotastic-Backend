import { Entity, Column, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { Quote } from './quote.entity';
import { UpvoteDownvote } from './upvote-downvote.entity';

@Entity()
export class User extends Base {
  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar: string;
  
  @Column({ nullable: true, default: null })
  refreshToken: string;

  @OneToMany(() => Quote, quote => quote.author)
  quotes: Quote[];

  @OneToMany(() => UpvoteDownvote, (vote) => vote.user)
  votes: UpvoteDownvote[];
}
