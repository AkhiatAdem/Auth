import {
    pgTable,
    serial,
    boolean,
    varchar,
    uuid,
  } from 'drizzle-orm/pg-core';

  
  export const users = pgTable('users', {
    id: uuid("id").defaultRandom().primaryKey(),
    email:varchar('email').unique().notNull(),
    hashedpwd:varchar('hashedpwd').notNull(),
    isEmailConfirmed: boolean().default(false),
    is2FAactivated: boolean().default(false)
  });