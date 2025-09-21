import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from './Transaction';

@Entity()
export class Block {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  height!: number;

  @OneToMany(() => Transaction, tx => tx.block, { cascade: true })
  transactions!: Transaction[];
}
