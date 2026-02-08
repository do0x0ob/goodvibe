/// Project module - Manages crowdfunding projects and progress updates
module goodvibe::project;

use sui::coin::Coin;
use sui::balance::{Self, Balance};
use sui::event;
use sui::dynamic_field as df;
use goodvibe::platform::{Self, DonationPlatform};

// ==================== Structs ====================

/// Project metadata - descriptive information
public struct ProjectMetadata has store {
    title: vector<u8>,
    description: vector<u8>,
    category: vector<u8>,
    cover_image_url: vector<u8>,
}

/// Project financial data
public struct ProjectFinancial<phantom T> has store {
    balance: Balance<T>,
    total_received: u64,
}

/// Project statistics
public struct ProjectStats has store {
    supporter_count: u64,
    is_active: bool,
    created_at: u64,
}

/// Project - a crowdfunding initiative
public struct Project<phantom T> has key {
    id: UID,
    creator: address,
    metadata: ProjectMetadata,
    financial: ProjectFinancial<T>,
    stats: ProjectStats,
}

/// Project capability - proves ownership and管理權限
public struct ProjectCap has key, store {
    id: UID,
    project_id: ID,
}

/// Project update - stored as dynamic field
/// Key: update_id (vector<u8>)
public struct ProjectUpdate has store, drop {
    title: vector<u8>,
    content: vector<u8>,
    timestamp: u64,
    author: address,
}

// ==================== Events ====================

/// Event: Project created
public struct ProjectCreatedEvent has copy, drop {
    project_id: ID,
    creator: address,
    title: vector<u8>,
    category: vector<u8>,
    timestamp: u64,
}

/// Event: Donation received
public struct DonationReceivedEvent has copy, drop {
    project_id: ID,
    donor: address,
    amount: u64,
    timestamp: u64,
}

/// Event: Project update posted
public struct UpdatePostedEvent has copy, drop {
    project_id: ID,
    update_id: vector<u8>,
    title: vector<u8>,
    author: address,
    timestamp: u64,
}

/// Event: Funds withdrawn from project
public struct FundsWithdrawnEvent has copy, drop {
    project_id: ID,
    amount: u64,
    recipient: address,
    timestamp: u64,
}

// ==================== Core Functions ====================

/// Create a new project
#[allow(lint(self_transfer))]
public fun create_project<T>(
    platform: &mut DonationPlatform,
    title: vector<u8>,
    description: vector<u8>,
    category: vector<u8>,
    cover_image_url: vector<u8>,
    ctx: &mut TxContext
) {
    let project_uid = object::new(ctx);
    let project_id = object::uid_to_inner(&project_uid);
    let sender = ctx.sender();
    let timestamp = ctx.epoch_timestamp_ms();
    
    let project = Project<T> {
        id: project_uid,
        creator: sender,
        metadata: ProjectMetadata {
            title,
            description,
            category,
            cover_image_url,
        },
        financial: ProjectFinancial {
            balance: balance::zero(),
            total_received: 0,
        },
        stats: ProjectStats {
            supporter_count: 0,
            is_active: true,
            created_at: timestamp,
        },
    };
    
    let cap = ProjectCap {
        id: object::new(ctx),
        project_id,
    };
    
    platform::increment_project_count(platform);
    
    event::emit(ProjectCreatedEvent {
        project_id,
        creator: sender,
        title: project.metadata.title,
        category: project.metadata.category,
        timestamp,
    });
    
    transfer::share_object(project);
    transfer::transfer(cap, sender);
}

/// Receive donation to project
public fun receive_donation<T>(
    project: &mut Project<T>,
    donation: Coin<T>,
    donor: address,
    ctx: &mut TxContext
) {
    let amount = donation.value();
    project.financial.total_received = project.financial.total_received + amount;
    project.stats.supporter_count = project.stats.supporter_count + 1;
    project.financial.balance.join(donation.into_balance());
    
    event::emit(DonationReceivedEvent {
        project_id: object::id(project),
        donor,
        amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// Withdraw funds from project (requires ProjectCap)
public fun withdraw_funds<T>(
    project_cap: &ProjectCap,
    project: &mut Project<T>,
    amount: u64,
    ctx: &mut TxContext
): Coin<T> {
    assert!(project_cap.project_id == object::id(project), EInvalidProjectCap);
    assert!(project.financial.balance.value() >= amount, EInsufficientBalance);
    
    let withdrawn = sui::coin::from_balance(project.financial.balance.split(amount), ctx);
    
    event::emit(FundsWithdrawnEvent {
        project_id: object::id(project),
        amount,
        recipient: ctx.sender(),
        timestamp: ctx.epoch_timestamp_ms(),
    });
    
    withdrawn
}

/// Post a progress update (stored as dynamic field)
public fun post_update<T>(
    project_cap: &ProjectCap,
    project: &mut Project<T>,
    update_id: vector<u8>,
    title: vector<u8>,
    content: vector<u8>,
    ctx: &mut TxContext
) {
    assert!(project_cap.project_id == object::id(project), EInvalidProjectCap);
    
    let timestamp = ctx.epoch_timestamp_ms();
    let author = ctx.sender();
    
    let update = ProjectUpdate {
        title,
        content,
        timestamp,
        author,
    };
    
    // Store as dynamic field
    df::add(&mut project.id, update_id, update);
    
    event::emit(UpdatePostedEvent {
        project_id: object::id(project),
        update_id,
        title: update.title,
        author,
        timestamp,
    });
}

// ==================== Public Read Functions ====================

/// Get project basic info
public fun get_info<T>(project: &Project<T>): (
    address, // creator
    &vector<u8>, // title
    &vector<u8>, // description
    &vector<u8>, // category
    &vector<u8>, // cover_image_url
    bool, // is_active
    u64, // created_at
) {
    (
        project.creator,
        &project.metadata.title,
        &project.metadata.description,
        &project.metadata.category,
        &project.metadata.cover_image_url,
        project.stats.is_active,
        project.stats.created_at
    )
}

/// Get project financial info
public fun get_financial_info<T>(project: &Project<T>): (u64, u64, u64) {
    (
        project.financial.balance.value(),
        project.financial.total_received,
        project.stats.supporter_count
    )
}

/// Get a specific update (dynamic field)
public fun get_update<T>(project: &Project<T>, update_id: vector<u8>): &ProjectUpdate {
    df::borrow(&project.id, update_id)
}

/// Check if update exists
public fun has_update<T>(project: &Project<T>, update_id: vector<u8>): bool {
    df::exists_(&project.id, update_id)
}

/// Get update details
public fun get_update_details(update: &ProjectUpdate): (&vector<u8>, &vector<u8>, u64, address) {
    (&update.title, &update.content, update.timestamp, update.author)
}

// ==================== Error Codes ====================

const EInvalidProjectCap: u64 = 0;
const EInsufficientBalance: u64 = 1;

// ==================== Tests ====================

#[test_only]
public fun create_project_for_testing<T>(
    platform: &mut DonationPlatform,
    ctx: &mut TxContext
) {
    create_project<T>(
        platform,
        b"Test Project",
        b"Test Description",
        b"Test Category",
        b"https://test.com/image.jpg",
        ctx
    );
}
