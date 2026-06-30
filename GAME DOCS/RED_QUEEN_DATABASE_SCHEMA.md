```md
# RED QUEEN: OPERATIONS

# Database Schema

Version 1.0

---

# Overview

This document defines the complete database architecture for Red Queen: Operations.

The database serves as the single source of truth for all persistent game data.

Every gameplay system interacts with the database through clearly defined relationships.

The schema is designed to be modular, scalable, and optimized for future expansion.

---

# Database Principles

The database follows several core principles.

- One source of truth.
- Normalized structure.
- Server-authoritative data.
- Explicit relationships.
- Minimal redundancy.
- Scalable architecture.
- Secure by default.

Every table should have a single responsibility.

---

# Naming Conventions

Tables

Plural

Example:

profiles

operations

equipment

inventory

---

Primary Keys

id

UUID

---

Foreign Keys

profile_id

operation_id

equipment_id

role_id

class_id

faction_id

---

Timestamps

created_at

updated_at

---

Soft Delete

deleted_at

Used only when recovery is required.

Gameplay history should never be permanently deleted.

---

# Core Schema

Version 1 contains the following primary tables.

Authentication

↓

Profiles

↓

BIO Score

↓

Factions

↓

Classes

↓

Roles

↓

Equipment

↓

Inventory

↓

Operations

↓

Operation History

↓

Arena Matches

↓

Marketplace

↓

Rewards

↓

Achievements

↓

Assets

↓

Notifications

↓

Settings
```


```md
# PART I — PROFILES

---

# Purpose

The Profiles table represents the primary identity of every SOLvivor.

Each authenticated wallet owns exactly one profile.

Every gameplay system references this table.

---

# Table

profiles

---

# Primary Key

id (UUID)

---

# Fields

id

wallet_address

username

display_name

avatar_url

bio_score

level

experience

faction_id

class_id

active_role_id

status

is_onboarded

last_login_at

created_at

updated_at

---

# Field Definitions

id

Unique internal identifier.

---

wallet_address

Unique Solana wallet address.

Used for authentication.

Cannot be changed.

---

username

Unique player username.

Visible throughout the platform.

---

display_name

Player nickname.

May be changed.

---

avatar_url

Current profile avatar.

Stored in Supabase Storage.

---

bio_score

Current BIO SCORE.

Automatically updated through gameplay.

---

level

Current SOLvivor level.

Derived from experience.

---

experience

Current accumulated experience.

Used for progression.

---

faction_id

References:

factions.id

Each profile belongs to one Faction.

---

class_id

References:

classes.id

Current active Class.

---

active_role_id

References:

roles.id

Current operational Role.

Recommended by Red Queen.

May be changed by the player.

---

status

Current account status.

Examples:

ACTIVE

SUSPENDED

BANNED

---

is_onboarded

Indicates whether the Initial Assessment has been completed.

---

last_login_at

Timestamp of the player's most recent login.

---

created_at

Profile creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

profiles

↓

factions

↓

classes

↓

roles

↓

inventory

↓

operation_history

↓

arena_matches

↓

notifications

↓

settings

---

# Constraints

wallet_address

UNIQUE

NOT NULL

---

username

UNIQUE

NOT NULL

---

bio_score

DEFAULT 0

---

level

DEFAULT 1

---

experience

DEFAULT 0

---

status

DEFAULT ACTIVE

---

is_onboarded

DEFAULT FALSE

---

# Indexes

wallet_address

username

bio_score

faction_id

class_id

active_role_id

---

# Row Level Security

Players may:

- read their own profile;
- update their own profile;
- never modify protected progression values directly.

Gameplay systems update progression through backend services only.

---

# Design Goals

The Profiles table represents the foundation of the entire ecosystem.

Every gameplay system should reference Profiles rather than duplicating player information.
```


