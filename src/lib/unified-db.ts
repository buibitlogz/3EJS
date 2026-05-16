/**
 * unified-db.ts
 *
 * Unified database layer using Supabase as primary data source.
 */

import { localDb } from './local-db';
import { verifyPassword, hashPasswordIfNeeded } from './auth-utils';
import { supabaseFetch, isSupabaseConfigured } from './supabase';

const DATA_SOURCE = process.env.DATA_SOURCE || 'supabase';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const useSupabase = () => DATA_SOURCE === 'supabase' && SUPABASE_URL && SUPABASE_ANON_KEY;

export interface InstallationRow {
  id: string; no?: string; dateInstalled?: string; agentName?: string;
  joNumber?: string; accountNumber?: string; subscriberName?: string;
  contactNumber1?: string; contactNumber2?: string; address?: string;
  houseLatitude?: string; houseLongitude?: string; port?: string;
  assignedTechnician?: string; modemSerial?: string;
  reelNo?: string; reelStart?: string; reelEnd?: string;
  fiberOpticCable?: string; mechanicalConnector?: string; sClamp?: string;
  patchcordApsc?: string; houseBracket?: string; midspan?: string;
  cableClip?: string; ftthTerminalBox?: string; doubleSidedTape?: string;
  cableTieWrap?: string; status?: string; monthInstalled?: string;
  yearInstalled?: string; loadExpire?: string; createdAt?: string; updatedAt?: string;
  notifyStatus?: string; loadStatus?: string;
}

export interface ELoadRow {
  id: string; gcashHandler?: string; dateLoaded?: string; gcashReference?: string;
  timeLoaded?: string; amount?: number; accountNumber?: string;
  markup?: number; incentive?: number; retailer?: number; dealer?: number;
  remarks?: string; createdAt?: string; updatedAt?: string;
}

export interface HistoricalDataRow {
  id: string;
  dateInstalled?: string;
  joNumber?: string;
  accountNumber?: string;
  subscriberName?: string;
  address?: string;
  contactNumber1?: string;
  contactNumber2?: string;
  assignedTechnician?: string;
  modemSerial?: string;
  port?: string;
  napBoxLonglat?: string;
  fiberOpticCable?: string;
  mechanicalConnector?: string;
  sClamp?: string;
  patchcordApsc?: string;
  houseBracket?: string;
  midspan?: string;
  cableClip?: string;
  ftthTerminalBox?: string;
  doubleSidedTape?: string;
  cableTieWrap?: string;
  gcashHandler?: string;
  gcashReference?: string;
  timeLoaded?: string;
  amount?: number;
  markup?: number;
  incentive?: number;
  retailer?: number;
  dealer?: number;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRow {
  id: string; username: string; password: string; role: string; createdAt?: string;
}

const INSTALLATION_COLUMNS_SB: Record<string, string> = {
  id: 'id', no: 'no', dateInstalled: 'dateinstalled', agentName: 'agentname',
  joNumber: 'jonumber', accountNumber: 'accountnumber', subscriberName: 'subsname',
  contactNumber1: 'contact1', contactNumber2: 'contact2', address: 'address',
  houseLatitude: 'houselatitude', houseLongitude: 'houselongitude', port: 'port',
  assignedTechnician: 'technician',
  modemSerial: 'modemserial', reelNo: 'reelnum', reelStart: 'reelstart',
  reelEnd: 'reelend', fiberOpticCable: 'fiberopticcable',
  mechanicalConnector: 'mechconnector', sClamp: 'sclam',
  patchcordApsc: 'patchcordapcsc', houseBracket: 'housebracket',
  midspan: 'midspan', cableClip: 'cableclip', ftthTerminalBox: 'ftthterminalbox',
  doubleSidedTape: 'doublesidedtape', cableTieWrap: 'cabletiewrap',
  monthInstalled: 'monthinstalled', yearInstalled: 'yearinstalled',
  loadExpire: 'loadexpire', notifyStatus: 'notifstatus', loadStatus: 'loadstatus',
};

const ELOAD_COLUMNS_SB: Record<string, string> = {
  id: 'id', gcashHandler: 'gcashhandler', dateLoaded: 'dateloaded',
  gcashReference: 'gcashreference', timeLoaded: 'timeloaded', amount: 'amount',
  accountNumber: 'accountnumber', markup: 'markup', incentive: 'incentive',
  retailer: 'retailer', dealer: 'dealer', remarks: 'remarks',
};

const USER_COLUMNS_SB: Record<string, string> = {
  id: 'id', username: 'username', password: 'password', role: 'role', createdAt: 'createdat',
};

const HISTORICALDATA_COLUMNS_SB: Record<string, string> = {
  id: 'id', dateInstalled: 'dateinstalled', joNumber: 'jonumber',
  accountNumber: 'accountnumber', subscriberName: 'subsname',
  address: 'address', contactNumber1: 'contact1', contactNumber2: 'contact2',
  assignedTechnician: 'technician', modemSerial: 'modemserial', port: 'port',
  napBoxLonglat: 'napboxlonglat',
  fiberOpticCable: 'fiberopticcable', mechanicalConnector: 'mechconnector',
  sClamp: 'sclamp', patchcordApsc: 'patchcordapsc', houseBracket: 'housebracket',
  midspan: 'midspan', cableClip: 'cableclip', ftthTerminalBox: 'ftthterminalbox',
  doubleSidedTape: 'doublesidedtape', cableTieWrap: 'cabletiewrap',
  gcashHandler: 'gcashhandler', gcashReference: 'gcashreference',
  timeLoaded: 'timeloaded', amount: 'amount', markup: 'markup',
  incentive: 'incentive', retailer: 'retailer', dealer: 'dealer',
  remarks: 'remarks', createdAt: 'createdat', updatedAt: 'updatedat',
};

function fromCamelCase(obj: Record<string, unknown>, mapping: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(mapping)) {
    if (col && obj[key] !== undefined) {
      result[col] = obj[key];
    }
  }
  return result;
}

