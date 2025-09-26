import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Transaction } from './Transaction';

@Entity()
export class Block {
  @PrimaryColumn('varchar', { length: 64 })
  id!: string;

  @Column()
  height!: number;

  @OneToMany(() => Transaction, tx => tx.block, { cascade: true })
  transactions!: Transaction[];
}
