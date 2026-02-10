/// Vault module - Manages user vaults with automated yield-based donations
module goodvibe::vault;

use sui::coin::{Self, Coin};
use sui::balance::Balance;
use sui::event;
use sui::dynamic_field as df;
use goodvibe::platform::{Self, DonationPlatform};
use goodvibe::project::{Self, Project};

// ==================== Structs ====================

/// User vault for deposits and donation management
public struct Vault<phantom T> has key {
    id: UID,
    owner: address,
    balance: Balance<T>,
    global_donation_percentage: u8, // 0-100, percentage of yield to donate
    total_donated: u64,
    created_at: u64,
}

/// Allocation configuration - stored as dynamic field
/// Key: project_id (ID)
public struct AllocationConfig has store, drop {
    percentage: u8, // 0-100, percentage of donation pool
    total_donated: u64,
    last_donation_at: u64,
}

// ==================== Events ====================

/// Event: Vault created
public struct VaultCreatedEvent has copy, drop {
    vault_id: ID,
    owner: address,
    initial_balance: u64,
    timestamp: u64,
}

/// Event: Deposit made
public struct DepositEvent has copy, drop {
    vault_id: ID,
    amount: u64,
    new_balance: u64,
    timestamp: u64,
}

/// Event: Withdrawal made
public struct WithdrawalEvent has copy, drop {
    vault_id: ID,
    amount: u64,
    new_balance: u64,
    timestamp: u64,
}

/// Event: Donation configuration updated
public struct ConfigUpdatedEvent has copy, drop {
    vault_id: ID,
    global_donation_percentage: u8,
    allocations_count: u64,
    timestamp: u64,
}

/// Event: Donation executed
public struct DonationExecutedEvent has copy, drop {
    vault_id: ID,
    project_id: ID,
    amount: u64,
    donor: address,
    timestamp: u64,
}

// ==================== Core Functions ====================

/// Create a new vault
public fun create_vault<T>(
    platform: &mut DonationPlatform,
    initial_deposit: Coin<T>,
    ctx: &mut TxContext
): ID {
    let sender = ctx.sender();
    let timestamp = ctx.epoch_timestamp_ms();
    let amount = initial_deposit.value();
    
    let vault_uid = object::new(ctx);
    let vault_id = object::uid_to_inner(&vault_uid);
    
    let vault = Vault<T> {
        id: vault_uid,
        owner: sender,
        balance: initial_deposit.into_balance(),
        global_donation_percentage: 0,
        total_donated: 0,
        created_at: timestamp,
    };
    
    platform::increment_vault_count(platform);
    platform::add_to_tvl(platform, amount);
    
    event::emit(VaultCreatedEvent {
        vault_id,
        owner: sender,
        initial_balance: amount,
        timestamp,
    });
    
    transfer::transfer(vault, sender);
    vault_id
}

