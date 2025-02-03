import {
    pgTable,
    serial,
    boolean,
    varchar,
  } from 'drizzle-orm/pg-core';

  
  export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email:varchar('email').unique().notNull(),
    hashedpwd:varchar('hashedpwd').notNull(),
    isEmailConfirmed: boolean().default(false)
  });