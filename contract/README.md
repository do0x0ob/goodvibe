# StableGive Smart Contracts

模組化 Move 智能合約，用於去中心化捐贈平台。

## 模組結構

```
contract/sources/
├── platform.move  - 平台管理和全局統計
├── project.move   - 項目創建和資金管理
├── vault.move     - 用戶金庫和自動捐贈
└── donation.move  - 捐贈記錄管理
```

## 快速開始

```bash
# 編譯
sui move build

# 測試
sui move test

# 部署
sui client publish --gas-budget 100000000
```

## 主要功能

**Platform** - 平台初始化、統計追蹤  
**Project** - 創建項目、接收捐款、提取資金、發布更新  
**Vault** - 創建金庫、存款/提款、配置捐贈比例、分配收益  
**Donation** - 記錄捐贈、查詢歷史

## 技術特性

- Move 2024.beta 語法
- 模組化架構，職責分明
- 泛型支援多種代幣
- 完整的事件發送
- ProjectCap 權限控制
- 餘額和百分比驗證