export async function getAllInstallations(): Promise<InstallationRow[]> {
  if (useSupabase()) {
    const { data, error } = await supabaseFetch<Record<string, unknown>>('installations');
    if (error) {
      console.error('[DB] Error fetching installations:', error);
      if (typeof window !== 'undefined' && window.indexedDB) {
        return localDb.getAll<InstallationRow>('installations');
      }
      return [];
    }
    if (data) {
      const mapped = data.map(row => toCamelCaseInstallation(row));
      if (typeof window !== 'undefined' && window.indexedDB) {
        await localDb.putBatch('installations', mapped);
      }
      return mapped;
    }
    return [];
  }
  if (typeof window !== 'undefined' && window.indexedDB) {
    return localDb.getAll<InstallationRow>('installations');
  }
  return [];
}

function toCamelCaseInstallation(row: Record<string, unknown>): InstallationRow {
  const map: Record<string, keyof InstallationRow> = {
    id: 'id', no: 'no', dateinstalled: 'dateInstalled', agentname: 'agentName',
    jonumber: 'joNumber', accountnumber: 'accountNumber', subsname: 'subscriberName',
    contact1: 'contactNumber1', contact2: 'contactNumber2', address: 'address',
    houselatitude: 'houseLatitude', houselongitude: 'houseLongitude', port: 'port',
    technician: 'assignedTechnician',
    modemserial: 'modemSerial', reelnum: 'reelNo', reelstart: 'reelStart',
    reelend: 'reelEnd', fiberopticcable: 'fiberOpticCable',
    mechconnector: 'mechanicalConnector', sclam: 'sClamp',
    patchcordapcsc: 'patchcordApsc', housebracket: 'houseBracket',
    midspan: 'midspan', cableclip: 'cableClip', ftthterminalbox: 'ftthTerminalBox',
    doublesidedtape: 'doubleSidedTape', cabletiewrap: 'cableTieWrap',
    monthinstalled: 'monthInstalled', yearinstalled: 'yearInstalled',
    loadexpire: 'loadExpire', notifstatus: 'notifyStatus', loadstatus: 'loadStatus',
    status: 'status', createdat: 'createdAt', updatedat: 'updatedAt',
  };
  const result: Record<string, unknown> = {};
  for (const [snake, val] of Object.entries(row)) {
    const camel = map[snake];
    if (camel) result[camel] = val;
    else result[snake] = val;
  }
  return result as unknown as InstallationRow;
}

