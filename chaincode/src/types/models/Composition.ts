export type requestedItem = {
    catalogueId: string;
    quantity: number;
    quantityType: string;
}[];

export type Composition = {
    assetId: string;
    catalogueId: string;
    quantity: number;
    quantityType: string;
}[];

export type sentItem = {
    [catalogueId: string]: {
        assetId: string;
        batchSize?: number;
        quantity: number;
        quantityType: string;
    }[];
}[];