/// Deposit funds into vault
public fun deposit<T>(
    vault: &mut Vault<T>,
    platform: &mut DonationPlatform,
    coin: Coin<T>,
    ctx: &mut TxContext
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    
    let amount = coin.value();
    vault.balance.join(coin.into_balance());
    platform::add_to_tvl(platform, amount);
    
    event::emit(DepositEvent {
        vault_id: object::id(vault),
        amount,
        new_balance: vault.balance.value(),
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// Withdraw funds from vault
public fun withdraw<T>(
    vault: &mut Vault<T>,
    platform: &mut DonationPlatform,
    amount: u64,
    ctx: &mut TxContext
): Coin<T> {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    assert!(vault.balance.value() >= amount, EInsufficientBalance);
    
    platform::subtract_from_tvl(platform, amount);
    let withdrawn = coin::from_balance(vault.balance.split(amount), ctx);
    
    event::emit(WithdrawalEvent {
        vault_id: object::id(vault),
        amount,
        new_balance: vault.balance.value(),
        timestamp: ctx.epoch_timestamp_ms(),
    });
    
    withdrawn
}

// ==================== Donation Configuration ====================

/// Update global donation percentage
public fun update_global_percentage<T>(
    vault: &mut Vault<T>,
    percentage: u8,
    ctx: &mut TxContext
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    assert!(percentage <= 100, EInvalidPercentage);
    
    vault.global_donation_percentage = percentage;
}

/// Add or update project allocation
public fun add_allocation<T>(
    vault: &mut Vault<T>,
    project_id: ID,
    percentage: u8,
    ctx: &mut TxContext
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    assert!(percentage <= 100, EInvalidPercentage);
    
    let config = AllocationConfig {
        percentage,
        total_donated: 0,
        last_donation_at: 0,
    };
    
    // If exists, remove old one first
    if (df::exists_(&vault.id, project_id)) {
        df::remove<ID, AllocationConfig>(&mut vault.id, project_id);
    };
    
    df::add(&mut vault.id, project_id, config);
}

/// Update existing allocation percentage
public fun update_allocation<T>(
    vault: &mut Vault<T>,
    project_id: ID,
    percentage: u8,
    ctx: &mut TxContext
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    assert!(percentage <= 100, EInvalidPercentage);
    assert!(df::exists_(&vault.id, project_id), EAllocationNotFound);
    
    let config = df::borrow_mut<ID, AllocationConfig>(&mut vault.id, project_id);
    config.percentage = percentage;
}

/// Remove project allocation
public fun remove_allocation<T>(
    vault: &mut Vault<T>,
    project_id: ID,
    ctx: &mut TxContext
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    assert!(df::exists_(&vault.id, project_id), EAllocationNotFound);
    
    df::remove<ID, AllocationConfig>(&mut vault.id, project_id);
}

/// Batch update: set global percentage and multiple allocations
/// This is the primary function for updating donation config
public fun update_donation_config<T>(
    vault: &mut Vault<T>,
    global_percentage: u8,
    project_ids: vector<ID>,
    percentages: vector<u8>,
    ctx: &mut TxContext
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    assert!(global_percentage <= 100, EInvalidPercentage);
    assert!(project_ids.length() == percentages.length(), ELengthMismatch);
    
    // Validate total percentage = 100
    let mut total = 0u64;
    let mut i = 0;
    while (i < percentages.length()) {
        total = total + (percentages[i] as u64);
        i = i + 1;
    };
    assert!(total == 100, ETotalPercentageNotHundred);
    
    // Update global percentage
    vault.global_donation_percentage = global_percentage;
    
    // Clear existing allocations and add new ones
    // Note: In production, might want to preserve historical data
    let mut j = 0;
    while (j < project_ids.length()) {
        let project_id = project_ids[j];
        let percentage = percentages[j];
        
        if (df::exists_(&vault.id, project_id)) {
            let config = df::borrow_mut<ID, AllocationConfig>(&mut vault.id, project_id);
            config.percentage = percentage;
        } else {
            let config = AllocationConfig {
                percentage,
                total_donated: 0,
                last_donation_at: 0,
            };
            df::add(&mut vault.id, project_id, config);
        };
        
        j = j + 1;
    };
    
    event::emit(ConfigUpdatedEvent {
        vault_id: object::id(vault),
        global_donation_percentage: global_percentage,
        allocations_count: project_ids.length(),
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

// ==================== Donation Execution ====================

/// Execute donation from yield to a specific project
/// This function is called when yield is distributed
public fun execute_donation<T>(
    vault: &mut Vault<T>,
    project: &mut Project<T>,
    project_id: ID,
    mut yield_amount: Coin<T>,
    ctx: &mut TxContext
) {
    assert!(vault.owner == ctx.sender(), ENotOwner);
    assert!(df::exists_(&vault.id, project_id), EAllocationNotFound);
    
    let total_yield = yield_amount.value();
    
    // Calculate donation amount based on two-stage logic
    let donation_pool = (total_yield * (vault.global_donation_percentage as u64)) / 100;
    
    let config = df::borrow_mut<ID, AllocationConfig>(&mut vault.id, project_id);
    let donation_amount = (donation_pool * (config.percentage as u64)) / 100;
    
    assert!(donation_amount > 0, EZeroDonation);
    assert!(donation_amount <= total_yield, EInsufficientYield);
    
    // Split the donation amount from yield
    let donation_coin = coin::split(&mut yield_amount, donation_amount, ctx);
    
    // Update statistics
    vault.total_donated = vault.total_donated + donation_amount;
    config.total_donated = config.total_donated + donation_amount;
    config.last_donation_at = ctx.epoch_timestamp_ms();
    
    // Send donation to project
    // Note: This function needs to be updated to use donate_yield instead
    // project::receive_donation(project, donation_coin, vault.owner, ctx);
    project::donate_yield(project, donation_coin, ctx);
    
    // Return remaining yield to vault
    vault.balance.join(yield_amount.into_balance());
    
    event::emit(DonationExecutedEvent {
        vault_id: object::id(vault),
        project_id,
        amount: donation_amount,
        donor: vault.owner,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

// ==================== Public Read Functions ====================

/// Get vault basic info
public fun get_info<T>(vault: &Vault<T>): (address, u64, u8, u64, u64) {
    (
        vault.owner,
        vault.balance.value(),
        vault.global_donation_percentage,
        vault.total_donated,
        vault.created_at
    )
}

/// Get allocation config for a project
public fun get_allocation<T>(vault: &Vault<T>, project_id: ID): &AllocationConfig {
    df::borrow(&vault.id, project_id)
}

/// Check if allocation exists
public fun has_allocation<T>(vault: &Vault<T>, project_id: ID): bool {
    df::exists_(&vault.id, project_id)
}

/// Get allocation details
public fun get_allocation_details(config: &AllocationConfig): (u8, u64, u64) {
    (config.percentage, config.total_donated, config.last_donation_at)
}

// ==================== Helper Functions ====================

/// Calculate estimated donation pool based on balance and APY
public fun calculate_donation_pool<T>(vault: &Vault<T>, apy_basis_points: u64): u64 {
    let balance = vault.balance.value();
    let annual_yield = (balance * apy_basis_points) / 10000;
    (annual_yield * (vault.global_donation_percentage as u64)) / 100
}

// ==================== Error Codes ====================

const ENotOwner: u64 = 0;
const EInsufficientBalance: u64 = 1;
const EInvalidPercentage: u64 = 2;
const EAllocationNotFound: u64 = 3;
const ELengthMismatch: u64 = 4;
const ETotalPercentageNotHundred: u64 = 5;
const EZeroDonation: u64 = 6;
const EInsufficientYield: u64 = 7;

// ==================== Tests ====================

#[test_only]
public fun create_vault_for_testing<T>(
    platform: &mut DonationPlatform,
    initial_deposit: Coin<T>,
    ctx: &mut TxContext
): ID {
    create_vault(platform, initial_deposit, ctx)
}
