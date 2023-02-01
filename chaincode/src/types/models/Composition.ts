export type requestedItem = {
    catalogueId: string;
    drugId: string;
    quantity: number;
    quantityType: string;
}[];

export type Composition = {
    assetId: string;
    catalogueId: string;
    drugId: string;
    quantity: number;
    quantityType: string;
}[];

export type sentItem = {
    [catalogueId: string]: {
        assetId: string;
        drugId: string;
        quantity: number;
        quantityType: string;
    }[];
}[];
