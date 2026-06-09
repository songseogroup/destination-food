import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('homepage_content')
export class HomepageContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  section: string;

  @Column({ type: 'json' })
  content: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