```md
# PART III — FACTIONS

---

# Purpose

The Factions table defines the major organizations operating within the Red Queen ecosystem.

Factions represent identity, philosophy, and long-term progression.

Faction selection influences narrative, visual identity, future content, and recommendations.

Factions do not provide direct statistical advantages.

---

# Table

factions

---

# Primary Key

id (UUID)

---

# Fields

id

name

slug

description

philosophy

logo_url

banner_url

primary_color

secondary_color

headquarters

status

created_at

updated_at

---

# Field Definitions

id

Unique faction identifier.

---

name

Official faction name.

Examples:

- Vanguard
- Citadel
- Helix
- Eclipse
- Nomads
- Ghost Division
- Aegis
- Horizon

---

slug

Unique internal identifier.

Example:

ghost-division

---

description

Short faction description displayed to players.

---

philosophy

Defines the faction's operational doctrine.

Used by Red Queen when introducing the faction.

---

logo_url

Faction logo stored in Supabase Storage.

---

banner_url

Faction artwork.

---

primary_color

Primary interface accent color.

---

secondary_color

Secondary accent color.

---

headquarters

Primary operational headquarters.

Used for lore and future world expansion.

---

status

ACTIVE

INACTIVE

ARCHIVED

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

factions

↓

profiles

↓

operations

↓

future_events

---

# Constraints

name

UNIQUE

NOT NULL

---

slug

UNIQUE

NOT NULL

---

status

DEFAULT ACTIVE

---

# Indexes

name

slug

status

---

# Seed Data

Version 1 includes:

- Vanguard
- Citadel
- Helix
- Eclipse
- Nomads
- Ghost Division
- Aegis
- Horizon

---

# Row Level Security

Faction data is public.

Players may read faction information.

Only administrators may modify faction records.

---

# Design Goals

Factions should function as persistent world organizations rather than gameplay classes.

Their primary purpose is to strengthen player identity, world building, and long-term ecosystem expansion while maintaining gameplay balance.
```
```md
# PART IV — CLASSES

---

# Purpose

The Classes table defines the primary professional specialization of every SOLvivor.

A Class determines the player's operational discipline, available abilities, equipment preferences, and long-term progression.

Each SOLvivor belongs to one active Class at a time.

---

# Table

classes

---

# Primary Key

id (UUID)

---

# Fields

id

name

slug

description

icon_url

active_ability

equipment_focus

difficulty

status

created_at

updated_at

---

# Field Definitions

id

Unique Class identifier.

---

name

Official Class name.

---

slug

Unique internal identifier.

Example:

recon

---

description

Short gameplay description.

---

icon_url

Class icon stored in Supabase Storage.

---

active_ability

Primary active ability available to this Class.

---

equipment_focus

Preferred equipment category.

Examples:

- Assault
- Medical
- Engineering
- Recon
- Scientific
- Support

---

difficulty

Beginner

Intermediate

Advanced

---

status

ACTIVE

INACTIVE

ARCHIVED

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

classes

↓

profiles

↓

roles

↓

equipment

↓

operations

---

# Constraints

name

UNIQUE

NOT NULL

---

slug

UNIQUE

NOT NULL

---

status

DEFAULT ACTIVE

---

# Seed Data

Version 1 includes:

- Assault
- Recon
- Engineer
- Medic
- Scientist
- Specialist

---

# Indexes

name

slug

status

---

# Row Level Security

Class data is public.

Players may read all Class information.

Only administrators may modify Class records.

---

# Design Goals

Classes define a SOLvivor's profession rather than their identity.

They determine gameplay style, available abilities, equipment preferences, and progression while remaining flexible enough for future expansion.
```
```md
# PART V — ROLES

---

# Purpose

The Roles table defines tactical specializations within each Class.

Roles refine gameplay by providing passive bonuses, operational focus, and AI recommendations without changing the player's core Class.

Every Role belongs to exactly one Class.

A SOLvivor may unlock multiple Roles but can have only one Active Role at a time.

---

# Table

roles

---

# Primary Key

id (UUID)

---

# Fields

id

class_id

name

slug

description

passive_bonus

recommended_equipment

difficulty

status

created_at

updated_at

---

# Field Definitions

id

Unique Role identifier.

---

class_id

References:

classes.id

Every Role belongs to one Class.

---

name

Official Role name.

---

slug

Unique internal identifier.

Example:

drone-operator

---

description

Short gameplay description.

---

passive_bonus

Primary passive gameplay modifier.

---

recommended_equipment

Suggested equipment category.

---

difficulty

Beginner

Intermediate

Advanced

---

status

ACTIVE

INACTIVE

ARCHIVED

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

roles

↓

classes

↓

profiles

↓

player_roles

↓

equipment

---

# Constraints

class_id

NOT NULL

---

name

UNIQUE

NOT NULL

---

slug

UNIQUE

NOT NULL

---

status

DEFAULT ACTIVE

---

# Seed Data

Version 1 includes 28 operational Roles distributed across the six core Classes.

The complete Role catalogue is maintained separately and may expand without requiring database changes.

---

# Indexes

class_id

name

slug

status

---

# Row Level Security

Role definitions are public.

Players may read all available Roles.

Only administrators may create, update, or archive Roles.

---

# Design Goals

Roles provide tactical depth without increasing system complexity.

Red Queen may recommend Roles based on operational performance, while players always retain the freedom to select their preferred Active Role.
```

