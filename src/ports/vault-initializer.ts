import type {
  InitializationPlan,
  VaultSeed,
  VaultSnapshot,
} from "../domain/initialization-plan";

export interface InitializationApplyResult {
  readonly filesCreated: number;
  readonly foldersCreated: number;
}

export interface VaultInitializer {
  applyInitializationPlan(
    plan: InitializationPlan,
  ): Promise<InitializationApplyResult>;
  readSnapshot(seed: VaultSeed): Promise<VaultSnapshot>;
}
