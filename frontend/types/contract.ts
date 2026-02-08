// ==================== Platform ====================

/**
 * 平台主對象 - 管理整個 GoodVibe 平台
 */
export interface DonationPlatform {
  id: string;
  admin: string;
  totalProjectsCreated: bigint;
  totalVaultsCreated: bigint;
  totalValueLocked: bigint; // 所有 vault 的總存款
  createdAt: bigint;
}

// ==================== Project ====================

/**
 * 項目對象 - 代表一個籌款項目
 */
export interface Project {
  id: string;
  creator: string;
  title: string;
  description: string;
  category: string;
  coverImageUrl: string;
  totalReceived: bigint; // 累積收到的捐款總額
  supporterCount: number; // 支持者數量
  isActive: boolean; // 項目是否活躍
  createdAt: bigint;
}

/**
 * 項目能力憑證 - 證明對項目的管理權限
 */
export interface ProjectCap {
  id: string;
  projectId: string;
}

/**
 * 項目進度更新 - Dynamic Field
 * Key: update_id (string)
 * Value: ProjectUpdate
 */
export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  timestamp: bigint;
  author: string; // 發布者地址
}

// ==================== Vault ====================

/**
 * 用戶金庫 - 存放 USDC 並產生收益
 */
export interface Vault<T = string> {
  id: string;
  owner: string;
  // Coin<USDC> 存款
  balance: bigint;
  // 全局捐贈設定
  globalDonationPercentage: number; // 0-100，收益的多少比例用於捐贈
  // 項目分配設定 (Dynamic Fields)
  // Key: project_id, Value: AllocationConfig
  allocations: Record<string, AllocationConfig>;
  // 累積統計
  totalDonated: bigint; // 累積捐出的總額
  createdAt: bigint;
}

/**
 * 分配配置 - Dynamic Field Value
 * 定義每個項目在捐贈池中的分配比例
 */
export interface AllocationConfig {
  projectId: string;
  percentage: number; // 0-100，在捐贈池中的分配比例
  totalDonated: bigint; // 累積捐給此項目的總額
  lastDonationAt: bigint; // 上次捐贈時間
}

// ==================== Transaction Types ====================

/**
 * 創建項目的參數
 */
export interface CreateProjectParams {
  title: string;
  description: string;
  category: string;
  coverImageUrl: string;
}

/**
 * 創建 Vault 的參數
 */
export interface CreateVaultParams {
  initialDeposit: bigint; // 初始存款金額 (Coin<USDC>)
}

/**
 * 存款參數
 */
export interface DepositParams {
  vaultId: string;
  amount: bigint; // Coin<USDC>
}

/**
 * 提款參數
 */
export interface WithdrawParams {
  vaultId: string;
  amount: bigint;
}

/**
 * 更新捐贈配置的參數
 */
export interface UpdateDonationConfigParams {
  vaultId: string;
  globalDonationPercentage: number; // 0-100
  allocations: Array<{
    projectId: string;
    percentage: number; // 0-100
  }>;
}

/**
 * 添加項目分配的參數
 */
export interface AddAllocationParams {
  vaultId: string;
  projectId: string;
  percentage: number; // 0-100
}

/**
 * 移除項目分配的參數
 */
export interface RemoveAllocationParams {
  vaultId: string;
  projectId: string;
}

/**
 * 發布項目更新的參數
 */
export interface PostUpdateParams {
  projectCapId: string;
  projectId: string;
  updateId: string; // 唯一 ID，前端生成
  title: string;
  content: string;
}

/**
 * 執行捐贈的參數（從 Vault 收益中分配給項目）
 */
export interface ExecuteDonationParams {
  vaultId: string;
  projectId: string;
  amount: bigint; // 從收益中提取的金額
}

/**
 * 提款到項目創建者的參數
 */
export interface WithdrawFromProjectParams {
  projectCapId: string;
  projectId: string;
  amount: bigint;
}

// ==================== Events ====================

/**
 * 項目創建事件
 */
export interface ProjectCreatedEvent {
  projectId: string;
  creator: string;
  title: string;
  category: string;
  timestamp: bigint;
}

/**
 * Vault 創建事件
 */
export interface VaultCreatedEvent {
  vaultId: string;
  owner: string;
  initialBalance: bigint;
  timestamp: bigint;
}

/**
 * 捐贈執行事件
 */
export interface DonationExecutedEvent {
  vaultId: string;
  projectId: string;
  amount: bigint;
  donor: string;
  timestamp: bigint;
}

/**
 * 項目更新發布事件
 */
export interface UpdatePostedEvent {
  projectId: string;
  updateId: string;
  title: string;
  author: string;
  timestamp: bigint;
}

/**
 * Vault 配置更新事件
 */
export interface ConfigUpdatedEvent {
  vaultId: string;
  globalDonationPercentage: number;
  allocationsCount: number;
  timestamp: bigint;
}

// ==================== Query Results ====================

/**
 * 查詢 Vault 詳情的結果
 */
export interface VaultDetails {
  vault: Vault;
  estimatedAnnualYield: bigint; // 預估年收益 (基於當前 APY)
  donationPool: bigint; // 當前捐贈池大小
  allocatedAmount: bigint; // 已分配的金額
  unallocatedAmount: bigint; // 未分配的金額
  allocations: AllocationWithProject[]; // 包含項目信息的分配列表
}

/**
 * 包含項目信息的分配配置
 */
export interface AllocationWithProject {
  config: AllocationConfig;
  project: Project;
  annualAmount: bigint; // 該項目每年獲得的金額
}

/**
 * 查詢項目詳情的結果
 */
export interface ProjectDetails {
  project: Project;
  updates: ProjectUpdate[]; // 所有進度更新
  recentDonations: DonationRecord[]; // 最近的捐贈記錄
}

/**
 * 捐贈記錄
 */
export interface DonationRecord {
  donor: string;
  amount: bigint;
  timestamp: bigint;
}

// ==================== Utility Types ====================

/**
 * 交易結果
 */
export interface TransactionResult {
  digest: string;
  effects: {
    status: {
      status: 'success' | 'failure';
      error?: string;
    };
    created?: Array<{
      owner: { AddressOwner: string } | { ObjectOwner: string } | { Shared: { initial_shared_version: number } };
      reference: { objectId: string; version: string; digest: string };
    }>;
  };
}

/**
 * 分頁查詢參數
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/**
 * 分頁查詢結果
 */
export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasNextPage: boolean;
}
