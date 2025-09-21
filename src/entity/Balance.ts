import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Balance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  address!: string;

  @Column('float')
  balance!: number;
}