function toCamelCaseEload(row: Record<string, unknown>): ELoadRow {
  const map: Record<string, string> = {
    id: 'id', gcashhandler: 'gcashAccount', dateloaded: 'dateLoaded',
    gcashreference: 'gcashReference', timeloaded: 'timeLoaded', amount: 'amount',
    accountnumber: 'accountNumber', markup: 'markedUp', incentive: 'incentive',
    retailer: 'retailer', dealer: 'dealer', remarks: 'remarks',
    createdat: 'createdAt', updatedat: 'updatedAt',
  };
  const result: Record<string, unknown> = {};
  for (const [snake, val] of Object.entries(row)) {
    const camel = map[snake];
    if (camel) result[camel] = val;
    else result[snake] = val;
  }
  return result as unknown as ELoadRow;
}

function toCamelCaseUser(row: Record<string, unknown>): UserRow {
  return {
    id: String(row.id || row.username || ''),
    username: String(row.username || ''),
    password: String(row.password || ''),
    role: String(row.role || 'view_only'),
    createdAt: row.createdat as string | undefined,
  };
}

function toCamelCaseHistoricaldata(row: Record<string, unknown>): HistoricalDataRow {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const parsed = parseFloat(v);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const map: Record<string, keyof HistoricalDataRow> = {
    id: 'id', dateinstalled: 'dateInstalled', jonumber: 'joNumber',
    accountnumber: 'accountNumber', subsname: 'subscriberName',
    address: 'address', contact1: 'contactNumber1', contact2: 'contactNumber2',
    technician: 'assignedTechnician', modemserial: 'modemSerial', port: 'port',
    napboxlonglat: 'napBoxLonglat',
    fiberopticcable: 'fiberOpticCable', mechconnector: 'mechanicalConnector',
    sclamp: 'sClamp', patchcordapsc: 'patchcordApsc', housebracket: 'houseBracket',
    midspan: 'midspan', cableclip: 'cableClip', ftthterminalbox: 'ftthTerminalBox',
    doublesidedtape: 'doubleSidedTape', cabletiewrap: 'cableTieWrap',
    gcashhandler: 'gcashHandler', gcashreference: 'gcashReference',
    timeloaded: 'timeLoaded', amount: 'amount', markup: 'markup',
    incentive: 'incentive', retailer: 'retailer', dealer: 'dealer',
    remarks: 'remarks', createdat: 'createdAt', updatedat: 'updatedAt',
  };
  const result: Record<string, unknown> = {};
  for (const [snake, val] of Object.entries(row)) {
    const camel = map[snake];
    if (camel) {
      if (['amount', 'markup', 'incentive', 'retailer', 'dealer'].includes(snake)) {
        result[camel] = parseNum(val);
      } else {
        result[camel] = val;
      }
    } else {
      result[snake] = val;
    }
  }
  return result as unknown as HistoricalDataRow;
}

export async function createInstallation(data: Partial<InstallationRow>): Promise<InstallationRow> {
  const now = new Date().toISOString();
  const id = data.id || `INST-${Date.now()}`;

  let loadExpire = data.loadExpire;
  if (data.dateInstalled && !loadExpire) {
    const d = new Date(data.dateInstalled);
    d.setDate(d.getDate() + 90);
    loadExpire = d.toISOString().split('T')[0];
  }

  const row: InstallationRow = {
    ...data,
    id,
    loadExpire,
    createdAt: now,
    updatedAt: now,
  } as InstallationRow;

  if (useSupabase()) {
    try {
      const sbData = fromCamelCase(row as unknown as Record<string, unknown>, INSTALLATION_COLUMNS_SB);
      await supabaseFetch('installations', {
        method: 'POST',
        body: sbData,
      });
    } catch (error) {
      console.warn('[DB] Supabase write failed, falling back to IndexedDB only:', error);
    }
  }

  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      await localDb.put('installations', row);
    } catch (error) {
      console.warn('[DB] IndexedDB write failed:', error);
    }
  }
  
  return row;
}

