# Database Migrations and Seeds

This directory contains database migrations and seed data for the Вет Експерт project.

## Structure

```
data/
├── migrations/          # Database schema migrations
│   ├── 001_create_policies_table.mjs
│   └── 002_create_appointments_table.mjs
├── seeds/              # Database seed data
│   ├── 001_policies_seed.mjs
│   └── 002_appointments_seed.mjs
├── migrate.mjs         # Migration runner script
├── seed.mjs           # Seed runner script
├── package.json       # Dependencies
├── SCHEMA.md          # Policies table schema
├── APPOINTMENTS-SCHEMA.md  # Appointments table schema
└── README.md          # This file
```

## Prerequisites

1. Install dependencies:
```bash
cd data
pnpm install
```

2. Configure AWS credentials:
```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile  # Optional
```

## Usage

### Run Migrations

Create database tables:
```bash
# From project root
make migrate

# Or from data directory
pnpm run migrate
```

Rollback migrations:
```bash
cd data
pnpm run migrate:down
```

### Run Seeds

Populate database with mock data:
```bash
# From project root
make seed

# Or from data directory
pnpm run seed
```

## Migrations

Migrations are run in alphabetical order based on filename. Each migration file should export `up()` and `down()` functions.

### Creating a New Migration

1. Create a new file in `migrations/` with format: `NNN_description.mjs`
2. Implement `up()` and `down()` functions:

```javascript
export async function up() {
  // Create resources
}

export async function down() {
  // Remove resources
}
```

## Seeds

Seed files populate tables with mock data. Each seed file should export a `seed()` function.

### Creating a New Seed

1. Create a new file in `seeds/` with format: `NNN_description.mjs`
2. Implement `seed()` function:

```javascript
export async function seed() {
  // Insert mock data
}
```

## Current Data

### Policies Table

The `001_policies_seed.mjs` creates 10 insurance policies with the following pets:

1. **Mittens** (Cat, British Shorthair) - Kyiv
2. **Max** (Dog, Golden Retriever) - Kyiv
3. **Luna** (Cat, Persian) - Lviv
4. **Rocky** (Dog, German Shepherd) - Odesa
5. **Whiskers** (Cat, Maine Coon) - Kharkiv
6. **Bella** (Dog, Labrador Retriever) - Dnipro
7. **Shadow** (Cat, Siamese) - Zaporizhzhia
8. **Charlie** (Dog, Beagle) - Poltava
9. **Fluffy** (Cat, Ragdoll) - Chernivtsi
10. **Rex** (Dog, Rottweiler) - Ivano-Frankivsk

Each policy includes:
- Pet information (breed, age, microchip, etc.)
- Owner details
- Policy coverage details
- Medical history
- Vaccinations
- Current medications (if any)
- Last checkup information

## Environment Variables

- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_PROFILE` - AWS profile to use (optional)
- `ENVIRONMENT` - Environment name (default: development)

