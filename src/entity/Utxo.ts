import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Utxo {
  @PrimaryColumn()
  id!: string; 

  @Column()
  txId!: string;

  @Column()
  index!: number;

  @Column()
  address!: string;

  @Column('decimal', { precision: 20, scale: 8 })
  value!: number;
}
