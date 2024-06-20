import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Base } from './base.entity';
import { User } from './user.entity';
import { UpvoteDownvote } from './upvote-downvote.entity';

@Entity()
export class Quote extends Base {
  @Column()
  text: string;

  @Column({ default: 0 })
  karma: number;

  @ManyToOne(() => User, user => user.quotes)
  author: User;

  @OneToMany(() => UpvoteDownvote, (vote) => vote.quote)
  votes: UpvoteDownvote[];
}
