import 'server-only';
import { todayIn } from '@/domain/dates';
export const appTimeZone = process.env.APP_TIME_ZONE ?? 'America/Phoenix';
export const today = () => todayIn(appTimeZone);
