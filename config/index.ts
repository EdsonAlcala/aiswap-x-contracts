import { DeploymentConfig } from "../types";

export const CONFIG: DeploymentConfig = {
    marketMakerAddress: "0xEB40824601A19BdF20542a677E52f1E4297c66Fa", // account 2
    sampleUserAddress: "0xC12AE746678740A052B60c3D6b591ed7ADee5926", // account 3
    arbitrumGoerliRPCURL: `https://arbitrum-goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    goerliRPCURL: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    arbitrumMainnetRPCURL: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    gnosisRPCURL: `https://rpc.gnosischain.com/`,
    lineaRPCURL: `https://linea-mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    arbitrumRPCURL: `https://arb-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ""}`,
}