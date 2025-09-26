# Indexer Integration Tests

This directory contains integration tests for the indexer

## Test Structure

### Files
- `src/integration-tests.ts` - Main test suite
- `src/test-runner.ts` - Test runner entry point

### Test Coverage

The integration tests cover:

1. **Database Connection** - Verifies database connectivity
2. **Genesis Block Creation** - Tests initial indexer setup
3. **Multiple Block Addition** - Tests chain building
4. **Balance Calculations** - Verifies transaction balance tracking
5. **Rollback to Genesis** - Tests complete rollback functionality
6. **Rollback to Middle** - Tests partial rollback
7. **Invalid Operations** - Tests error handling
8. **Edge Cases** - Tests boundary conditions

## Running Tests

### Prerequisites
- Node.js and npm installed
- Docker and Docker Compose (for database)
- PostgreSQL database running via Docker

### Setup
```bash
# Start the database
npm run run-docker

# Start the indexer server
npm start
```

### Run Tests
```bash
# Run integration tests
npm run test:integration

# Or run via test runner
npm test
```

### Test Output
```
🧪 INDEXER INTEGRATION TESTS
============================================================
🧪 Running: Database Connection
✅ PASSED: Database Connection
🧪 Running: Genesis Block Creation
✅ PASSED: Genesis Block Creation
🧪 Running: Multiple Block Addition
✅ PASSED: Multiple Block Addition
🧪 Running: Balance Calculations
✅ PASSED: Balance Calculations
🧪 Running: Rollback to Genesis (Height 1)
✅ PASSED: Rollback to Genesis (Height 1)
🧪 Running: Rollback to Middle Height
✅ PASSED: Rollback to Middle Height
🧪 Running: Invalid Operations Handling
✅ PASSED: Invalid Operations Handling
🧪 Running: Edge Cases
✅ PASSED: Edge Cases

📊 TEST SUMMARY
============================================================
Total Tests: 8
✅ Passed: 8
❌ Failed: 0
📈 Success Rate: 100.0%

============================================================
```

## Test Details

### Genesis Block Creation
- Creates genesis block with height 1
- Verifies transaction processing
- Checks UTXO creation
- Validates initial balance state

### Multiple Block Addition
- Adds multiple blocks to the chain
- Verifies chain integrity
- Tests transaction processing across blocks
- Validates UTXO spending and creation

### Balance Calculations
- Tests balance updates during transactions
- Verifies correct balance calculations
- Checks balance consistency across multiple transactions

### Rollback Functionality
- Tests rollback to genesis (height 1)
- Tests partial rollback to middle heights
- Verifies UTXO recreation
- Validates balance recalculation

### Invalid Operations
- Tests invalid block heights
- Tests invalid rollback heights
- Verifies proper error messages

### Edge Cases
- Tests rollback when already at target height
- Tests empty transaction blocks
- Tests boundary conditions

## API Endpoints Tested

- `GET /` - Get all blocks
- `POST /blocks` - Add new block
- `POST /rollback` - Rollback to height
- `GET /balances/:address` - Get address balance

## Database Operations Tested

- Transaction creation and deletion
- UTXO creation and spending
- Balance updates
- Foreign key constraints
- Rollback operations

## Configuration

Tests use the existing:
- Database configuration from `data-source.ts`
- Entity definitions from `src/entity/`
- Repository implementations from `src/db/repos/`
- Service classes from `src/services/`

## Error Handling

All tests include comprehensive error handling and provide detailed error messages for debugging.
