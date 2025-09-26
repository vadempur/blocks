import { Entity, PrimaryColumn, OneToMany, ManyToOne } from 'typeorm';
import type { Input } from './Input';
import type { Output } from './Output';
import type { Block } from './Block';

@Entity()
export class Transaction {
  @PrimaryColumn('varchar')
  id!: string;

  @ManyToOne('Block', (block: Block) => block.transactions, { onDelete: 'CASCADE' })
  block!: Block;

  @OneToMany('Input', (input: Input) => input.transaction, { cascade: true })
  inputs!: Input[];

  @OneToMany('Output', (output: Output) => output.transaction, { cascade: true })
  outputs!: Output[];
}