```md
# PART VI — EQUIPMENT

---

# Purpose

The Equipment table defines every usable gameplay item available within the Red Queen ecosystem.

Equipment determines combat capability, survivability, and operational effectiveness.

Equipment definitions are global.

Player ownership is managed separately through the Inventory table.

---

# Table

equipment

---

# Primary Key

id (UUID)

---

# Fields

id

name

slug

description

category

slot

rarity

class_id

required_level

power

durability

tradable

icon_url

asset_id

status

created_at

updated_at

---

# Field Definitions

id

Unique equipment identifier.

---

name

Official equipment name.

---

slug

Unique internal identifier.

Example:

advanced-medkit

---

description

Short gameplay description.

---

category

Examples:

Weapon

Armor

Helmet

Backpack

Medical

Tool

Utility

Drone

Consumable

---

slot

Equipment slot.

Examples:

Primary

Secondary

Head

Body

Legs

Backpack

Utility

Accessory

---

rarity

Common

Uncommon

Rare

Epic

Legendary

Artifact

---

class_id

Optional reference to:

classes.id

Preferred Class for this equipment.

Equipment should remain usable by other Classes whenever gameplay balance allows.

---

required_level

Minimum SOLvivor level required.

---

power

Base equipment effectiveness.

---

durability

Maximum durability value.

Future gameplay systems may reduce durability.

---

tradable

Boolean.

Determines whether the item may be listed on the Marketplace.

---

icon_url

Equipment icon stored in Supabase Storage.

---

asset_id

Reference to the Assets table.

---

status

ACTIVE

INACTIVE

ARCHIVED

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

equipment

↓

inventory

↓

operations

↓

arena_matches

↓

marketplace_items

↓

assets

---

# Constraints

name

UNIQUE

NOT NULL

---

slug

UNIQUE

NOT NULL

---

tradable

DEFAULT FALSE

---

status

DEFAULT ACTIVE

---

# Indexes

name

slug

category

slot

rarity

class_id

status

tradable

---

# Row Level Security

Equipment definitions are public.

Players may read equipment data.

Only administrators may create, modify, balance, or archive equipment.

---

# Design Goals

Equipment definitions should remain completely data-driven.

Adding new items should require inserting new database records rather than modifying application code.

Equipment balance should be adjustable without requiring software updates.
```
```md
# PART VII — INVENTORY

---

# Purpose

The Inventory table stores ownership of every item acquired by a SOLvivor.

Unlike the Equipment table, which defines item properties, the Inventory table tracks which items belong to each player.

Inventory should only contain ownership and state.

Gameplay definitions remain in the Equipment table.

---

# Table

inventory

---

# Primary Key

id (UUID)

---

# Fields

id

profile_id

equipment_id

quantity

equipped

favorite

locked

durability

acquired_from

acquired_at

updated_at

---

# Field Definitions

id

Unique inventory record identifier.

---

profile_id

References:

profiles.id

Owner of the inventory item.

---

equipment_id

References:

equipment.id

Equipment definition.

---

quantity

Number of owned items.

---

equipped

Boolean.

Indicates whether the item is currently equipped.

---

favorite

Boolean.

Allows players to pin important equipment.

---

locked

Boolean.

Locked items cannot be sold or dismantled accidentally.

---

durability

Current durability value.

May differ from the equipment's maximum durability.

---

acquired_from

Origin of the item.

Examples:

Operation

Arena

Marketplace

Reward

Admin

Event

Crafting

---

acquired_at

Timestamp when the item was obtained.

---

updated_at

Last modification timestamp.

---

# Relationships

inventory

↓

profiles

↓

equipment

↓

marketplace_items

↓

arena_matches

↓

operations

---

# Constraints

profile_id

NOT NULL

---

equipment_id

NOT NULL

---

quantity

DEFAULT 1

---

equipped

DEFAULT FALSE

---

favorite

DEFAULT FALSE

---

locked

DEFAULT FALSE

---

# Indexes

profile_id

equipment_id

equipped

favorite

locked

---

# Row Level Security

Players may:

- view their own inventory;
- equip items;
- unequip items;
- favorite items;
- lock items.

Only backend services may:

- grant rewards;
- remove items;
- update durability;
- validate equipment ownership.

---

# Design Goals

Inventory should remain lightweight, scalable, and independent from gameplay logic.

Ownership, equipment state, and item management should be separated from equipment definitions to simplify future expansion and balancing.
```

