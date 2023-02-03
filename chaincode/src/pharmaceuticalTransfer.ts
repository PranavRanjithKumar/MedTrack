import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import location from "./types/Location";
import { sentItem } from "./types/models/Composition";
import Drug from "./types/models/Drug";
import RawMaterial from "./types/models/RawMaterial";
import Request from "./types/models/Request";

@Info({
    title: "PharmaceuticalTransfer",
    description:
        "Smart contract for recording transactions in pharmaceutical industry",
})
export class PharmaceuticalTransfer extends Contract {
    // CreateAsset issues a new asset to the world state with given details.
    @Transaction()
    public async CreateRawMaterial(
        ctx: Context,
        rawMaterial: string
    ): Promise<void> {
        const newRawMaterial = JSON.parse(rawMaterial) as RawMaterial;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(
            newRawMaterial.id,
            Buffer.from(stringify(sortKeysRecursive(newRawMaterial)))
        );
    }

    @Transaction()
    public async CreateDrug(ctx: Context, drug: string): Promise<void> {
        const newDrug = JSON.parse(drug) as Drug;
        // We need to check if the composition items used in the drug are actually
        // raw materials and are owned by the organization
        const allPromises = Promise.all(
            newDrug.constitution.map(
                (item) => this.OrgOwnsAsset(ctx, item.assetId),
                "raw-material"
            )
        );

        try {
            await allPromises;
        } catch (error) {
            throw error;
        }

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(
            newDrug.id,
            Buffer.from(stringify(sortKeysRecursive(newDrug)))
        );
    }

    @Transaction(false)
    @Returns("boolean")
    public async AssetExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadAsset(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        return assetJSON.toString();
    }

    @Transaction(false)
    @Returns("boolean")
    public async OrgOwnsAsset(
        ctx: Context,
        id: string,
        type = undefined
    ): Promise<boolean> {
        // Check if the asset exists
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`NOTFOUNDERROR: The asset does not exist`);
        }
        const assetString = await this.ReadAsset(ctx, id);
        const rawMaterialOrDrug = JSON.parse(assetString) as RawMaterial | Drug;

        // TODO: Comment it later
        const clientOrgId = ctx.clientIdentity.getAttributeValue("org");

        if (rawMaterialOrDrug.currentOwnerOrgId !== clientOrgId)
            throw new Error(
                `FORBIDDENERROR: The asset does not belong to this organization`
            );

        if (type && rawMaterialOrDrug.docType !== type)
            throw new Error(
                `FORBIDDENERROR: The asset does not belong to this organization`
            );

        return true;
    }

    // Demand Items from the stakeholders
    @Transaction()
    public async makeRequest(ctx: Context, request: string) {
        const newRequest = JSON.parse(request) as Request;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(
            newRequest.id,
            Buffer.from(stringify(sortKeysRecursive(newRequest)))
        );
    }

    @Transaction()
    public async initiateTransfer(
        ctx: Context,
        requestId: string,
        transferId: string,
        sentItems: string,
        sentDate: string,
        sentFromLocation: string
    ) {
        // Check if the request exists
        const exists = await this.AssetExists(ctx, requestId);
        if (!exists) {
            throw new Error(`NOTFOUNDERROR: The asset does not exist`);
        }
        const assetString = await this.ReadAsset(ctx, requestId);

        // Get the Request
        const request = JSON.parse(assetString) as Request;
        const sentItemsForReq = JSON.parse(sentItems) as sentItem;

        //check if the organization can make the transfer
        // TODO: Comment it later
        const clientOrgId = ctx.clientIdentity.getAttributeValue("org");

        if (request.transferringOrgId !== clientOrgId)
            throw new Error(
                "FORBIDDEN: The request is not meant for your organization"
            );

        // get the requested items first
        const requestedItemCatalogueIds = new Set(
            request.requestedItems.map((item) => item.catalogueId)
        );

        // checks if both all assets exist and belong to the transferring organization
        const drugIds = sentItemsForReq.flatMap((item) =>
            Object.values(item)[0].map((catalogueItem) => catalogueItem.assetId)
        );

        const allPromises = Promise.all(
            drugIds.map((drug) => this.OrgOwnsAsset(ctx, drug))
        );

        // Throw error if any asset doesn't belong to the organization
        try {
            await allPromises;
        } catch (error) {
            throw error;
        }

        // Fetch the catalogue id of sent items
        let transformedAssets: (RawMaterial | Drug)[] = [];
        let sentItemsCatalogueIds: Set<string> = new Set();
        for (const drugId of drugIds) {
            const assetString = await this.ReadAsset(ctx, drugId);
            const rawMaterialOrDrug = JSON.parse(assetString) as
                | RawMaterial
                | Drug;
            let updatingAsset = { ...rawMaterialOrDrug };
            if (
                (updatingAsset.docType === "raw-material" &&
                    request.requestingOrgType === "manufacturer") ||
                (updatingAsset.docType === "drug" &&
                    (request.requestingOrgType === "distributor" ||
                        request.requestingOrgType === "retailer"))
            ) {
                updatingAsset.currentOwnerOrgType = request.requestingOrgType;
            }
            updatingAsset.currentOwnerOrgId = request.requestingOrgId;
            updatingAsset.currentOwnerLocation = request.requestedFromLocation;

            transformedAssets.push(updatingAsset);
            sentItemsCatalogueIds.add(updatingAsset.catalogueId);
        }

        // Check if the requested and sent items are the same
        if (
            !(requestedItemCatalogueIds.size === sentItemsCatalogueIds.size) ||
            ![...requestedItemCatalogueIds].every((x) =>
                sentItemsCatalogueIds.has(x)
            )
        )
            throw new Error(
                "MISMATCHERROR: Sent items doesn't match the requested items"
            );

        // Reflect the transfer
        for (const items of transformedAssets) {
            await ctx.stub.putState(
                items.id,
                Buffer.from(stringify(sortKeysRecursive(items)))
            );
        }

        // Record the transaction
        request.status = "processed";
        request.packageId = transferId;
        request.sentItems = sentItemsForReq;
        request.sentDate = sentDate;
        request.sentFromLocation = JSON.parse(sentFromLocation) as location;

        await ctx.stub.putState(
            request.id,
            Buffer.from(stringify(sortKeysRecursive(request)))
        );
    }
}