export async function updateInstallation(id: string, data: Partial<InstallationRow>): Promise<InstallationRow | undefined> {
  let existing: InstallationRow | undefined;
  
  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      existing = await localDb.getById<InstallationRow>('installations', id);
    } catch (error) {
      console.warn('[DB] IndexedDB read failed:', error);
    }
  }
  
  if (!existing) {
    // Fallback to fetching from Supabase if IndexedDB fails
    if (useSupabase()) {
      try {
        const { data: sbData } = await supabaseFetch<InstallationRow>('installations', {
          params: { id: `eq.${id}`, select: '*' },
        });
        if (sbData && sbData.length > 0) {
          existing = toCamelCaseInstallation(sbData[0] as unknown as Record<string, unknown>) as InstallationRow;
        }
      } catch (error) {
        console.warn('[DB] Supabase read failed:', error);
      }
    }
  }
  
  if (!existing) return undefined;

  let loadExpire = data.loadExpire;
  if (data.dateInstalled && !loadExpire && data.dateInstalled !== existing.dateInstalled) {
    const d = new Date(data.dateInstalled);
    d.setDate(d.getDate() + 90);
    loadExpire = d.toISOString().split('T')[0];
  }

  const updated = { ...existing, ...data, loadExpire: loadExpire || existing.loadExpire, updatedAt: new Date().toISOString() };

  if (useSupabase()) {
    try {
      const sbData = fromCamelCase(updated as unknown as Record<string, unknown>, INSTALLATION_COLUMNS_SB);
      await supabaseFetch('installations', {
        method: 'PATCH',
        body: sbData,
        params: { id: `eq.${id}` },
      });
    } catch (error) {
      console.warn('[DB] Supabase update failed:', error);
    }
  }

  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      await localDb.put('installations', updated);
    } catch (error) {
      console.warn('[DB] IndexedDB write failed:', error);
    }
  }
  
  return updated;
}

export async function deleteInstallation(id: string): Promise<boolean> {
  if (useSupabase()) {
    try {
      await supabaseFetch('installations', {
        method: 'DELETE',
        params: { id: `eq.${id}` },
      });
    } catch (error) {
      console.warn('[DB] Supabase delete failed:', error);
    }
  }

  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      await localDb.remove('installations', id);
    } catch (error) {
      console.warn('[DB] IndexedDB remove failed:', error);
    }
  }
  
  return true;
}

export async function getAllHistoricalData(): Promise<HistoricalDataRow[]> {
  if (useSupabase()) {
    const { data, error } = await supabaseFetch<HistoricalDataRow>('historicaldata');
    
    if (data && data.length > 0) {
      const mapped = data.map(row => toCamelCaseHistoricaldata(row as unknown as Record<string, unknown>));
      
      if (typeof window !== 'undefined' && window.indexedDB) {
        try {
          await localDb.putBatch('historicaldata', mapped);
        } catch (e) {
          console.warn('[DB] IndexedDB write failed:', e);
        }
      }
      return mapped;
    }
  }
  
  return [];
}

export async function getAllEload(): Promise<ELoadRow[]> {
  if (useSupabase()) {
    const { data, error } = await supabaseFetch<ELoadRow>('eload');
    if (error) {
      console.error('[DB] Error fetching eload:', error);
      if (typeof window !== 'undefined' && window.indexedDB) {
        return localDb.getAll<ELoadRow>('eload');
      }
      return [];
    }
    if (data) {
      const mapped = data.map(row => toCamelCaseEload(row as unknown as Record<string, unknown>));
      if (typeof window !== 'undefined' && window.indexedDB) {
        await localDb.putBatch('eload', mapped);
      }
      return mapped;
    }
    return [];
  }
  if (typeof window !== 'undefined' && window.indexedDB) {
    return localDb.getAll<ELoadRow>('eload');
  }
  return [];
}

export async function createEload(data: Partial<ELoadRow>): Promise<ELoadRow> {
  const now = new Date().toISOString();
  const id = data.id || `EL-${Date.now()}`;

  const row: ELoadRow = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  } as ELoadRow;

  if (useSupabase()) {
    try {
      const sbData = fromCamelCase(row as unknown as Record<string, unknown>, ELOAD_COLUMNS_SB);
      await supabaseFetch('eload', {
        method: 'POST',
        body: sbData,
      });
    } catch (error) {
      console.warn('[DB] Supabase write failed, falling back to IndexedDB only:', error);
    }
  }

  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      await localDb.put('eload', row);
    } catch (error) {
      console.warn('[DB] IndexedDB write failed:', error);
    }
  }
  
  return row;
}