```md
# PART VIII — OPERATIONS

---

# Purpose

The Operations table defines every mission available within the Red Queen ecosystem.

Operations are the primary source of progression, BIO SCORE growth, rewards, equipment acquisition, and player development.

Operations are completely data-driven and can be added without modifying application code.

---

# Table

operations

---

# Primary Key

id (UUID)

---

# Fields

id

title

slug

description

category

difficulty

recommended_class_id

recommended_role_ids

minimum_level

minimum_bio_score

estimated_duration

energy_cost

reward_package_id

repeatable

status

created_at

updated_at

---

# Field Definitions

id

Unique Operation identifier.

---

title

Official mission title.

---

slug

Unique internal identifier.

Example:

secure-medical-facility

---

description

Mission briefing displayed to players.

---

category

Examples:

Recon

Combat

Rescue

Research

Escort

Recovery

Exploration

Survival

---

difficulty

Easy

Normal

Hard

Expert

Nightmare

---

recommended_class_id

References:

classes.id

Recommended Class.

---

recommended_role_ids

Array of recommended Roles.

Used by Red Queen recommendations.

---

minimum_level

Minimum player level required.

---

minimum_bio_score

Minimum BIO SCORE required.

---

estimated_duration

Estimated completion time in minutes.

---

energy_cost

Future gameplay value.

Version 1 defaults to zero.

---

reward_package_id

References:

rewards.id

Rewards granted upon successful completion.

---

repeatable

Boolean.

Determines whether the Operation may be replayed.

---

status

ACTIVE

COMING_SOON

DISABLED

ARCHIVED

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

operations

↓

operation_history

↓

rewards

↓

classes

↓

roles

---

# Constraints

title

UNIQUE

NOT NULL

---

slug

UNIQUE

NOT NULL

---

repeatable

DEFAULT TRUE

---

status

DEFAULT ACTIVE

---

# Indexes

slug

difficulty

recommended_class_id

minimum_level

minimum_bio_score

status

---

# Row Level Security

Operation definitions are public.

Players may read available Operations.

Only administrators may create, modify, archive, or balance Operations.

---

# Design Goals

Operations should remain entirely data-driven.

Designers should be able to introduce new missions, adjust rewards, balance difficulty, and expand gameplay without requiring software development.
```
```md
# PART IX — OPERATION HISTORY

---

# Purpose

The Operation History table records every Operation completed by every SOLvivor.

Unlike the Operations table, which defines missions, this table stores the player's individual mission history.

Operation History is used for progression, statistics, achievements, analytics, and future AI recommendations.

---

# Table

operation_history

---

# Primary Key

id (UUID)

---

# Fields

id

profile_id

operation_id

status

started_at

completed_at

completion_time

difficulty

result

bio_score_earned

experience_earned

reward_package_id

equipment_rewards

performance_rating

red_queen_evaluation

created_at

---

# Field Definitions

id

Unique completion record.

---

profile_id

References:

profiles.id

Player who completed the Operation.

---

operation_id

References:

operations.id

Completed Operation.

---

status

STARTED

COMPLETED

FAILED

ABANDONED

---

started_at

Operation start timestamp.

---

completed_at

Operation completion timestamp.

---

completion_time

Completion duration in seconds.

---

difficulty

Difficulty used during the Operation.

Stored for historical purposes.

---

result

SUCCESS

FAILURE

PARTIAL_SUCCESS

---

bio_score_earned

BIO SCORE awarded.

---

experience_earned

Experience awarded.

---

reward_package_id

References:

rewards.id

Rewards granted.

---

equipment_rewards

Optional list of equipment received.

---

performance_rating

Performance score.

Range:

0–100

Used by Red Queen for future recommendations.

---

red_queen_evaluation

Optional AI evaluation generated after mission completion.

May contain operational observations and recommendations.

---

created_at

Record creation timestamp.

---

# Relationships

operation_history

↓

profiles

↓

operations

↓

rewards

↓

bio_scores

↓

achievements

---

# Constraints

profile_id

NOT NULL

---

operation_id

NOT NULL

---

status

NOT NULL

---

result

NOT NULL

---

performance_rating

DEFAULT 0

---

# Indexes

profile_id

operation_id

completed_at

status

result

performance_rating

---

# Row Level Security

Players may:

- view their own Operation History.

Players may never modify historical records.

Only backend services may create Operation History entries.

---

# Design Goals

Operation History serves as the permanent operational record for every SOLvivor.

Historical data should support progression, analytics, achievements, Red Queen evaluations, and future gameplay systems without ever requiring modification.
```
```md
# PART X — ARENA MATCHES

---

# Purpose

The Arena Matches table stores the complete history of every Combat Simulation.

It records battle participants, combat results, rewards, performance metrics, and battle logs.

Arena history supports rankings, statistics, matchmaking, Red Queen analysis, and future competitive features.

---

# Table

arena_matches

---

# Primary Key

id (UUID)

---

# Fields

id

battle_type

player_one_id

player_two_id

winner_id

battle_protocol

turn_count

battle_duration

bio_score_reward

experience_reward

reward_package_id

battle_log

started_at

completed_at

created_at

---

# Field Definitions

id

Unique battle identifier.

---

battle_type

Examples:

PvP

PvE

Training

Tournament

Simulation

---

player_one_id

References:

profiles.id

---

player_two_id

References:

profiles.id

Nullable for PvE battles.

---

winner_id

References:

profiles.id

Winner of the battle.

---

battle_protocol

Battle strategy selected before combat.

Examples:

Balanced

Aggressive

Defensive

Recon

Support

---

turn_count

Total number of combat turns.

---

battle_duration

Battle duration in seconds.

---

bio_score_reward

BIO SCORE earned after combat.

---

experience_reward

Experience awarded.

---

reward_package_id

References:

rewards.id

Rewards earned after the battle.

---

battle_log

Serialized battle log.

Contains every combat action for replay and analytics.

---

started_at

Battle start timestamp.

---

completed_at

Battle completion timestamp.

---

created_at

Record creation timestamp.

---

# Relationships

arena_matches

↓

profiles

↓

rewards

↓

bio_scores

↓

equipment

---

# Constraints

battle_type

NOT NULL

---

player_one_id

NOT NULL

---

winner_id

NOT NULL

---

turn_count

DEFAULT 0

---

bio_score_reward

DEFAULT 0

---

experience_reward

DEFAULT 0

---

# Indexes

player_one_id

player_two_id

winner_id

battle_type

completed_at

---

# Row Level Security

Players may:

- view their own Arena history;
- view completed public battles when permitted.

Players may never modify battle records.

Only backend combat services may create Arena Match records.

---

# Design Goals

Arena Matches represent the permanent combat history of every SOLvivor.

Battle records should support rankings, statistics, AI analysis, future replay systems, and long-term competitive progression without requiring structural database changes.
```

