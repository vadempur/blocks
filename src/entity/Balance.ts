import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Balance {
  @PrimaryColumn()
  address!: string;

  @Column('float')
  balance!: number;
}
