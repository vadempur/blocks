import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Transaction } from './Transaction';

@Entity()
export class Output {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  address!: string;

  @Column('decimal', { precision: 20, scale: 8 })
  value!: number;

  @Column({ name: 'transactionId' })
  transactionId!: string;

  @ManyToOne('Transaction', (transaction: Transaction) => transaction.outputs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: Transaction;
}
