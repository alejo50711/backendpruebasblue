import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  CLIENT = 'client',
  WORKER = 'worker',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 100 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
