import chai from "chai";
import { chaiEthers } from "@nomicfoundation/hardhat-chai-matchers/chai-ethers";

chai.use(chaiEthers);

export const { expect } = chai;
