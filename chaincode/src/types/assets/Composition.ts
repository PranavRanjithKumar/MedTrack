type Composition = {
    compoundId: string;
    compoundName: string;
    quantityUsed: number;
    quantityType: string;
};

export type sentItems = {
    catalogueId: [Composition];
};

export default Composition;
