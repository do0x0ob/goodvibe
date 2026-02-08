# GoodVibe Smart Contract API Reference

## 📚 模塊概覽

- **platform**: 平台管理和統計
- **project**: 項目創建和管理
- **vault**: 用戶金庫和捐贈配置

---

## 🏢 Platform Module

### Structs

```move
public struct DonationPlatform has key {
    id: UID,
    admin: address,
    total_projects_created: u64,
    total_vaults_created: u64,
    total_value_locked: u64,
    created_at: u64,
}
```

### Functions

#### Read Functions

```move
// Get platform statistics
public fun get_stats(platform: &DonationPlatform): (u64, u64, u64, u64)
// Returns: (total_projects, total_vaults, tvl, created_at)

// Get admin address
public fun get_admin(platform: &DonationPlatform): address
```

---

## 📦 Project Module

### Structs

```move
public struct Project<phantom T> has key {
    id: UID,
    creator: address,
    title: vector<u8>,
    description: vector<u8>,
    category: vector<u8>,
    cover_image_url: vector<u8>,
    balance: Balance<T>,
    total_received: u64,
    supporter_count: u64,
    is_active: bool,
    created_at: u64,
}

public struct ProjectCap has key, store {
    id: UID,
    project_id: ID,
}

public struct ProjectUpdate has store, drop {
    title: vector<u8>,
    content: vector<u8>,
    timestamp: u64,
    author: address,
}
```

### Functions

#### Write Functions

```move
// Create a new project
public fun create_project<T>(
    platform: &mut DonationPlatform,
    title: vector<u8>,
    description: vector<u8>,
    category: vector<u8>,
    cover_image_url: vector<u8>,
    ctx: &mut TxContext
)
// Creates project and transfers ProjectCap to creator

// Receive donation
public fun receive_donation<T>(
    project: &mut Project<T>,
    donation: Coin<T>,
    donor: address,
    ctx: &mut TxContext
)

// Withdraw funds (requires ProjectCap)
public fun withdraw_funds<T>(
    project_cap: &ProjectCap,
    project: &mut Project<T>,
    amount: u64,
    ctx: &mut TxContext
): Coin<T>

// Post progress update (stored as dynamic field)
public fun post_update<T>(
    project_cap: &ProjectCap,
    project: &mut Project<T>,
    update_id: vector<u8>,  // Unique ID for this update
    title: vector<u8>,
    content: vector<u8>,
    ctx: &mut TxContext
)
```

#### Read Functions

```move
// Get project basic info
public fun get_info<T>(project: &Project<T>): (
    address,      // creator
    &vector<u8>,  // title
    &vector<u8>,  // description
    &vector<u8>,  // category
    &vector<u8>,  // cover_image_url
    bool,         // is_active
    u64,          // created_at
)

// Get financial info
public fun get_financial_info<T>(project: &Project<T>): (u64, u64, u64)
// Returns: (balance, total_received, supporter_count)

// Get specific update
public fun get_update<T>(project: &Project<T>, update_id: vector<u8>): &ProjectUpdate

// Check if update exists
public fun has_update<T>(project: &Project<T>, update_id: vector<u8>): bool

// Get update details
public fun get_update_details(update: &ProjectUpdate): (&vector<u8>, &vector<u8>, u64, address)
// Returns: (title, content, timestamp, author)
```

### Events

```move
public struct ProjectCreatedEvent has copy, drop {
    project_id: ID,
    creator: address,
    title: vector<u8>,
    category: vector<u8>,
    timestamp: u64,
}

public struct DonationReceivedEvent has copy, drop {
    project_id: ID,
    donor: address,
    amount: u64,
    timestamp: u64,
}

public struct UpdatePostedEvent has copy, drop {
    project_id: ID,
    update_id: vector<u8>,
    title: vector<u8>,
    author: address,
    timestamp: u64,
}

public struct FundsWithdrawnEvent has copy, drop {
    project_id: ID,
    amount: u64,
    recipient: address,
    timestamp: u64,
}
```

---

## 💰 Vault Module

### Structs

```move
public struct Vault<phantom T> has key {
    id: UID,
    owner: address,
    balance: Balance<T>,
    global_donation_percentage: u8,  // 0-100
    total_donated: u64,
    created_at: u64,
}

// Stored as dynamic field with key = project_id (ID)
public struct AllocationConfig has store, drop {
    percentage: u8,           // 0-100, % of donation pool
    total_donated: u64,
    last_donation_at: u64,
}
```

### Functions

#### Write Functions

```move
// Create vault with initial deposit
public fun create_vault<T>(
    platform: &mut DonationPlatform,
    initial_deposit: Coin<T>,
    ctx: &mut TxContext
): ID
// Returns vault_id

// Deposit funds
public fun deposit<T>(
    vault: &mut Vault<T>,
    platform: &mut DonationPlatform,
    coin: Coin<T>,
    ctx: &mut TxContext
)

// Withdraw funds
public fun withdraw<T>(
    vault: &mut Vault<T>,
    platform: &mut DonationPlatform,
    amount: u64,
    ctx: &mut TxContext
): Coin<T>

// ===== Donation Configuration =====

// Update global donation percentage (0-100)
public fun update_global_percentage<T>(
    vault: &mut Vault<T>,
    percentage: u8,
    ctx: &mut TxContext
)

// Add or update project allocation
public fun add_allocation<T>(
    vault: &mut Vault<T>,
    project_id: ID,
    percentage: u8,  // 0-100, % of donation pool
    ctx: &mut TxContext
)

// Update existing allocation
public fun update_allocation<T>(
    vault: &mut Vault<T>,
    project_id: ID,
    percentage: u8,
    ctx: &mut TxContext
)

// Remove project allocation
public fun remove_allocation<T>(
    vault: &mut Vault<T>,
    project_id: ID,
    ctx: &mut TxContext
)

// Batch update: recommended for frontend
public fun update_donation_config<T>(
    vault: &mut Vault<T>,
    global_percentage: u8,              // 0-100
    project_ids: vector<ID>,
    percentages: vector<u8>,            // Must sum to 100
    ctx: &mut TxContext
)
// Example:
// global_percentage = 50 (50% of yield)
// project_ids = [id1, id2, id3]
// percentages = [40, 35, 25] (must sum to 100)

// Execute donation from yield to project
public fun execute_donation<T>(
    vault: &mut Vault<T>,
    project: &mut Project<T>,
    project_id: ID,
    yield_amount: Coin<T>,
    ctx: &mut TxContext
)
```

