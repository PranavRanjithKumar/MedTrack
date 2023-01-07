import GenericEnum from "./genericEnum";

const status = {
    SENT: "sent",
    PROCESSED: "processed",
    RECEIVED: "received",
} as const;

type RequestStatus = GenericEnum<typeof status>;

export default RequestStatus;
