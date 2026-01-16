import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url));
import * as runtime from '@prisma/client/runtime/client';
import * as $Class from './internal/class';
import * as Prisma from './internal/prismaNamespace';
export * as $Enums from './enums';
export * from './enums';

export const PrismaClient = $Class.getPrismaClientClass();
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model User
 *
 */
export type User = Prisma.UserModel;
/**
 * Model Address
 *
 */
export type Address = Prisma.AddressModel;
/**
 * Model StopDay
 *
 */
export type StopDay = Prisma.StopDayModel;
/**
 * Model Employee
 *
 */
export type Employee = Prisma.EmployeeModel;
/**
 * Model EmployeeService
 *
 */
export type EmployeeService = Prisma.EmployeeServiceModel;
/**
 * Model Service
 *
 */
export type Service = Prisma.ServiceModel;
/**
 * Model Reminder
 *
 */
export type Reminder = Prisma.ReminderModel;
/**
 * Model Appointment
 *
 */
export type Appointment = Prisma.AppointmentModel;
/**
 * Model Subscription
 *
 */
export type Subscription = Prisma.SubscriptionModel;
/**
 * Model RefreshToken
 *
 */
export type RefreshToken = Prisma.RefreshTokenModel;
/**
 * Model LoginAttempt
 *
 */
export type LoginAttempt = Prisma.LoginAttemptModel;
/**
 * Model IpRateLimit
 *
 */
export type IpRateLimit = Prisma.IpRateLimitModel;
/**
 * Model EmailOtp
 *
 */
export type EmailOtp = Prisma.EmailOtpModel;
/**
 * Model PasswordResetToken
 *
 */
export type PasswordResetToken = Prisma.PasswordResetTokenModel;
/**
 * Model SecurityLog
 *
 */
export type SecurityLog = Prisma.SecurityLogModel;
