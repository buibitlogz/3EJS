import { z } from 'zod';

export const InstallationSchema = z.object({
  id: z.string().optional(),
  no: z.string().optional(),
  dateinstalled: z.string().optional(),
  agentname: z.string().optional(),
  jonumber: z.string().min(1, 'JO Number is required'),
  accountnumber: z.string().optional(),
  subsname: z.string().min(1, 'Subscriber name is required'),
  contact1: z.string().optional(),
  contact2: z.string().optional(),
  address: z.string().optional(),
  lcpnapassignment: z.string().optional(),
  technician: z.string().optional(),
  modemserial: z.string().optional(),
  reelnum: z.string().optional(),
  reelstart: z.string().optional(),
  reelend: z.string().optional(),
  fiberopticcable: z.string().optional(),
  mechconnector: z.string().optional(),
  sclam: z.string().optional(),
  patchcordapcsc: z.string().optional(),
  housebracket: z.string().optional(),
  midspan: z.string().optional(),
  cableclip: z.string().optional(),
  ftthterminalbox: z.string().optional(),
  doublesidedtape: z.string().optional(),
  cabletiewrap: z.string().optional(),
  status: z.string().optional(),
  monthinstalled: z.string().optional(),
  yearinstalled: z.string().optional(),
  loadexpire: z.string().optional(),
  notifstatus: z.string().optional(),
  loadstatus: z.string().optional(),
});

export const ELoadTransactionSchema = z.object({
  id: z.string().optional(),
  gcashAcct: z.string().min(1, 'GCash handler is required'),
  dateLoaded: z.string().optional(),
  timeLoaded: z.string().optional(),
  time: z.string().optional(),
  gcashReference: z.string().optional(),
  amount: z.union([z.number().min(1), z.string()]).transform(v => typeof v === 'string' ? parseFloat(v) : v),
  accountNo: z.string().min(1, 'Account number is required'),
  remarks: z.string().optional(),
  markedUp: z.union([z.number(), z.string()]).optional().transform(v => typeof v === 'string' ? parseFloat(v) : v),
  incentive: z.union([z.number(), z.string()]).optional().transform(v => typeof v === 'string' ? parseFloat(v) : v),
  retailer: z.union([z.number(), z.string()]).optional().transform(v => typeof v === 'string' ? parseFloat(v) : v),
  dealer: z.union([z.number(), z.string()]).optional().transform(v => typeof v === 'string' ? parseFloat(v) : v),
});

export const UserSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'technician', 'eload', 'view_only']),
});

export type ValidatedInstallation = z.infer<typeof InstallationSchema>;
export type ValidatedELoadTransaction = z.infer<typeof ELoadTransactionSchema>;
export type ValidatedUser = z.infer<typeof UserSchema>;

export function validateInstallation(data: unknown): { success: true; data: ValidatedInstallation } | { success: false; error: string } {
  const result = InstallationSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors.map(e => e.message).join(', ') };
}

export function validateELoadTransaction(data: unknown): { success: true; data: ValidatedELoadTransaction } | { success: false; error: string } {
  const result = ELoadTransactionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors.map(e => e.message).join(', ') };
}

export function validateUser(data: unknown): { success: true; data: ValidatedUser } | { success: false; error: string } {
  const result = UserSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors.map(e => e.message).join(', ') };
}