import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { MailerModule } from "@nestjs-modules/mailer";
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { AuthModule } from './auth/auth.module';
import { SessionService } from './auth/session.service';
import { EmailService } from './auth/email.service';
import { PasswordService } from './auth/password.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            createKeyv('redis://localhost:6379'),
          ],
        };
      }, 
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.EMAIL_HOST,
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
      }),
    }),
    DrizzleModule,
    AuthModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService,SessionService, EmailService, PasswordService],
})
export class AppModule {}
