export interface requestedItem {
    catalogueId: string;
    drugId: string;
    quantity: number;
    quantityType: string;
}

export interface Composition{
    assetId: string;
    catalogueId: string;
    drugId: string;
    quantity: number;
    quantityType: string;
}

export interface sentItem {
    [catalogueId: string]: {
        assetId: string;
        drugId: string;
        quantity: number;
        quantityType: string;
    }[];
}
