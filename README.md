# Elliptic Solidity
Solidity smart contract project to allow the verification of ECDSA signatures.

Verification of a signature costs approx. 1 million gas.

## Curves Implemented:
* secp256r1/prime256v1/P-256

## How Do I Use It?
The contract aims to allow on-chain verification of ECDSA signatures. Thus the contract takes the signature, split into r and s, the signed data and the public key that purports to have produced the signature.

```
    function Verify(uint X, uint Y, uint r, uint s, bytes memory input)
        public pure returns (bool)
```

* `uint X, Y` EC coordinates of the public key
* `uint r, s` signature parts
* `bytes memory input` the signed data/message

If the signature is valid then `true` is returned else `false`.

## Run the Tests
To run the tests, first clone and enter the repo:
```
git clone https://github.com/maxrobot/elliptic-solidity.git
cd elliptic-solidity
```

Then,
```
npm install
npm run testrpc
```

open a new terminal and in the same directory run,
```
npm run test
```

## References
[hyperelliptic.org](https://hyperelliptic.org/)

[jbaylina/ecsol](https://github.com/jbaylina/ecsol)

[rynobey/multiexponent](https://github.com/rynobey/multi-exponent)

[SEC 2: Recommended Elliptic Curve Domain Parameters](http://www.secg.org/SEC2-Ver-1.0.pdf)
