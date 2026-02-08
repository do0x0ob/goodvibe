# Dashboard 空狀態統一設計

## 🎨 設計目標

統一 Dashboard 中所有空狀態和提示的視覺風格，提供一致的用戶體驗。

---

## 📦 新增組件：EmptyStateCard

位置：`frontend/components/dashboard/EmptyStateCard.tsx`

### 三種變體 (Variants)

#### 1. **Default** - 獨立卡片
完整的卡片樣式，帶虛線邊框，適合作為頁面主內容。

```typescript
<EmptyStateCard
  icon={<svg>...</svg>}
  title="標題"
  description="說明文字"
  actionLabel="按鈕文字"
  onAction={handleAction}
  variant="default"
/>
```

**使用場景：**
- 未連結錢包時的 Dashboard 主頁面

**視覺特點：**
- `bg-surface` 背景
- `border-dashed border-ink-300/30` 虛線邊框
- `py-16` 較大內距
- 圖標 16x16
- 標題 `text-xl`

---

#### 2. **Minimal** - 簡潔樣式
無邊框，適合嵌入在其他容器中。

```typescript
<EmptyStateCard
  icon={<svg>...</svg>}
  title="標題"
  description="說明文字"
  actionLabel="按鈕文字"
  onAction={handleAction}
  variant="minimal"
/>
```

**使用場景：**
- Dashboard 頂部的 "Create Vault" 提示橫幅

**視覺特點：**
- 無背景和邊框
- `py-12` 中等內距
- 圖標 16x16
- 標題 `text-lg`
- 說明文字 `max-w-md`

---

#### 3. **Overlay** - 遮罩樣式
半透明遮罩，覆蓋在已有內容上。

```typescript
<EmptyStateCard
  icon={<svg>...</svg>}
  title="標題"
  description="說明文字"
  actionLabel="按鈕文字"
  onAction={handleAction}
  variant="overlay"
/>
```

**使用場景：**
- 未創建 Vault 時的 Vault Management 卡片遮罩
- 未創建 Vault 時的 Donation Manager 卡片遮罩

**視覺特點：**
- `absolute inset-0` 絕對定位
- `bg-canvas-default/60 backdrop-blur-[2px]` 半透明毛玻璃效果
- `z-10` 置於最上層
- 居中對齊的內容
- 圖標 12x12
- 標題 `text-lg`
- 按鈕 `size="sm"`

---

## 🔄 應用場景

### 1. 未連結錢包
**位置：** Dashboard 主頁面（`?view=dashboard` 且未連結錢包）

**變體：** `default`

**圖標：** 錢包圖標
```tsx
<svg className="w-16 h-16 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
</svg>
```

**文案：**
- 標題：Connect Your Wallet
- 說明：Please connect your Sui wallet to access the Dashboard and manage your donations.
- 按鈕：無（引導用戶使用 Header 的連結錢包功能）

---

### 2. 未創建 Vault - 頂部橫幅
**位置：** Dashboard Overview 頁面頂部

**變體：** `minimal`

**圖標：** 資料夾添加圖標
```tsx
<svg className="w-16 h-16 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
</svg>
```

**文案：**
- 標題：Create Your Vault
- 說明：You don't have a vault yet. Create one to start depositing funds and supporting projects with sustainable yield.
- 按鈕：Create Vault Now (Demo)

---

### 3. 未創建 Vault - Vault Management 遮罩
**位置：** Dashboard Overview → Vault Management 卡片

**變體：** `overlay`

**圖標：** 資料夾添加圖標（同上，但尺寸 12x12）

**文案：**
- 標題：Vault Required
- 說明：Create a vault to deposit funds and manage your yield
- 按鈕：Create Vault (Demo)

**背景內容：**
保留 Vault Management 的 UI 結構（標題、APY、餘額顯示等），但設為 `opacity-60` 並被遮罩覆蓋。

---

### 4. 未創建 Vault - Donation Manager 遮罩
**位置：** Dashboard Overview → Donation Manager 卡片

**變體：** `overlay`

**圖標：** 愛心圖標
```tsx
<svg className="w-12 h-12 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
</svg>
```

**文案：**
- 標題：Vault Required
- 說明：Create a vault to configure your donation allocations
- 按鈕：無（引導用戶先創建 Vault）

**背景內容：**
保留 Donation Manager 的部分 UI（標題），設為 `opacity-60` 並被遮罩覆蓋。

---

## 🎨 設計原則

### 1. **一致的視覺語言**
- 統一的圖標尺寸體系（12x12, 16x16）
- 統一的色彩（`text-ink-300` 圖標，`text-ink-900` 標題，`text-ink-600` 說明）
- 統一的間距系統

### 2. **語境適當的變體**
- **Default**: 頁面級別的空狀態，需要完整的卡片結構
- **Minimal**: 嵌入式提示，輕量級設計
- **Overlay**: 功能區塊的鎖定狀態，保留背景上下文

