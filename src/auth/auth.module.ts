import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';  
import { PasswordService } from './password.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule,DrizzleModule,CacheModule.register(),HttpModule], 
  controllers: [AuthController],
  providers: [AuthService, SessionService, EmailService, PasswordService], 
})
export class AuthModule {}
