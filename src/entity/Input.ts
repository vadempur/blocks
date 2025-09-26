import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import type { Transaction } from './Transaction';

@Entity()
export class Input {
  @PrimaryColumn('varchar')
  id!: string;

  @Column()
  txId!: string;

  @Column()
  index!: number;

  @ManyToOne('Transaction', (tx: Transaction) => tx.inputs, { onDelete: 'CASCADE' })
  transaction!: Transaction;
}
