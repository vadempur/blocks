import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Transaction } from './Transaction';

@Entity()
export class Input {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  txId!: string;

  @Column()
  index!: number;

  @ManyToOne(() => Transaction, tx => tx.inputs)
  transaction!: Transaction;
}
