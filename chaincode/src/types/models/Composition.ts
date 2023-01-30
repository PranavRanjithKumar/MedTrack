export default interface requestedItem {
    catalogueId: string;
    drugId: string;
    quantityRequested: number;
    quantityType: string;
}

export interface sentItem {
    [catalogueId: string]: {
        assetId: string;
        drugId: string;
        quantityRequested: number;
        quantityType: string;
    }[];
}
