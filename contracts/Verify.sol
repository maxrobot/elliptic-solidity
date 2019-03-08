// pragma solidity 0.5.1;

// /// @title Verify ECDSA signatures from a number of NIST Curves
// contract Verify {

//     uint256 orderP256 = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551;

//     event Uint256Event(uint256 output);

//     constructor() public {}

//     /**
//     * Verifies a signed message using a specific NIST curve
//     * @param r part of the signature
//     * @param s part of the signature
//     * @return {boolean}
//     */
//     function verifySignature(uint256 r, uint256 s) public returns (bool) {
//         require(r < orderP256 && s < orderP256, "Signature Invalid!");
//         emit Uint256Event(r);
//         emit Uint256Event(s);
//         emit Uint256Event(orderP256);
//         return true;

//     }

// }