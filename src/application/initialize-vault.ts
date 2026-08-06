import {
  buildInitializationPlan,
  type InitializationPlan,
  type VaultSeed,
} from "../domain/initialization-plan";
import type {
  InitializationApplyResult,
  VaultInitializer,
} from "../ports/vault-initializer";

export async function buildVaultInitializationPlan(
  initializer: VaultInitializer,
  seed: VaultSeed,
): Promise<InitializationPlan> {
  return buildInitializationPlan(seed, await initializer.readSnapshot(seed));
}

export async function applyVaultInitializationPlan(
  initializer: VaultInitializer,
  plan: InitializationPlan,
): Promise<InitializationApplyResult> {
  return initializer.applyInitializationPlan(plan);
}
