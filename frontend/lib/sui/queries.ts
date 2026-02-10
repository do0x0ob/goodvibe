import { SuiClient } from '@mysten/sui/client';

export interface VaultData {
  id: string;
  owner: string;
  balance: bigint;
  globalDonationPercentage: number;
  totalDonated: bigint;
  createdAt: bigint;
}

export interface AllocationConfig {
  projectId: string;
  percentage: number;
  totalDonated: bigint;
  lastDonationAt: bigint;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  creator: string;
  raisedAmount: bigint;              // total_received
  supporterCount: number;
  totalSupportAmount?: bigint;       // 總支持金額
  balance?: bigint;                  // 當前餘額
  isActive?: boolean;                // 是否活躍
  createdAt?: bigint;                // 創建時間
}

export interface PlatformStatsData {
  totalProjectsCreated: number;
  totalVaultsCreated: number;
  totalValueLocked: bigint;
  createdAt: bigint;
}

function bytesToString(bytes: number[] | string | null | undefined) {
  if (!bytes) {
    return '';
  }
  if (typeof bytes === 'string') {
    return bytes;
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export async function getUserVault(
  client: SuiClient,
  address: string,
  packageId: string,
  stableCoinType: string
): Promise<VaultData | null> {
  const vaultType = `${packageId}::vault::Vault<${stableCoinType}>`;

  const objects = await client.getOwnedObjects({
    owner: address,
    filter: {
      StructType: vaultType,
    },
    options: {
      showContent: true,
      showType: true,
    },
  });

  if (!objects.data.length) {
    return null;
  }

  const vaultObj = objects.data[0];
  const content = vaultObj.data?.content as any;
  const fields = content?.fields;
  if (!fields) {
    return null;
  }

  const balanceField = fields.balance;
  const balanceValue = balanceField?.fields?.value ?? '0';

  return {
    id: vaultObj.data!.objectId,
    owner: fields.owner,
    balance: BigInt(balanceValue),
    globalDonationPercentage: Number(fields.global_donation_percentage ?? 0),
    totalDonated: BigInt(fields.total_donated ?? 0),
    createdAt: BigInt(fields.created_at ?? 0),
  };
}

export async function getVaultAllocations(
  client: SuiClient,
  vaultId: string
): Promise<AllocationConfig[]> {
  const dynamicFields = await client.getDynamicFields({
    parentId: vaultId,
  });

  const allocations: AllocationConfig[] = [];

  for (const field of dynamicFields.data) {
    try {
      const nameValue = (field as any).name?.value;
      const projectId =
        typeof nameValue === 'string' ? nameValue : nameValue?.toString() ?? '';

      const fieldObj = await client.getDynamicFieldObject({
        parentId: vaultId,
        name: (field as any).name,
      });

      const content = fieldObj.data?.content as any;
      const fields = content?.fields;
      if (!fields) {
        continue;
      }

      allocations.push({
        projectId,
        percentage: Number(fields.percentage ?? 0),
        totalDonated: BigInt(fields.total_donated ?? 0),
        lastDonationAt: BigInt(fields.last_donation_at ?? 0),
      });
    } catch {
      continue;
    }
  }

  return allocations;
}

export async function getAllProjects(
  client: SuiClient,
  packageId: string
): Promise<ProjectData[]> {
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::project::ProjectCreatedEvent`,
    },
    limit: 50,
  });

  const projects: ProjectData[] = [];

  for (const event of events.data) {
    try {
      const parsed = event.parsedJson as any;
      const projectId = parsed?.project_id;
      if (!projectId) {
        continue;
      }

      // 獲取事件時間戳作為備用
      const eventTimestamp = typeof event.timestampMs === 'string' 
        ? parseInt(event.timestampMs, 10) 
        : (event.timestampMs ?? 0);

      const projectObj = await client.getObject({
        id: projectId,
        options: { showContent: true },
      });

      const content = projectObj.data?.content as any;
      const fields = content?.fields;
      if (!fields) {
        continue;
      }

      const metadata = fields.metadata?.fields ?? {};
      const financial = fields.financial?.fields ?? {};
      const stats = fields.stats?.fields ?? {};

      // 獲取 balance 值
      const balanceField = financial.balance?.fields;
      const balanceValue = balanceField?.value ?? '0';

      // 優先使用合約的 created_at，如果為 0 則使用事件時間戳
      const contractCreatedAt = BigInt(stats.created_at ?? 0);
      const finalCreatedAt = contractCreatedAt > BigInt(0) ? contractCreatedAt : BigInt(eventTimestamp);

      projects.push({
        id: projectId,
        title: bytesToString(metadata.title),
        description: bytesToString(metadata.description),
        category: bytesToString(metadata.category),
        imageUrl: bytesToString(metadata.cover_image_url),
        creator: fields.creator ?? '',
        raisedAmount: BigInt(financial.total_received ?? 0),
        totalSupportAmount: BigInt(financial.total_support_amount ?? 0),
        balance: BigInt(balanceValue),
        supporterCount: Number(stats.supporter_count ?? 0),
        isActive: stats.is_active ?? true,
        createdAt: finalCreatedAt,
      });
    } catch {
      continue;
    }
  }

  return projects;
}

/** 依 projectId 取得單一專案（與 getAllProjects 相同解析邏輯） */
export async function getProjectById(
  client: SuiClient,
  projectId: string,
  packageId?: string
): Promise<ProjectData | null> {
  try {
    const projectObj = await client.getObject({
      id: projectId,
      options: { showContent: true },
    });

    const content = projectObj.data?.content as any;
    const fields = content?.fields;
    if (!fields) return null;

    const metadata = fields.metadata?.fields ?? {};
    const financial = fields.financial?.fields ?? {};
    const stats = fields.stats?.fields ?? {};

    const balanceField = financial.balance?.fields;
    const balanceValue = balanceField?.value ?? '0';

    // 獲取 created_at，如果為 0 則嘗試從事件獲取
    let finalCreatedAt = BigInt(stats.created_at ?? 0);
    
    if (finalCreatedAt === BigInt(0) && packageId) {
      try {
        const events = await client.queryEvents({
          query: {
            MoveEventType: `${packageId}::project::ProjectCreatedEvent`,
          },
          limit: 50,
        });
        
        const projectEvent = events.data.find((e: any) => {
          const parsed = e.parsedJson as any;
          return parsed?.project_id === projectId;
        });
        
        if (projectEvent) {
          const eventTimestamp = typeof projectEvent.timestampMs === 'string' 
            ? parseInt(projectEvent.timestampMs, 10) 
            : (projectEvent.timestampMs ?? 0);
          finalCreatedAt = BigInt(eventTimestamp);
        }
      } catch {
        // 忽略事件查詢錯誤
      }
    }

    return {
      id: projectId,
      title: bytesToString(metadata.title),
      description: bytesToString(metadata.description),
      category: bytesToString(metadata.category),
      imageUrl: bytesToString(metadata.cover_image_url),
      creator: fields.creator ?? '',
      raisedAmount: BigInt(financial.total_received ?? 0),
      totalSupportAmount: BigInt(financial.total_support_amount ?? 0),
      balance: BigInt(balanceValue),
      supporterCount: Number(stats.supporter_count ?? 0),
      isActive: stats.is_active ?? true,
      createdAt: finalCreatedAt,
    };
  } catch {
    return null;
  }
}

export async function getPlatformStats(
  client: SuiClient,
  platformId: string
): Promise<PlatformStatsData | null> {
  const platform = await client.getObject({
    id: platformId,
    options: { showContent: true },
  });

  const content = platform.data?.content as any;
  const fields = content?.fields;
  if (!fields) {
    return null;
  }

  return {
    totalProjectsCreated: Number(fields.total_projects_created ?? 0),
    totalVaultsCreated: Number(fields.total_vaults_created ?? 0),
    totalValueLocked: BigInt(fields.total_value_locked ?? 0),
    createdAt: BigInt(fields.created_at ?? 0),
  };
}

export interface SupportBadge {
  projectId: string;
  projectName: string;
  donationAmount: bigint;
  donatedAt: bigint;
}

export async function getUserSupportRecord(
  client: SuiClient,
  address: string,
  packageId: string
): Promise<string | null> {
  const recordType = `${packageId}::support_record::SupportRecord`;

  const objects = await client.getOwnedObjects({
    owner: address,
    filter: {
      StructType: recordType,
    },
    options: {
      showContent: true,
      showType: true,
    },
  });

  if (!objects.data.length) {
    return null;
  }

  return objects.data[0].data!.objectId;
}

export async function getSupportRecordBadges(
  client: SuiClient,
  recordId: string
): Promise<SupportBadge[]> {
  const dynamicFields = await client.getDynamicFields({
    parentId: recordId,
  });

  const badges: SupportBadge[] = [];

  for (const field of dynamicFields.data) {
    try {
      const nameValue = (field as any).name?.value;
      const projectId =
        typeof nameValue === 'string' ? nameValue : nameValue?.toString() ?? '';

      const fieldObj = await client.getDynamicFieldObject({
        parentId: recordId,
        name: (field as any).name,
      });

      const content = fieldObj.data?.content as any;
      const fields = content?.fields;
      if (!fields) {
        continue;
      }

      badges.push({
        projectId,
        projectName: bytesToString(fields.project_name),
        donationAmount: BigInt(fields.donation_amount ?? 0),
        donatedAt: BigInt(fields.donated_at ?? 0),
      });
    } catch {
      continue;
    }
  }

  return badges;
}

// ==================== Project supporters (from events) ====================

export interface ProjectSupporter {
  address: string;
  amount: bigint;
  lastUpdated: number;
}

const SUPPORT_EVENT_TYPES = [
  'SupportStartedEvent',
  'SupportIncreasedEvent',
  'SupportDecreasedEvent',
  'SupportEndedEvent',
] as const;

/** 從鏈上事件彙總單一專案的支持者列表（地址、當前金額、最後更新時間） */
export async function getProjectSupportersFromEvents(
  client: SuiClient,
  packageId: string,
  projectId: string
): Promise<ProjectSupporter[]> {
  const baseType = `${packageId}::project::`;
  const allEvents: Array<{ type: string; parsed: any; timestamp: number }> = [];

  for (const eventType of SUPPORT_EVENT_TYPES) {
    try {
      const fullType = baseType + eventType;
      const res = await client.queryEvents({
        query: { MoveEventType: fullType },
        limit: 100,
        order: 'ascending',
      });
      let matchedCount = 0;
      for (const e of res.data) {
        const parsed = e.parsedJson as any;
        if (parsed?.project_id !== projectId) continue;
        matchedCount++;
        // 使用事件實際發生的時間（timestampMs），而不是事件內的 timestamp
        const ts = typeof e.timestampMs === 'string' ? parseInt(e.timestampMs, 10) : (e.timestampMs ?? 0);
        allEvents.push({ type: eventType, parsed, timestamp: ts });
      }
    } catch {
      continue;
    }
  }

  if (allEvents.length === 0) {
    return [];
  }

  allEvents.sort((a, b) => a.timestamp - b.timestamp);

  const current: Record<string, { amount: bigint; lastUpdated: number }> = {};
  for (const { type, parsed, timestamp } of allEvents) {
    const addr = parsed?.supporter ?? '';
    if (!addr) continue;
    switch (type) {
      case 'SupportStartedEvent':
        current[addr] = { amount: BigInt(parsed.amount ?? 0), lastUpdated: timestamp };
        break;
      case 'SupportIncreasedEvent':
        current[addr] = { amount: BigInt(parsed.new_total ?? 0), lastUpdated: timestamp };
        break;
      case 'SupportDecreasedEvent':
        current[addr] = { amount: BigInt(parsed.new_total ?? 0), lastUpdated: timestamp };
        break;
      case 'SupportEndedEvent':
        delete current[addr];
        break;
    }
  }
  const supporters = Object.entries(current)
    .filter(([, v]) => v.amount > BigInt(0))
    .map(([address, v]) => ({ address, amount: v.amount, lastUpdated: v.lastUpdated }))
    .sort((a, b) => b.lastUpdated - a.lastUpdated);
  return supporters;
}

// ==================== Project updates (dynamic fields) ====================

export interface ProjectUpdateData {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  author: string;
}

/** 取得專案的所有進度更新（從事件獲取時間戳 + dynamic fields 獲取內容） */
export async function getProjectUpdates(
  client: SuiClient,
  projectId: string,
  packageId?: string
): Promise<ProjectUpdateData[]> {
  try {
    // 首先從事件獲取時間戳映射
    const pkgId = packageId || process.env.NEXT_PUBLIC_PACKAGE_ID || '';
    const eventType = `${pkgId}::project::UpdatePostedEvent`;
    
    const eventsRes = await client.queryEvents({
      query: { MoveEventType: eventType },
      limit: 100,
      order: 'descending',
    });
    
    // 建立 updateId -> eventTimestamp 的映射
    const timestampMap: Record<string, number> = {};
    for (const event of eventsRes.data) {
      const parsed = event.parsedJson as any;
      if (parsed?.project_id !== projectId) continue;
      
      // 解析 update_id（可能是 byte array）
      const updateIdBytes = parsed.update_id;
      const updateId = Array.isArray(updateIdBytes) 
        ? new TextDecoder().decode(new Uint8Array(updateIdBytes))
        : String(updateIdBytes);
      
      // 使用事件實際發生的時間
      const eventTimestamp = typeof event.timestampMs === 'string' 
        ? parseInt(event.timestampMs, 10) 
        : (event.timestampMs ?? 0);
      
      if (eventTimestamp > 0) {
        timestampMap[updateId] = eventTimestamp;
      }
    }
    const dynamicFields = await client.getDynamicFields({
      parentId: projectId,
    });
    const updates: ProjectUpdateData[] = [];

    for (const field of dynamicFields.data) {
      try {
        const name = (field as any).name;
        // 解析 name - 它可能是字串或者包含 value 的對象
        let updateId: string;
        if (typeof name === 'string') {
          updateId = name;
        } else if (name && typeof name === 'object') {
          const nameVal = name.value ?? name;
          if (typeof nameVal === 'string') {
            updateId = nameVal;
          } else if (Array.isArray(nameVal)) {
            updateId = new TextDecoder().decode(new Uint8Array(nameVal));
          } else {
            updateId = String(nameVal);
          }
        } else {
          continue;
        }
        // 獲取 dynamic field 的完整內容
        const fieldObj = await client.getDynamicFieldObject({
          parentId: projectId,
          name: name,
        });
        if (!fieldObj.data) continue;
        const content = fieldObj.data.content as any;
        if (!content) continue;
        const fields = content.fields;
        if (!fields) continue;
        // Dynamic field structure: { id, name, value }
        const updateData = fields.value?.fields || fields;
        const title = bytesToString(updateData.title);
        const body = bytesToString(updateData.content);
        const author = updateData.author ?? '';
        const timestamp = timestampMap[updateId] ?? Number(updateData.timestamp ?? 0);
        updates.push({
          id: updateId,
          title,
          content: body,
          timestamp,
          author,
        });
      } catch {
        continue;
      }
    }
    updates.sort((a, b) => b.timestamp - a.timestamp);
    return updates;
  } catch {
    return [];
  }
}

// ==================== ProjectCap ====================

/** 取得當前用戶對某專案的 ProjectCap object id（若有） */
export async function getProjectCapForProject(
  client: SuiClient,
  ownerAddress: string,
  projectId: string,
  packageId: string
): Promise<string | null> {
  const objects = await client.getOwnedObjects({
    owner: ownerAddress,
    filter: { StructType: `${packageId}::project::ProjectCap` },
    options: { showContent: true },
  });

  const cap = objects.data.find((obj) => {
    if (obj.data?.content && 'fields' in obj.data.content) {
      const fields = (obj.data.content as any).fields;
      return fields?.project_id === projectId;
    }
    return false;
  });

  return cap?.data?.objectId ?? null;
}
