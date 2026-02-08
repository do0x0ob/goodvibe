# Sui gRPC Integration Guide

本文檔說明如何將 GoodVibe 前端從 Mock API 遷移到 Sui 的新 gRPC API。

## 📋 Current Mock API Structure

### 1. Dashboard API (`/api/dashboard`)

**返回數據：**
```typescript
{
  vault: {
    id: string,
    owner: string,
    balance: string, // BigInt as string
    globalDonationPercentage: number,
    totalDonated: string,
    createdAt: string,
  },
  allocations: Array<{
    projectId: string,
    percentage: number,
    totalDonated: string,
    lastDonationAt: string,
  }>,
  stats: {
    estimatedAnnualYield: string,
    donationPool: string,
    retainedYield: string,
    activeProjects: number,
  }
}
```

### 2. Vault API (`/api/vault`)

與 Dashboard API 相同結構。

### 3. Projects API (`/api/projects`)

**返回數據：**
```typescript
Array<{
  id: string,
  title: string,
  description: string,
  category: string,
  imageUrl: string,
  creator: string,
  raisedAmount: string, // BigInt as string
  supporterCount: number,
}>
```

### 4. Platform Stats API (`/api/stats`)

**返回數據：**
```typescript
{
  totalProjectsCreated: number,
  totalVaultsCreated: number,
  totalValueLocked: string,
  totalDonated: string,
  activeProjects: number,
  activeDonors: number,
  createdAt: string,
}
```

---

## 🔄 Sui gRPC Integration Plan

### Prerequisites

```bash
npm install @mysten/sui.js@latest
```

### Phase 1: Query Objects

#### 1.1 Query User's Vault

```typescript
import { SuiClient } from '@mysten/sui.js/client';

async function getUserVault(
  client: SuiClient,
  userAddress: string,
  packageId: string
): Promise<Vault | null> {
  // Query owned Vault objects
  const objects = await client.getOwnedObjects({
    owner: userAddress,
    filter: {
      StructType: `${packageId}::vault::Vault<USDC_TYPE>`,
    },
    options: {
      showContent: true,
      showType: true,
    },
  });

  if (objects.data.length === 0) return null;

  const vaultObj = objects.data[0];
  const fields = vaultObj.data?.content?.fields;

  return {
    id: vaultObj.data.objectId,
    owner: fields.owner,
    balance: BigInt(fields.balance),
    globalDonationPercentage: Number(fields.global_donation_percentage),
    totalDonated: BigInt(fields.total_donated),
    createdAt: BigInt(fields.created_at),
  };
}
```

#### 1.2 Query Dynamic Field Allocations

```typescript
async function getVaultAllocations(
  client: SuiClient,
  vaultId: string
): Promise<AllocationConfig[]> {
  // Query all dynamic fields on the vault
  const dynamicFields = await client.getDynamicFields({
    parentId: vaultId,
  });

  const allocations: AllocationConfig[] = [];

  for (const field of dynamicFields.data) {
    // Field.name.value is the project_id
    const projectId = field.name.value as string;
    
    // Get the dynamic field object
    const fieldObj = await client.getDynamicFieldObject({
      parentId: vaultId,
      name: {
        type: 'address', // or ID type
        value: projectId,
      },
    });

    const fields = fieldObj.data?.content?.fields;
    allocations.push({
      projectId,
      percentage: Number(fields.percentage),
      totalDonated: BigInt(fields.total_donated),
      lastDonationAt: BigInt(fields.last_donation_at),
    });
  }

  return allocations;
}
```

#### 1.3 Query Projects

