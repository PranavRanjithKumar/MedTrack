import { Object, Property } from "fabric-contract-api";
import RequestStatus from "../enums/status";
import location from "../Location";
import { requestedItem, sentItem } from "./Composition";

@Object()
export default class Request {
    @Property()
    public id: string;

    @Property()
    public docType: "request";

    @Property()
    public requestingOrgId: string;

    @Property()
    public requestingOrgType: string;

    @Property()
    public transferringOrgId: string;

    @Property()
    public transferringOrgType: string;

    @Property()
    public requestedDate: string;

    @Property()
    public requestedFromLocation: location;

    @Property()
    public status: RequestStatus;

    @Property()
    public requestedItems: requestedItem[];

    @Property()
    public packageId?: string;

    @Property()
    public sentItems?: sentItem[];

    @Property()
    public sentDate?: string;

    @Property()
    public sentFromLocation?: location;

    @Property()
    public receivedDate?: string;
}
