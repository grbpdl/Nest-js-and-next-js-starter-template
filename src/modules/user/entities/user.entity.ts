import { Exclude } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { Role } from 'src/modules/role/entities/role.entity';

import { BaseEntity } from 'src/shared/utils/Helper';
import { Column, Entity, Index, JoinTable, ManyToMany, OneToMany } from 'typeorm';

@Entity('user')
@Index('IDX_user_phone', ['phone'])
@Index('IDX_user_accountStatus', ['accountStatus'])
@Index('IDX_user_isEmailVerified', ['isEmailVerified'])
@Index('IDX_user_createdAt', ['createdAt'])
@Index('IDX_user_deletedAt', ['deletedAt'])
export class User extends BaseEntity {
  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  @IsString()
  emailVerificationToken: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  emailVerificationTokenExpiresAt: Date;

  @Column({ default: false })
  @IsBoolean()
  isEmailVerified: boolean;

  @Exclude()
  @Column({ select: false, nullable: false })
  @IsString()
  password: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  @IsString()
  editPasswordToken: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  editPasswordTokenExpiresAt: Date;

  @Column({ nullable: true })
  phone: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  @IsString()
  phoneVerificationToken: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  phoneVerificationTokenExpiresAt: Date;

  @Column({ default: false })
  @IsBoolean()
  isPhoneVerified: boolean;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: '', nullable: true })
  address: string;

  @Column({ default: null, nullable: true })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'transgender', 'other'],
    default: 'male',
  })
  gender: 'male' | 'female' | 'transgender' | 'other';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  accountStatus: 'active' | 'inactive' | 'suspended';

  @Column({ default: 0 })
  tokenVersion: number;

  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable({
    name: 'user_role',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
}