export async function updateEload(id: string, data: Partial<ELoadRow>): Promise<ELoadRow | undefined> {
  const existing = await localDb.getById<ELoadRow>('eload', id);
  if (!existing) return undefined;

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };

  if (useSupabase()) {
    try {
      const sbData = fromCamelCase(updated as unknown as Record<string, unknown>, ELOAD_COLUMNS_SB);
      await supabaseFetch('eload', {
        method: 'PATCH',
        body: sbData,
        params: { id: `eq.${id}` },
      });
    } catch (error) {
      console.warn('[DB] Supabase update failed:', error);
    }
  }

  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      await localDb.put('eload', updated);
    } catch (error) {
      console.warn('[DB] IndexedDB write failed:', error);
    }
  }
  
  return updated;
}

export async function deleteEload(id: string): Promise<boolean> {
  if (useSupabase()) {
    try {
      await supabaseFetch('eload', {
        method: 'DELETE',
        params: { id: `eq.${id}` },
      });
    } catch (error) {
      console.warn('[DB] Supabase delete failed:', error);
    }
  }

  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      await localDb.remove('eload', id);
    } catch (error) {
      console.warn('[DB] IndexedDB remove failed:', error);
    }
  }
  
  return true;
}

export async function getAllUsers(): Promise<UserRow[]> {
  if (useSupabase()) {
    const { data, error } = await supabaseFetch<Record<string, unknown>>('users');
    if (error) {
      console.error('[DB] Error fetching users:', error);
      if (typeof window !== 'undefined' && window.indexedDB) {
        return localDb.getAll<UserRow>('users');
      }
      return [];
    }
    if (data) {
      const mapped = data.map(row => toCamelCaseUser(row));
      if (typeof window !== 'undefined' && window.indexedDB) {
        await localDb.putBatch('users', mapped);
      }
      return mapped;
    }
    return [];
  }
  if (typeof window !== 'undefined' && window.indexedDB) {
    return localDb.getAll<UserRow>('users');
  }
  return [];
}

export async function authenticateUser(username: string, password: string): Promise<UserRow | null> {
  const users = await getAllUsers();
  const user = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password || '');
  if (!isValid) return null;
  return user;
}

export async function createUser(data: { username: string; password: string; role: string }): Promise<UserRow> {
  const now = new Date().toISOString();
  const hashedPassword = await hashPasswordIfNeeded(data.password);

  const row: UserRow = {
    id: data.username,
    username: data.username,
    password: hashedPassword,
    role: data.role,
    createdAt: now,
  };

  if (useSupabase()) {
    const sbData = fromCamelCase(row as unknown as Record<string, unknown>, USER_COLUMNS_SB);
    await supabaseFetch('users', {
      method: 'POST',
      body: sbData,
    });
  }

  await localDb.put('users', row);
  return row;
}

export async function updateUser(id: string, data: { username?: string; password?: string; role?: string }): Promise<UserRow | null> {
  const users = await getAllUsers();
  const existing = users.find(u => u.id === id);
  if (!existing) return null;

  const updates: Partial<UserRow> = { ...existing };
  if (data.username !== undefined) updates.username = data.username;
  if (data.password !== undefined) updates.password = await hashPasswordIfNeeded(data.password);
  if (data.role !== undefined) updates.role = data.role;

  if (useSupabase()) {
    const sbData = fromCamelCase(updates as unknown as Record<string, unknown>, USER_COLUMNS_SB);
    await supabaseFetch('users', {
      method: 'PATCH',
      body: sbData,
      params: { id: `eq.${id}` },
    });
  }

  await localDb.put('users', updates as UserRow);
  return updates as UserRow;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (useSupabase()) {
    await supabaseFetch('users', {
      method: 'DELETE',
      params: { id: `eq.${id}` },
    });
  }

  await localDb.remove('users', id);
  return true;
}

