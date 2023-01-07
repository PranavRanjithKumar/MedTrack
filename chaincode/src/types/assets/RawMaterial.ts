import { Object, Property } from "fabric-contract-api";
import location from "../Location";

@Object()
export default class RawMaterial {
    @Property()
    public id: string;

    @Property()
    public docType: "raw-material";

    @Property()
    public name: "string";

    @Property()
    public description: "string";

    @Property()
    public catalogueId: string;

    @Property()
    public currentOwnerOrgType: "supplier" | "manufacturer";

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
}
