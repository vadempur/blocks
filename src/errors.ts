export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InvalidHeightError extends ValidationError {
  constructor(expectedHeight: number, actualHeight: number) {
    super(`Invalid block height. Expected height ${expectedHeight}, but got ${actualHeight}. Height must be exactly one unit higher than the current height.`);
    this.name = 'InvalidHeightError';
  }
}

export class InvalidTransactionSumError extends ValidationError {
  constructor(transactionId: string) {
    super(`Invalid transaction ${transactionId}. Sum of input values must exactly equal sum of output values.`);
    this.name = 'InvalidTransactionSumError';
  }
}

export class InvalidBlockIdError extends ValidationError {
  constructor(expectedId: string, actualId: string) {
    super(`Invalid block id. Expected ${expectedId}, but got ${actualId}. Block id must be the sha256 hash of height + transaction ids.`);
    this.name = 'InvalidBlockIdError';
  }
}

export class GenesisBlockExistsError extends ValidationError {
  constructor() {
    super('Genesis block already exists. Cannot add another genesis block.');
    this.name = 'GenesisBlockExistsError';
  }
}

export class InvalidRollbackHeightError extends ValidationError {
  constructor(requestedHeight: number, maxHeight: number) {
    super(`Invalid rollback height. Cannot rollback to height ${requestedHeight} when current height is ${maxHeight - 1}. Height must be less than current height.`);
    this.name = 'InvalidRollbackHeightError';
  }
}

export class RollbackBelowGenesisError extends ValidationError {
  constructor() {
    super('Cannot rollback below genesis height (height 1).');
    this.name = 'RollbackBelowGenesisError';
  }
}