export async function syncFromRemote(): Promise<void> {
  try {
    if (useSupabase()) {
      const [installations, eload, users, historicaldata] = await Promise.all([
        getAllInstallations(),
        getAllEload(),
        getAllUsers(),
        getAllHistoricalData(),
      ]);

      await Promise.all([
        localDb.putBatch('installations', installations),
        localDb.putBatch('eload', eload),
        localDb.putBatch('users', users),
        localDb.putBatch('historicaldata', historicaldata),
      ]);

      console.log('[Sync] Complete from Supabase — installations:', installations.length, '| eload:', eload.length, '| users:', users.length, '| historicaldata:', historicaldata.length);
    }
  } catch (err) {
    console.error('[Sync] Failed:', err);
  }
}

export async function checkAndUpdateInstallationForLoad(accountNumber: string, createdAt: string): Promise<void> {
  try {
    const installations = await getAllInstallations();
    const installation = installations.find(inst => inst.accountNumber === accountNumber);
    
    if (installation && installation.loadStatus !== 'Account Loaded') {
      const updates: Partial<InstallationRow> = {
        loadStatus: 'Account Loaded',
      };
      
      if (installation.notifyStatus === 'Not Yet Notified') {
        updates.notifyStatus = 'Not Needed';
      }
      
      await updateInstallation(installation.id, updates);
      console.log(`[Auto-Load] Account ${accountNumber} marked as loaded, notifyStatus: ${updates.notifyStatus || installation.notifyStatus}`);
    }
  } catch (error) {
    console.error('[Auto-Load] Failed to check/update installation:', error);
  }
}

export async function archivePreviousYears(currentYear: number): Promise<number> {
  try {
    const installations = await getAllInstallations();
    const toArchive = installations.filter(inst => {
      const year = parseInt(String(inst.yearInstalled || ''));
      return !isNaN(year) && year < currentYear;
    });
    
    if (toArchive.length === 0) {
      return 0;
    }
    
    const historicalRecords: HistoricalDataRow[] = toArchive.map(inst => ({
      id: inst.id,
      dateInstalled: inst.dateInstalled,
      joNumber: inst.joNumber,
      accountNumber: inst.accountNumber,
      subscriberName: inst.subscriberName,
      address: inst.address,
      contactNumber1: inst.contactNumber1,
      contactNumber2: inst.contactNumber2,
      assignedTechnician: inst.assignedTechnician,
      modemSerial: inst.modemSerial,
      port: inst.port,
      napBoxLonglat: '',
      fiberOpticCable: inst.fiberOpticCable,
      mechanicalConnector: inst.mechanicalConnector,
      sClamp: inst.sClamp,
      patchcordApsc: inst.patchcordApsc,
      houseBracket: inst.houseBracket,
      midspan: inst.midspan,
      cableClip: inst.cableClip,
      ftthTerminalBox: inst.ftthTerminalBox,
      doubleSidedTape: inst.doubleSidedTape,
      cableTieWrap: inst.cableTieWrap,
      gcashHandler: '',
      gcashReference: '',
      timeLoaded: '',
      amount: 0,
      markup: 0,
      incentive: 0,
      retailer: 0,
      dealer: 0,
      remarks: '',
      createdAt: inst.createdAt,
      updatedAt: inst.updatedAt,
    }));
    
    if (useSupabase()) {
      try {
        for (const record of historicalRecords) {
          const sbData = fromCamelCase(record as unknown as Record<string, unknown>, HISTORICALDATA_COLUMNS_SB);
          await supabaseFetch('historicaldata', {
            method: 'POST',
            body: sbData,
          });
          
          await supabaseFetch('installations', {
            method: 'DELETE',
            params: { id: `eq.${record.id}` },
          });
        }
      } catch (error) {
        console.warn('[Archive] Supabase archive failed:', error);
        throw error;
      }
    }
    
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        await localDb.putBatch('historicaldata', historicalRecords);
        for (const record of historicalRecords) {
          await localDb.remove('installations', record.id);
        }
      } catch (error) {
        console.warn('[Archive] IndexedDB archive failed:', error);
      }
    }
    
    console.log(`[Archive] Archived ${toArchive.length} installations from years before ${currentYear}`);
    return toArchive.length;
  } catch (error) {
    console.error('[Archive] Failed to archive previous years:', error);
    throw error;
  }
}

export { localDb };