```md
# PART XI — MARKETPLACE

---

# Purpose

The Marketplace table manages all player-to-player trading within the Red Queen ecosystem.

It records listings, purchases, ownership transfers, and transaction history.

The Marketplace operates independently from gameplay progression.

---

# Table

marketplace_items

---

# Primary Key

id (UUID)

---

# Fields

id

seller_id

buyer_id

inventory_id

equipment_id

price

currency

quantity

listing_status

listed_at

sold_at

expires_at

created_at

updated_at

---

# Field Definitions

id

Unique marketplace listing.

---

seller_id

References:

profiles.id

Player creating the listing.

---

buyer_id

References:

profiles.id

Nullable until purchased.

---

inventory_id

References:

inventory.id

The inventory item being sold.

---

equipment_id

References:

equipment.id

Equipment definition.

---

price

Listing price.

---

currency

Supported currencies.

Examples:

THREAT

USDC

Future ecosystem currencies.

---

quantity

Number of items included.

---

listing_status

ACTIVE

SOLD

CANCELLED

EXPIRED

---

listed_at

Listing creation timestamp.

---

sold_at

Purchase timestamp.

---

expires_at

Optional expiration date.

---

created_at

Record creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

marketplace_items

↓

profiles

↓

inventory

↓

equipment

↓

rewards

---

# Constraints

seller_id

NOT NULL

---

inventory_id

NOT NULL

---

equipment_id

NOT NULL

---

price

NOT NULL

---

currency

NOT NULL

---

listing_status

DEFAULT ACTIVE

---

# Indexes

seller_id

buyer_id

equipment_id

listing_status

currency

price

listed_at

---

# Row Level Security

Players may:

- create listings;
- cancel their own listings;
- purchase available listings;
- view public Marketplace listings.

Marketplace transactions are validated exclusively by backend services.

---

# Design Goals

The Marketplace should remain secure, transparent, and scalable.

Trading must never compromise gameplay balance, and ownership transfers should always be atomic, auditable, and permanently recorded.
```