#### Read Functions

```move
// Get vault basic info
public fun get_info<T>(vault: &Vault<T>): (address, u64, u8, u64, u64)
// Returns: (owner, balance, global_percentage, total_donated, created_at)

// Get allocation for a project
public fun get_allocation<T>(vault: &Vault<T>, project_id: ID): &AllocationConfig

// Check if allocation exists
public fun has_allocation<T>(vault: &Vault<T>, project_id: ID): bool

// Get allocation details
public fun get_allocation_details(config: &AllocationConfig): (u8, u64, u64)
// Returns: (percentage, total_donated, last_donation_at)

// Calculate donation pool based on balance and APY
public fun calculate_donation_pool<T>(vault: &Vault<T>, apy_basis_points: u64): u64
// Example: apy_basis_points = 520 for 5.2% APY
```

### Events

```move
public struct VaultCreatedEvent has copy, drop {
    vault_id: ID,
    owner: address,
    initial_balance: u64,
    timestamp: u64,
}

public struct DepositEvent has copy, drop {
    vault_id: ID,
    amount: u64,
    new_balance: u64,
    timestamp: u64,
}

public struct WithdrawalEvent has copy, drop {
    vault_id: ID,
    amount: u64,
    new_balance: u64,
    timestamp: u64,
}

public struct ConfigUpdatedEvent has copy, drop {
    vault_id: ID,
    global_donation_percentage: u8,
    allocations_count: u64,
    timestamp: u64,
}

public struct DonationExecutedEvent has copy, drop {
    vault_id: ID,
    project_id: ID,
    amount: u64,
    donor: address,
    timestamp: u64,
}
```

---

## 🔄 典型使用流程

### 1. 創建項目

```typescript
// Frontend call
const tx = new TransactionBlock();
tx.moveCall({
  target: `${PACKAGE_ID}::project::create_project`,
  arguments: [
    tx.object(PLATFORM_ID),
    tx.pure(stringToBytes('Project Title')),
    tx.pure(stringToBytes('Description')),
    tx.pure(stringToBytes('Environment')),
    tx.pure(stringToBytes('https://...')),
  ],
  typeArguments: [USDC_TYPE],
});
```

### 2. 創建 Vault

```typescript
const tx = new TransactionBlock();
const [coin] = tx.splitCoins(tx.gas, [tx.pure(initialAmount)]);
tx.moveCall({
  target: `${PACKAGE_ID}::vault::create_vault`,
  arguments: [
    tx.object(PLATFORM_ID),
    coin,
  ],
  typeArguments: [USDC_TYPE],
});
```

### 3. 配置捐贈（兩階段）

```typescript
// Set: 50% of yield, distributed as: 40%, 35%, 25% to 3 projects
const tx = new TransactionBlock();
tx.moveCall({
  target: `${PACKAGE_ID}::vault::update_donation_config`,
  arguments: [
    tx.object(vaultId),
    tx.pure(50), // global percentage
    tx.pure([projectId1, projectId2, projectId3]),
    tx.pure([40, 35, 25]), // must sum to 100
  ],
  typeArguments: [USDC_TYPE],
});
```

### 4. 發布項目更新

```typescript
const tx = new TransactionBlock();
tx.moveCall({
  target: `${PACKAGE_ID}::project::post_update`,
  arguments: [
    tx.object(projectCapId),
    tx.object(projectId),
    tx.pure(stringToBytes(updateId)), // unique ID
    tx.pure(stringToBytes('Update Title')),
    tx.pure(stringToBytes('Update content...')),
  ],
  typeArguments: [USDC_TYPE],
});
```

### 5. 查詢項目更新

```typescript
// Query dynamic field
const update = await client.getDynamicFieldObject({
  parentId: projectId,
  name: {
    type: 'vector<u8>',
    value: Array.from(new TextEncoder().encode(updateId)),
  },
});
```

---

## 🔑 Error Codes

### Project Module
- `0`: Invalid ProjectCap
- `1`: Insufficient balance

### Vault Module
- `0`: Not owner
- `1`: Insufficient balance
- `2`: Invalid percentage
- `3`: Allocation not found
- `4`: Length mismatch
- `5`: Total percentage not 100
- `6`: Zero donation
- `7`: Insufficient yield

---

## 📊 兩階段捐贈邏輯示例

```
Vault Balance: $10,000
APY: 5.2%
Annual Yield: $520

Stage 1: Global Setting
  global_donation_percentage = 50%
  → Donation Pool = $520 × 50% = $260
  → Retained Yield = $260

Stage 2: Project Allocation (must sum to 100%)
  Project A: 40% → $260 × 40% = $104
  Project B: 35% → $260 × 35% = $91
  Project C: 25% → $260 × 25% = $65
  Total: 100% = $260
```
