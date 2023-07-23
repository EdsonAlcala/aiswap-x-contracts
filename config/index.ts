import { DeploymentConfig } from "../types";

export const CONFIG: DeploymentConfig = {
    marketMakerAddress: "0x407C12D39b01E50Cf8a25d41fd349743193D082C", // account 2
    sampleUserAddress: "0x23BF95De9F90338F973056351C8Cd2CB78cbe52f", // account 3
    arbitrumGoerliRPCURL: `https://arbitrum-goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    goerliRPCURL: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    arbitrumMainnetRPCURL: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    gnosisRPCURL: `https://rpc.gnosischain.com/`,
    lineaRPCURL: `https://linea-mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
    arbitrumRPCURL: `https://arb-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ""}`,
}