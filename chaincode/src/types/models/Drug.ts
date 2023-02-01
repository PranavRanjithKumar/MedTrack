import { Object, Property } from "fabric-contract-api";
import location from "../Location";
import { Composition } from "./Composition";

@Object()
export default class Drug {
    @Property()
    public id: string;

    @Property()
    public docType: "drug";

    @Property()
    public name: "string";

    @Property()
    public description: "string";

    @Property()
    public catalogueId: string;

    @Property()
    public currentOwnerOrgType: "manufacturer" | "distributor" | "retailer";

    @Property()
    public currentOwnerOrgId: string;

    @Property()
    public currentOwnerLocation: location;

    @Property()
    public quantityProduced: number;

    @Property()
    public quantityType: string;

    @Property()
    public manufacturingDate: string;

    @Property()
    public expiryDate: string;

    @Property()
    public manufacturingOrgId: string;

    @Property()
    public manufacturingOrgLocation: location;

    @Property()
    public constitution: Composition[];
}
