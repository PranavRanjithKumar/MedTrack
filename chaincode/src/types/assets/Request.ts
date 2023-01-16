import { Object, Property } from "fabric-contract-api";
import RequestStatus from "../enums/status";
import location from "../Location";
import Composition, { sentItems } from "./Composition";

@Object()
export default class Request {
    @Property()
    public id: string;

    @Property()
    public docType: "request";

    @Property()
    public requestingOrgId: string;

    @Property()
    public transferringOrgId: string;

    @Property()
    public requestedDate: string;

    @Property()
    public requestedFromLocation: location;

    @Property()
    public status: RequestStatus;

    @Property()
    public requestedItems: Composition[];

    @Property()
    public packageId: string | null;

    @Property()
    public sentItems: sentItems;

    @Property()
    public sentDate: string;

    @Property()
    public sentFromLocation: location;

    @Property()
    public receivedDate: string;
}
