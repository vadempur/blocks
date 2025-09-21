import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Transaction } from './Transaction';

@Entity()
export class Output {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  address!: string;

  @Column('float')
  value!: number;

  @ManyToOne(() => Transaction, tx => tx.outputs)
  transaction!: Transaction;
}
