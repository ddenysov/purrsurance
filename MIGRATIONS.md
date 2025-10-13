# Database Migrations & Seeds

Quick guide for working with database migrations and seeds in the Purrsurance project.

## Quick Start

### 1. Install Dependencies

```bash
make install
# or
cd data && pnpm install
```

### 2. Configure AWS

```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile  # Optional
```

### 3. Run Migrations

Create the Policies table:

```bash
make migrate
```

### 4. Seed Data

Populate with 10 mock insurance policies:

```bash
make seed
```

## Commands

| Command | Description |
|---------|-------------|
| `make migrate` | Run all migrations (creates tables) |
| `make migrate-down` | Rollback migrations (destructive!) |
| `make seed` | Populate tables with mock data |
| `make install` | Install all project dependencies |

## What Gets Created

### Policies Table

DynamoDB table with the following structure:

**Primary Key:**
- `policyId` (Hash Key)

**Global Secondary Indexes:**
- `OwnerIdIndex` - Query policies by owner
- `StatusIndex` - Query policies by status

**Attributes:**
- Pet information (name, species, breed, age, microchip, etc.)
- Owner details (name, contact, address)
- Policy coverage (limits, deductibles, covered services)
- Medical history (conditions, allergies, vaccinations)
- Audit trail (created/updated timestamps)

### Mock Data

10 insurance policies with diverse pets:
- 5 cats: British Shorthair, Persian, Maine Coon, Siamese, Ragdoll
- 5 dogs: Golden Retriever, German Shepherd, Labrador, Beagle, Rottweiler

Each policy includes:
- Complete pet profile
- Owner information across different Ukrainian cities
- Different insurance plans (Basic, Standard, Premium)
- Medical histories with various conditions
- Up-to-date vaccination records

## Creating New Migrations

1. Create file: `data/migrations/00X_description.mjs`
2. Add up/down functions:

```javascript
export async function up() {
  // Create resources
  console.log('Creating table...');
  const command = new CreateTableCommand({...});
  await client.send(command);
}

export async function down() {
  // Remove resources
  console.log('Dropping table...');
}
```

3. Run: `make migrate`

## Creating New Seeds

1. Create file: `data/seeds/00X_description.mjs`
2. Add seed function:

```javascript
export async function seed() {
  // Insert data
  const items = [...];
  for (const item of items) {
    await docClient.send(new PutCommand({...}));
  }
}
```

3. Run: `make seed`

## Troubleshooting

### AWS Credentials Error

```bash
# Configure AWS credentials
aws configure
# or
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1
```

### Table Already Exists

Migrations check if tables exist before creating. Safe to run multiple times.

### Dependencies Not Installed

```bash
cd data && pnpm install
```

## File Structure

```
data/
├── migrations/
│   └── 001_create_policies_table.mjs
├── seeds/
│   └── 001_policies_seed.mjs
├── migrate.mjs          # Migration runner
├── seed.mjs            # Seed runner
├── package.json        # Dependencies
└── README.md           # Detailed docs
```

## Related Files

- `/data/README.md` - Detailed documentation
- `/Makefile` - Project commands
- `/data/package.json` - Data layer dependencies

## Next Steps

After running migrations and seeds:

1. **Verify Data**: Check AWS Console → DynamoDB → Tables → Policies
2. **Test Lambda**: Update `tool-policy-details` to query real data
3. **Query Examples**: See `/data/README.md` for query patterns

## Support

For detailed information about the data structure and advanced usage, see:
- `/data/README.md` - Complete documentation
- Policy structure in: `/apps/services/tool-policy-details/app.mjs`

