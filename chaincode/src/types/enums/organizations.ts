import GenericEnum from "./genericEnum";

const orgs = {
    SUPPLIER: "supplier",
    MANUFACTURER: "manufacturer",
    DISTRIBUTOR: "distributor",
    RETAILER: "retailer",
    CONSUMER: "consumer",
} as const;

type Organization = GenericEnum<typeof orgs>;

export default Organization;
