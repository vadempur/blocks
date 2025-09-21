import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Block } from './Block';
import { Input } from './Input';
import { Output } from './Output';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Block, block => block.transactions)
  block!: Block;

  @OneToMany(() => Input, input => input.transaction, { cascade: true })
  inputs!: Input[];

  @OneToMany(() => Output, output => output.transaction, { cascade: true })
  outputs!: Output[];
}
