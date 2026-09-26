import { seal, unseal } from "./localVault";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { stateSchema } from "./shared/schema";
import { initialState, State } from "./coach";
export const STORAGE_KEY = "elevate.personal-coach.v1";
export async function loadState(): Promise<State> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw
    ? stateSchema.parse(JSON.parse(await unseal(raw)))
    : initialState();
}
let queue: Promise<void> = Promise.resolve();
export function saveState(state: State) {
  const data = JSON.stringify(stateSchema.parse(state));
  const operation = queue
    .catch(() => {})
    .then(async () => AsyncStorage.setItem(STORAGE_KEY, await seal(data)));
  queue = operation;
  return operation;
}
