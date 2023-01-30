import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import RawMaterial from "./types/models/RawMaterial";

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

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadAsset(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }
}
