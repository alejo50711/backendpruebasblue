import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CreditRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity({ name: 'credit_requests' })
export class CreditRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({ name: 'term_months', type: 'int' })
  termMonths!: number;

  @Column({ name: 'applicant_id', type: 'varchar', length: 30 })
  applicantId!: string;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CreditRequestStatus,
    default: CreditRequestStatus.PENDING,
  })
  status!: CreditRequestStatus;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