```md
# PART XII — REWARDS

---

# Purpose

The Rewards table defines every reward package that can be granted throughout the Red Queen ecosystem.

Rewards are referenced by Operations, Arena, achievements, events, and future gameplay systems.

Reward definitions are centralized to eliminate duplication and simplify balancing.

---

# Table

rewards

---

# Primary Key

id (UUID)

---

# Fields

id

name

slug

description

reward_type

bio_score

experience

equipment

resources

currencies

cosmetics

title

badge

repeatable

status

created_at

updated_at

---

# Field Definitions

id

Unique reward identifier.

---

name

Official reward package name.

---

slug

Unique internal identifier.

Example:

operation-reward-alpha

---

description

Displayed reward description.

---

reward_type

Examples:

Operation

Arena

Achievement

Event

Tutorial

Admin

Season

---

bio_score

BIO SCORE granted.

---

experience

Experience granted.

---

equipment

List of equipment rewards.

References:

equipment.id

---

resources

Gameplay resources granted.

---

currencies

Supported currencies.

Examples:

THREAT

USDC

Future ecosystem currencies.

---

cosmetics

Cosmetic rewards.

Examples:

Avatar

Banner

Frame

Skin

---

title

Optional player title.

---

badge

Optional achievement badge.

---

repeatable

Boolean.

Determines whether the reward may be earned multiple times.

---

status

ACTIVE

DISABLED

ARCHIVED

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

rewards

↓

operations

↓

operation_history

↓

arena_matches

↓

achievements

↓

future_events

---

# Constraints

name

UNIQUE

NOT NULL

---

slug

UNIQUE

NOT NULL

---

status

DEFAULT ACTIVE

---

repeatable

DEFAULT TRUE

---

# Indexes

slug

reward_type

status

---

# Row Level Security

Reward definitions are public.

Players may read reward information.

Only backend services may grant rewards.

Only administrators may modify reward definitions.

---

# Design Goals

Rewards should remain completely data-driven.

Adding, modifying, or balancing rewards should require only database updates without application code changes.

Reward packages should be reusable across every gameplay system.
```
```md id="m3y1vb"
# PART XIII — ASSETS

---

# Purpose

The Assets table manages all visual, audio, and multimedia resources used throughout the Red Queen ecosystem.

Gameplay systems reference assets through this table rather than storing file locations directly.

This approach centralizes asset management and simplifies future updates.

---

# Table

assets

---

# Primary Key

id (UUID)

---

# Fields

id

name

slug

asset_type

category

file_url

thumbnail_url

storage_path

file_size

mime_type

width

height

version

status

created_at

updated_at

---

# Field Definitions

id

Unique asset identifier.

---

name

Human-readable asset name.

---

slug

Unique internal identifier.

Example:

rq-avatar-001

---

asset_type

Examples:

Image

Icon

Illustration

Background

Animation

Video

Audio

Document

---

category

Examples:

Profile

Equipment

Operation

Faction

Class

Role

Marketplace

UI

Loading

Environment

---

file_url

Public asset URL.

---

thumbnail_url

Preview image.

Nullable.

---

storage_path

Internal Supabase Storage path.

---

file_size

File size in bytes.

---

mime_type

Examples:

image/png

image/webp

image/svg+xml

audio/mpeg

video/mp4

---

width

Image width.

Nullable.

---

height

Image height.

Nullable.

---

version

Asset version.

Used for cache invalidation.

---

status

ACTIVE

DISABLED

ARCHIVED

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

assets

↓

equipment

↓

factions

↓

classes

↓

roles

↓

operations

↓

marketplace_items

↓

ui_components

---

# Constraints

name

NOT NULL

---

slug

UNIQUE

NOT NULL

---

storage_path

UNIQUE

NOT NULL

---

status

DEFAULT ACTIVE

---

version

DEFAULT 1

---

# Indexes

slug

asset_type

category

status

---

# Row Level Security

Players may read publicly available assets.

Only administrators may upload, replace, or archive assets.

Assets should never be deleted if referenced by production content.

---

# Design Goals

Assets should be completely decoupled from gameplay systems.

Replacing artwork, icons, animations, or media should require only updating asset references rather than modifying application code.
```
```md
# PART XIV — NOTIFICATIONS

---

# Purpose

The Notifications table stores every system notification delivered to a SOLvivor.

Notifications inform players about gameplay events, progression, marketplace activity, Arena results, and communications from Red Queen.

Notifications should be lightweight, persistent, and easy to manage.

---

# Table

notifications

---

# Primary Key

id (UUID)

---

# Fields

id

profile_id

type

title

message

reference_type

reference_id

priority

is_read

expires_at

created_at

updated_at

---

# Field Definitions

id

Unique notification identifier.

---

profile_id

References:

profiles.id

Notification recipient.

---

type

Examples:

Operation

Arena

Marketplace

Reward

Achievement

System

Red Queen

Update

---

title

Short notification title.

---

message

Notification content.

---

reference_type

Associated object.

Examples:

Operation

Arena

Marketplace

Equipment

Achievement

Profile

---

reference_id

Identifier of the related object.

Nullable.

---

priority

LOW

NORMAL

HIGH

CRITICAL

---

is_read

Boolean.

Indicates whether the notification has been viewed.

---

expires_at

Optional expiration timestamp.

Expired notifications may be archived automatically.

---

created_at

Notification creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

notifications

↓

profiles

↓

operations

↓

arena_matches

↓

marketplace_items

↓

rewards

---

# Constraints

profile_id

NOT NULL

---

title

NOT NULL

---

message

NOT NULL

---

priority

DEFAULT NORMAL

---

is_read

DEFAULT FALSE

---

# Indexes

profile_id

type

priority

is_read

created_at

---

# Row Level Security

Players may:

- view their own notifications;
- mark notifications as read;
- archive notifications.

Only backend services may create system notifications.

---

# Design Goals

Notifications should keep players informed without becoming intrusive.

Every important gameplay event should generate a meaningful notification while avoiding unnecessary spam.
```
```md
# PART XV — SETTINGS

---

# Purpose

The Settings table stores player preferences and application configuration.

Settings personalize the player experience without affecting gameplay balance or progression.

All settings are specific to an individual SOLvivor.

---

# Table

settings

---

# Primary Key

id (UUID)

---

# Fields

id

profile_id

language

theme

accent_color

notifications_enabled

sound_enabled

music_enabled

voice_enabled

reduced_motion

accessibility_mode

show_online_status

graphics_quality

created_at

updated_at

---

# Field Definitions

id

Unique settings identifier.

---

profile_id

References:

profiles.id

Owner of the settings.

---

language

Application language.

Example:

en

---

theme

Examples:

Dark

Light

System

---

accent_color

Selected UI accent color.

---

notifications_enabled

Boolean.

Enable or disable notifications.

---

sound_enabled

Boolean.

Master sound setting.

---

music_enabled

Boolean.

Background music setting.

---

voice_enabled

Boolean.

Enable Red Queen voice interactions.

---

reduced_motion

Boolean.

Reduces interface animations.

---

accessibility_mode

Boolean.

Enables accessibility enhancements.

---

show_online_status

Boolean.

Controls future social visibility.

---

graphics_quality

Examples:

Low

Medium

High

Ultra

Auto

---

created_at

Creation timestamp.

---

updated_at

Last modification timestamp.

---

# Relationships

settings

↓

profiles

---

# Constraints

profile_id

UNIQUE

NOT NULL

---

theme

DEFAULT Dark

---

language

DEFAULT en

---

notifications_enabled

DEFAULT TRUE

---

sound_enabled

DEFAULT TRUE

---

music_enabled

DEFAULT TRUE

---

voice_enabled

DEFAULT TRUE

---

reduced_motion

DEFAULT FALSE

---

accessibility_mode

DEFAULT FALSE

---

show_online_status

DEFAULT TRUE

---

graphics_quality

DEFAULT Auto

---

# Indexes

profile_id

language

theme

---

# Row Level Security

Players may:

- view their own settings;
- modify their own settings.

No player may access another player's settings.

---

# Design Goals

Settings should remain independent from gameplay systems.

Changing preferences should never affect progression, matchmaking, combat calculations, or rewards.

Settings exist solely to personalize the player experience.
```
```md
# PART XVI — RELATIONSHIPS

---

# Overview

The Red Queen database is designed around explicit relationships.

Each table has a clearly defined responsibility.

Relationships minimize duplicated data while maintaining referential integrity.

---

# Core Relationships

profiles

↓

bio_scores

One-to-One

Every SOLvivor owns exactly one BIO Score record.

---

profiles

↓

settings

One-to-One

Every SOLvivor owns one settings profile.

---

profiles

↓

inventory

One-to-Many

A SOLvivor may own many inventory items.

---

profiles

↓

operation_history

One-to-Many

A SOLvivor may complete many Operations.

---

profiles

↓

arena_matches

One-to-Many

A SOLvivor may participate in many Arena battles.

---

profiles

↓

notifications

One-to-Many

A SOLvivor may receive many notifications.

---

profiles

↓

marketplace_items

One-to-Many

A SOLvivor may create multiple Marketplace listings.

---

factions

↓

profiles

One-to-Many

A Faction contains many SOLvivors.

---

classes

↓

profiles

One-to-Many

Each SOLvivor belongs to one active Class.

---

classes

↓

roles

One-to-Many

Every Class contains multiple Roles.

---

roles

↓

profiles

One-to-Many

Many SOLvivors may use the same active Role.

---

equipment

↓

inventory

One-to-Many

One equipment definition may exist in many player inventories.

---

equipment

↓

marketplace_items

One-to-Many

Equipment may appear in multiple Marketplace listings.

---

operations

↓

operation_history

One-to-Many

One Operation may generate many completion records.

---

rewards

↓

operations

One-to-Many

Reward packages may be reused by multiple Operations.

---

rewards

↓

arena_matches

One-to-Many

Arena battles may reference reusable reward packages.

---

assets

↓

equipment

One-to-Many

Assets provide artwork for Equipment.

---

assets

↓

factions

One-to-Many

Assets provide faction logos and banners.

---

assets

↓

classes

One-to-Many

Assets provide Class icons.

---

assets

↓

roles

One-to-Many

Assets provide Role icons.

---

# Foreign Key Policy

All relationships should use explicit foreign keys.

Cascade deletion should be avoided whenever gameplay history must be preserved.

Historical gameplay data should never be automatically removed.

---

# Design Goals

Relationships should remain simple, predictable, and scalable.

Every gameplay system should connect through explicit references while preserving data integrity and long-term maintainability.
```
```md
# PART XVII — INDEXING & ROW LEVEL SECURITY

---

# Overview

Proper indexing and Row Level Security (RLS) are essential for scalability, performance, and security.

Every production table should define indexes based on query patterns and explicit access policies.

---

# Indexing Principles

Indexes should be created for:

- Primary Keys
- Foreign Keys
- Frequently searched fields
- Frequently sorted fields
- Frequently filtered fields

Avoid unnecessary indexes.

Each index increases write costs.

---

# Recommended Indexed Fields

Profiles

- wallet_address
- username
- faction_id
- class_id
- active_role_id

---

BIO Scores

- profile_id
- current_score
- highest_score

---

Inventory

- profile_id
- equipment_id
- equipped

---

Equipment

- category
- rarity
- class_id
- tradable

---

Operations

- difficulty
- minimum_level
- status

---

Operation History

- profile_id
- operation_id
- completed_at

---

Arena Matches

- player_one_id
- player_two_id
- winner_id
- completed_at

---

Marketplace

- seller_id
- buyer_id
- listing_status
- equipment_id
- price

---

Notifications

- profile_id
- is_read
- created_at

---

# Row Level Security

Row Level Security must be enabled on every player-owned table.

Version 1 enables RLS for:

- profiles
- bio_scores
- inventory
- operation_history
- arena_matches
- marketplace_items
- notifications
- settings

Lookup tables remain public.

Examples:

- factions
- classes
- roles
- equipment
- rewards

---

# Player Permissions

Players may:

- view their own records;
- update their own profile;
- manage their own inventory;
- manage their own settings;
- create Marketplace listings;
- purchase Marketplace listings;
- read public game data.

Players may never modify another player's data.

---

# Administrator Permissions

Administrators may:

- manage game content;
- balance gameplay;
- upload assets;
- manage rewards;
- archive records;
- moderate Marketplace activity.

Administrative actions should always be audited.

---

# Service Permissions

Backend services are responsible for:

- BIO SCORE updates;
- reward distribution;
- combat calculations;
- inventory validation;
- marketplace transactions;
- progression updates.

Clients should never perform these actions directly.

---

# Security Principles

Never trust client-side data.

Always validate:

- ownership;
- authentication;
- permissions;
- request integrity.

The server remains the authoritative source for all gameplay progression.

---

# Design Goals

The database should remain secure, performant, and scalable.

Proper indexing and Row Level Security ensure fast queries, secure player data, and reliable long-term operation.
```
```md
# PART XVII — INDEXING & ROW LEVEL SECURITY

---

# Overview

Proper indexing and Row Level Security (RLS) are essential for scalability, performance, and security.

Every production table should define indexes based on query patterns and explicit access policies.

---

# Indexing Principles

Indexes should be created for:

- Primary Keys
- Foreign Keys
- Frequently searched fields
- Frequently sorted fields
- Frequently filtered fields

Avoid unnecessary indexes.

Each index increases write costs.

---

# Recommended Indexed Fields

Profiles

- wallet_address
- username
- faction_id
- class_id
- active_role_id

---

BIO Scores

- profile_id
- current_score
- highest_score

---

Inventory

- profile_id
- equipment_id
- equipped

---

Equipment

- category
- rarity
- class_id
- tradable

---

Operations

- difficulty
- minimum_level
- status

---

Operation History

- profile_id
- operation_id
- completed_at

---

Arena Matches

- player_one_id
- player_two_id
- winner_id
- completed_at

---

Marketplace

- seller_id
- buyer_id
- listing_status
- equipment_id
- price

---

Notifications

- profile_id
- is_read
- created_at

---

# Row Level Security

Row Level Security must be enabled on every player-owned table.

Version 1 enables RLS for:

- profiles
- bio_scores
- inventory
- operation_history
- arena_matches
- marketplace_items
- notifications
- settings

Lookup tables remain public.

Examples:

- factions
- classes
- roles
- equipment
- rewards

---

# Player Permissions

Players may:

- view their own records;
- update their own profile;
- manage their own inventory;
- manage their own settings;
- create Marketplace listings;
- purchase Marketplace listings;
- read public game data.

Players may never modify another player's data.

---

# Administrator Permissions

Administrators may:

- manage game content;
- balance gameplay;
- upload assets;
- manage rewards;
- archive records;
- moderate Marketplace activity.

Administrative actions should always be audited.

---

# Service Permissions

Backend services are responsible for:

- BIO SCORE updates;
- reward distribution;
- combat calculations;
- inventory validation;
- marketplace transactions;
- progression updates.

Clients should never perform these actions directly.

---

# Security Principles

Never trust client-side data.

Always validate:

- ownership;
- authentication;
- permissions;
- request integrity.

The server remains the authoritative source for all gameplay progression.

---

# Design Goals

The database should remain secure, performant, and scalable.

Proper indexing and Row Level Security ensure fast queries, secure player data, and reliable long-term operation.
```
```md
# PART XIX — DATABASE DESIGN PRINCIPLES

---

# Overview

The Red Queen database is designed to support long-term ecosystem growth.

Every table, relationship, and service should follow the same architectural principles to ensure consistency, scalability, and maintainability.

The database should evolve through expansion rather than redesign.

---

# Single Source of Truth

Each piece of data should exist in only one location.

Avoid duplicate data whenever possible.

Application logic should reference existing records rather than creating redundant information.

---

# Normalization

Database tables should remain normalized.

Shared information should be referenced through foreign keys instead of duplication.

Denormalization should only be introduced when supported by measurable performance improvements.

---

# Data Integrity

All relationships should be protected through foreign key constraints.

Orphaned records should never exist.

Historical gameplay data should remain valid even after future content updates.

---

# Server Authority

The database is the authoritative source for all persistent gameplay data.

Clients should never:

- modify progression;
- grant rewards;
- calculate combat outcomes;
- update BIO SCORE;
- change inventory ownership.

These operations belong exclusively to backend services.

---

# Scalability

The schema should support future additions without structural redesign.

Future expansion may include:

- new Operations;
- new Classes;
- new Roles;
- new Factions;
- new Equipment;
- new Marketplace systems;
- seasonal content;
- world events.

New features should integrate naturally into the existing schema.

---

# Auditability

Important gameplay actions should remain permanently traceable.

Examples include:

- Operations;
- Arena battles;
- Marketplace transactions;
- reward distribution;
- inventory changes.

Historical records should never be overwritten.

---

# Performance

The database should prioritize:

- efficient indexing;
- optimized queries;
- minimal redundancy;
- predictable performance.

Performance optimization should never compromise data integrity.

---

# Security

Every player-owned table must enforce Row Level Security.

Every request should validate:

- authentication;
- ownership;
- permissions.

Sensitive information should never be exposed to unauthorized users.

---

# Future Compatibility

Schema updates should remain backward compatible whenever possible.

Existing player progression should never be lost due to structural database changes.

Migration paths should always be documented.

---

# Final Principle

The database is the foundation of the Red Queen ecosystem.

Gameplay systems, AI, Marketplace, Operations, Arena, and future features should build upon this foundation rather than redefine it.

A stable database enables a stable platform.

---

# Design Goals

The Red Queen database should remain secure, modular, scalable, and maintainable throughout the lifetime of the project.

Every engineering decision should strengthen the foundation rather than increase complexity.
```
