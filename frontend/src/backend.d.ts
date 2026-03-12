import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export type ShedId = bigint;
export type AnimalId = string;
export interface TubChangeEntry {
    id: TubChangeId;
    animalId: AnimalId;
    timestamp: Time;
}
export type WeightId = bigint;
export interface ClutchEntry {
    id: bigint;
    animalId: AnimalId;
    notes: string;
    timestamp: Time;
}
export interface AnimalWithDaysSinceLastMealAndPairing {
    daysSinceLastPairing?: bigint;
    animal: Animal;
    daysSinceLastMeal?: bigint;
}
export interface AnimalWeightUpdate {
    weight: bigint;
    animalId: AnimalId;
}
export interface ShedEntry {
    id: ShedId;
    animalId: AnimalId;
    timestamp: Time;
}
export type IdNumber = string;
export interface PairingEntry {
    id: PairingId;
    animalId: AnimalId;
    notes: string;
    timestamp: Time;
}
export interface BulkSnakeEntry {
    sex: string;
    weight?: bigint;
    name: string;
    picture?: ExternalBlob;
    idNumber: IdNumber;
    genes: string;
    birthday?: Time;
}
export interface ClutchInput {
    clutchNumber: bigint;
    outcomeNotes: string;
    numSlugs: bigint;
    dateEggsLaid: Time;
    sireId: AnimalId;
    numEggsLaid: bigint;
    damId: AnimalId;
    hatchDate?: Time;
    numHatched: bigint;
}
export interface Animal {
    id: AnimalId;
    sex: string;
    weight?: bigint;
    name: string;
    picture?: ExternalBlob;
    idNumber: IdNumber;
    genes: string;
    birthday?: Time;
}
export interface Meal {
    id: MealId;
    animalId: AnimalId;
    timestamp: Time;
    details: string;
}
export type TubChangeId = bigint;
export interface ClutchRecord {
    id: ClutchId;
    clutchNumber: bigint;
    outcomeNotes: string;
    numSlugs: bigint;
    dateEggsLaid: Time;
    sireId: AnimalId;
    numEggsLaid: bigint;
    damId: AnimalId;
    hatchDate?: Time;
    numHatched: bigint;
}
export interface AnimalWithDaysSinceLastEvents {
    daysSinceLastPairing?: bigint;
    animal: Animal;
    daysSinceLastClutch?: bigint;
    daysSinceLastTubChange?: bigint;
    daysSinceLastMeal?: bigint;
    daysSinceLastShed?: bigint;
}
export type PairingId = bigint;
export interface AnimalWithDaysSinceLastMeal {
    animal: Animal;
    daysSinceLastMeal?: bigint;
}
export type MealId = bigint;
export interface WeightEntry {
    id: WeightId;
    weight: bigint;
    animalId: AnimalId;
    timestamp: Time;
}
export interface UserProfile {
    name: string;
}
export type ClutchId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAnimal(name: string, genes: string, sex: string, birthday: Time | null, weight: bigint | null, picture: ExternalBlob | null, idNumber: IdNumber): Promise<AnimalId>;
    addBulkMealsForSelectedAnimals(animalIds: Array<AnimalId>, details: string, timestamp: Time): Promise<Array<MealId>>;
    addBulkSnakes(snakes: Array<BulkSnakeEntry>): Promise<Array<AnimalId>>;
    addBulkWeightEntries(weightEntries: Array<WeightEntry>): Promise<void>;
    addBulkWeightsForSelectedAnimals(weightUpdates: Array<AnimalWeightUpdate>): Promise<void>;
    addClutchRecord(clutchInput: ClutchInput): Promise<ClutchId>;
    addMeal(animalId: AnimalId, details: string, timestamp: Time): Promise<MealId>;
    addPairingEntry(animalId: AnimalId, timestamp: Time, notes: string): Promise<PairingId>;
    addWeightEntry(animalId: AnimalId, weight: bigint, timestamp: Time): Promise<WeightId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAnimal(id: AnimalId): Promise<void>;
    deleteClutchEntry(id: bigint): Promise<void>;
    deleteClutchRecord(id: ClutchId): Promise<void>;
    deleteMeal(id: MealId): Promise<void>;
    deletePairingEntry(id: PairingId): Promise<void>;
    deleteShedEntry(id: ShedId): Promise<void>;
    deleteTubChangeEntry(id: TubChangeId): Promise<void>;
    deleteWeightEntry(id: WeightId): Promise<void>;
    editAnimal(id: AnimalId, name: string, genes: string, sex: string, birthday: Time | null, weight: bigint | null, picture: ExternalBlob | null, idNumber: IdNumber): Promise<void>;
    editClutchEntry(id: bigint, animalId: AnimalId, timestamp: Time, notes: string): Promise<void>;
    editClutchRecord(id: ClutchId, clutchInput: ClutchInput): Promise<void>;
    editMeal(id: MealId, details: string): Promise<void>;
    editPairingEntry(id: PairingId, timestamp: Time, notes: string): Promise<void>;
    editShedEntry(id: ShedId, animalId: AnimalId, timestamp: Time): Promise<void>;
    editTubChangeEntry(id: TubChangeId, animalId: AnimalId, timestamp: Time): Promise<void>;
    editWeightEntry(id: WeightId, weight: bigint, timestamp: Time): Promise<void>;
    getAnimalById(id: AnimalId): Promise<Animal | null>;
    getAnimals(): Promise<Array<Animal>>;
    getAnimalsWithDaysSinceLastEvents(): Promise<Array<AnimalWithDaysSinceLastEvents>>;
    getAnimalsWithDaysSinceLastMeal(): Promise<Array<AnimalWithDaysSinceLastMeal>>;
    getAnimalsWithDaysSinceLastMealAndPairing(): Promise<Array<AnimalWithDaysSinceLastMealAndPairing>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClutchHistoryForAnimal(animalId: AnimalId): Promise<Array<ClutchEntry>>;
    getClutchRecords(): Promise<Array<ClutchRecord>>;
    getCustomHeading(): Promise<string>;
    getLastWaterChange(): Promise<Time | null>;
    getMealsForAnimal(animalId: AnimalId): Promise<Array<Meal>>;
    getPairingHistoryForAnimal(animalId: AnimalId): Promise<Array<PairingEntry>>;
    getShedHistoryForAnimal(animalId: AnimalId): Promise<Array<ShedEntry>>;
    getTubChangeHistoryForAnimal(animalId: AnimalId): Promise<Array<TubChangeEntry>>;
    getUserLogo(): Promise<ExternalBlob | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeightHistoryForAnimal(animalId: AnimalId): Promise<Array<WeightEntry>>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    logShedAndTubChange(animalId: AnimalId): Promise<void>;
    logShedOnly(animalId: AnimalId): Promise<void>;
    logTubChangeOnly(animalId: AnimalId): Promise<void>;
    recordClutch(animalId: AnimalId, notes: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCustomHeading(heading: string): Promise<void>;
    updateWaterChange(): Promise<void>;
    uploadUserLogo(logo: ExternalBlob): Promise<void>;
}
