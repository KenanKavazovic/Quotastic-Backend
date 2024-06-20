import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "./base.entity";
import { Quote } from "./quote.entity";
import { User } from "./user.entity";

@Entity()
export class UpvoteDownvote extends Base {
 @Column({ default: false })
  value: boolean;

  @ManyToOne(() => Quote, (quote) => quote.votes, { onDelete: 'SET NULL' })
  quote: Quote;

  @ManyToOne(() => User, (user) => user.votes, { onDelete: 'SET NULL' })
  user: User;
}