```typescript
async function getAllProjects(
  client: SuiClient,
  packageId: string
): Promise<Project[]> {
  // Option A: Query by events
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::project::ProjectCreatedEvent`,
    },
    limit: 50,
  });

  const projects: Project[] = [];

  for (const event of events.data) {
    const projectId = event.parsedJson.project_id;
    
    // Fetch project object
    const projectObj = await client.getObject({
      id: projectId,
      options: { showContent: true },
    });

    const content = projectObj.data?.content?.fields;
    const metadata = content.metadata.fields;
    const financial = content.financial.fields;
    const stats = content.stats.fields;

    projects.push({
      id: projectId,
      title: bytesToString(metadata.title),
      description: bytesToString(metadata.description),
      category: bytesToString(metadata.category),
      imageUrl: bytesToString(metadata.cover_image_url),
      creator: content.creator,
      raisedAmount: BigInt(financial.total_received),
      supporterCount: Number(stats.supporter_count),
    });
  }

  return projects;
}
```

#### 1.4 Query Project Updates (Dynamic Fields)

```typescript
async function getProjectUpdates(
  client: SuiClient,
  projectId: string
): Promise<ProjectUpdate[]> {
  const dynamicFields = await client.getDynamicFields({
    parentId: projectId,
  });

  const updates: ProjectUpdate[] = [];

  for (const field of dynamicFields.data) {
    const updateId = field.name.value as string;
    
    const fieldObj = await client.getDynamicFieldObject({
      parentId: projectId,
      name: {
        type: 'vector<u8>',
        value: Array.from(new TextEncoder().encode(updateId)),
      },
    });

    const fields = fieldObj.data?.content?.fields;
    updates.push({
      id: updateId,
      title: bytesToString(fields.title),
      content: bytesToString(fields.content),
      timestamp: BigInt(fields.timestamp),
      author: fields.author,
    });
  }

  return updates.sort((a, b) => Number(b.timestamp - a.timestamp));
}
```

#### 1.5 Query Platform Stats

```typescript
async function getPlatformStats(
  client: SuiClient,
  platformId: string
): Promise<PlatformStats> {
  const platform = await client.getObject({
    id: platformId,
    options: { showContent: true },
  });

  const fields = platform.data?.content?.fields;

  return {
    totalProjectsCreated: Number(fields.total_projects_created),
    totalVaultsCreated: Number(fields.total_vaults_created),
    totalValueLocked: BigInt(fields.total_value_locked),
    createdAt: BigInt(fields.created_at),
  };
}
```

---

## 🔄 Phase 2: Replace Mock APIs

### Step 1: Update API Routes

將 `/api/dashboard/route.ts` 改為調用 gRPC：

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');

  if (!userAddress) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

  // 1. Get vault
  const vault = await getUserVault(client, userAddress, PACKAGE_ID);
  if (!vault) {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
  }

  // 2. Get allocations
  const allocations = await getVaultAllocations(client, vault.id);

  // 3. Calculate stats
  const balance = Number(vault.balance) / 1_000_000;
  const estimatedAnnualYield = balance * 0.052;
  const donationPool = estimatedAnnualYield * (vault.globalDonationPercentage / 100);

  // 4. Serialize and return
  return NextResponse.json({
    vault: serializeVault(vault),
    allocations: allocations.map(serializeAllocation),
    stats: {
      estimatedAnnualYield: (estimatedAnnualYield * 1_000_000).toString(),
      donationPool: (donationPool * 1_000_000).toString(),
      retainedYield: ((estimatedAnnualYield - donationPool) * 1_000_000).toString(),
      activeProjects: allocations.length,
    },
  });
}
```

### Step 2: Update Hooks

`useVaultDetails.ts` 不需要改動，因為它已經處理了 API 響應的反序列化。

### Step 3: Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_PLATFORM_ID=0x...
NEXT_PUBLIC_USDC_TYPE=0x...
```

---

## 🎯 Helper Functions

```typescript
// Convert bytes to string
function bytesToString(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Serialize BigInt fields
function serializeVault(vault: any): any {
  return {
    ...vault,
    balance: vault.balance.toString(),
    totalDonated: vault.totalDonated.toString(),
    createdAt: vault.createdAt.toString(),
  };
}

function serializeAllocation(allocation: any): any {
  return {
    ...allocation,
    totalDonated: allocation.totalDonated.toString(),
    lastDonationAt: allocation.lastDonationAt.toString(),
  };
}
```

---

## 📝 Migration Checklist

### Immediate (Mock Phase)
- [x] `/api/dashboard` - 提供完整的 vault 和 allocations 數據
- [x] `/api/vault` - 與 dashboard 相同結構
- [x] `/api/projects` - 所有項目列表
- [x] `/api/stats` - 平台統計
- [x] `useVaultDetails` hook - 處理 vault 數據
- [x] `usePlatformStats` hook - 處理平台統計

### Integration Phase (gRPC)
- [ ] Install `@mysten/sui.js` latest version
- [ ] Create `lib/sui/client.ts` - SuiClient singleton
- [ ] Create `lib/sui/queries.ts` - All query functions
- [ ] Update `/api/*` routes to use gRPC
- [ ] Add error handling and retry logic
- [ ] Test with testnet
- [ ] Deploy to mainnet

### Optimization Phase
- [ ] Implement request batching
- [ ] Add GraphQL caching layer (optional)
- [ ] Implement WebSocket for real-time updates
- [ ] Add optimistic updates for better UX

---

## 🚀 Next Steps

1. **完成 Mock 階段**：確保所有 UI 組件都從 API 取得數據
2. **測試合約**：在 testnet 部署並測試所有功能
3. **實作 gRPC 查詢**：按照上述示例實作所有查詢函數
4. **替換 API**：逐步將 Mock API 替換為真實的鏈上查詢
5. **性能優化**：添加緩存、批量查詢等優化