### 3. **清晰的層次**
```
圖標 (視覺焦點)
  ↓
標題 (主要訊息)
  ↓
說明文字 (補充資訊)
  ↓
行動按鈕 (引導操作)
```

### 4. **友好的文案**
- **標題**：簡潔明瞭，說明當前狀態
- **說明**：提供上下文和解決方案
- **按鈕**：清楚的行動指引

---

## 🔧 技術實現

### 組件 Props

```typescript
interface EmptyStateCardProps {
  icon?: React.ReactNode;          // 自定義圖標（可選）
  title: string;                    // 標題（必填）
  description: string;              // 說明文字（必填）
  actionLabel?: string;             // 按鈕文字（可選）
  onAction?: () => void;            // 按鈕點擊事件（可選）
  isLoading?: boolean;              // 載入狀態（預設 false）
  variant?: 'default' | 'minimal' | 'overlay';  // 變體（預設 'default'）
  className?: string;               // 額外的 CSS 類名（可選）
}
```

### 預設圖標

如果未提供自定義圖標，組件會使用預設的警告圖標：

```tsx
<svg className="w-12 h-12 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
</svg>
```

---

## 📊 Before & After 對比

### Before（不一致的設計）

1. **未連結錢包**
   - 簡單的文字提示，無圖標
   - 不同的邊框樣式

2. **未創建 Vault - 頂部橫幅**
   - 背景色卡片 (`bg-canvas-sand`)
   - 左側圖標 + 右側內容的橫向佈局
   - 與其他空狀態風格不同

3. **未創建 Vault - 功能區塊**
   - 簡單的居中文字提示
   - 無圖標
   - 遮罩背景色不統一

### After（統一的設計）

✅ **所有空狀態都使用 `EmptyStateCard` 組件**
✅ **統一的視覺層次：圖標 → 標題 → 說明 → 按鈕**
✅ **語境適當的變體選擇**
✅ **一致的色彩和間距**
✅ **友好清晰的文案**

---

## 🚀 使用範例

### 在 page.tsx 中使用

```tsx
import { EmptyStateCard } from '@/components/dashboard/EmptyStateCard';

// 未連結錢包
<EmptyStateCard
  icon={walletIcon}
  title="Connect Your Wallet"
  description="Please connect your Sui wallet to access the Dashboard."
  variant="default"
/>

// 未創建 Vault - 頂部提示
<EmptyStateCard
  icon={folderAddIcon}
  title="Create Your Vault"
  description="You don't have a vault yet. Create one to start..."
  actionLabel="Create Vault Now (Demo)"
  onAction={handleCreateMockVault}
  isLoading={isCreatingVault}
  variant="minimal"
/>

// 未創建 Vault - 功能區塊遮罩
<div className="relative min-h-[400px] opacity-60">
  <EmptyStateCard
    icon={folderAddIcon}
    title="Vault Required"
    description="Create a vault to deposit funds"
    actionLabel="Create Vault (Demo)"
    onAction={handleCreateMockVault}
    variant="overlay"
  />
  {/* 背景內容 */}
</div>
```

---

## 📝 維護指南

### 新增空狀態時

1. **選擇合適的變體**
   - 頁面級 → `default`
   - 嵌入式 → `minimal`
   - 遮罩式 → `overlay`

2. **準備圖標**
   - 使用 Heroicons 或相似風格
   - 確保圖標語義相關
   - 設定正確的尺寸

3. **撰寫文案**
   - 標題：當前狀態（2-4 個詞）
   - 說明：問題原因 + 解決方案（1-2 句話）
   - 按鈕：明確的行動指引（2-4 個詞）

4. **測試響應式**
   - 確保在不同螢幕尺寸下正常顯示
   - 檢查文字換行和間距

---

## ✨ 設計亮點

1. **語義化的圖標選擇**
   - 錢包 → 連結錢包
   - 資料夾+ → 創建 Vault
   - 愛心 → 捐贈配置

2. **適當的視覺權重**
   - Overlay 變體使用較小的圖標和按鈕，避免過於突兀
   - Default 變體使用較大的元素，作為主要內容

3. **保留上下文**
   - Overlay 變體保留背景內容，讓用戶了解解鎖後的功能
   - 半透明毛玻璃效果，保持視覺連續性

4. **一致的互動模式**
   - 所有按鈕支持 loading 狀態
   - 統一的按鈕尺寸和樣式
   - 清晰的點擊目標區域

---

## 🎉 總結

通過引入 `EmptyStateCard` 組件並統一 Dashboard 中所有空狀態的設計，我們實現了：

✅ **視覺一致性**：統一的佈局、色彩和間距
✅ **語境適應性**：三種變體滿足不同使用場景
✅ **開發效率**：可複用的組件，減少代碼重複
✅ **用戶體驗**：清晰的引導，友好的提示

這種設計方式不僅提升了當前 Dashboard 的品質，也為未來新增功能提供了標準化的模板。
