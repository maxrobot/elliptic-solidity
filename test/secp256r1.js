"use strict";

const assert = require("assert"); // node.js core module
const BigNumber = require('bignumber.js');
const EC = require('elliptic').ec;
const ec = new EC('p256');

require('chai')
 .use(require('chai-as-promised'))
 .should();

const Secp256r1 = artifacts.require("Secp256r1");

let toBigNumber = function(value) {
    if (!BigNumber.isBigNumber(value)) {
        return '0x'+value.toString(16)
    }
    return '0x'+value.toString(16);

}

contract('Secp256r1.js', (accounts) => {

    let secp256r1;

    beforeEach('intialise contracts for testing', async function() {
        secp256r1 = await Secp256r1.new();
    })

    describe('Verify Signed Data', async () => {
        it('Verify Using Static Data', async () => {
            // Takes public key [pubX+pubY], which has signed data hash producing sig[R+S] and returns true if it actually signed the data
            const pubX = toBigNumber(new BigNumber("a6ad1deeababc22e1eeba4bc93f6535ff95391a1981d9276bbe39b1ce473d6ed", 16));
            const pubY = toBigNumber(new BigNumber("688c2d5b0231d21e9f6ad264cfcdcf09aec15ea8c5c354f38b2fae95e82959e4", 16));
            const R = toBigNumber(new BigNumber("912177ddfa310e5daf1a0d53c567b3c19261cda206bf788eaa4a3a708f090856", 16));
            const S = toBigNumber(new BigNumber("1bd0b92ff302efae4782e16c1b3eeb32b05df7cca4c84d74535bd4fb613e02bb", 16));
            const hash = "0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e";
            
            let res = await secp256r1.Verify(pubX, pubY, hash, R, S);
            console.log("\tGas used to verify signature: " + res.receipt.gasUsed.toString());
            assert.equal(res.logs[0].args['valid'], true);
        })

        it('Generate P256 Key, Sign Data and Verify', async () => {
            const msg = 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e';

            // Generate keys
            var key = ec.genKeyPair();
            var pubPoint = key.getPublic();
            var pubX = toBigNumber(pubPoint.getX());
            var pubY = toBigNumber(pubPoint.getY());


            // Sign the message's msg (input must be an array, or a hex-string)
            let signature = key.sign(msg);
            let R = toBigNumber(signature.r);
            let S = toBigNumber(signature.s);

            
            let res = await secp256r1.Verify(pubX, pubY, '0x'+msg, R, S);
            console.log("\tGas used to verify signature: " + res.receipt.gasUsed.toString());
            assert.equal(res.logs[0].args['valid'], true);
        })

        it('Failure: Invalid P256 Public Key', async () => {
            // change the public slightly to make it invalid
            const pubX = toBigNumber(new BigNumber("a6ad1deeababc22e1eeba4bc93f6535ff95391a1981d9276bbe39b1ce473d6ed", 16)).slice(0, -2) + "fa";
            const pubY = toBigNumber(new BigNumber("688c2d5b0231d21e9f6ad264cfcdcf09aec15ea8c5c354f38b2fae95e82959e4", 16));
            const R = toBigNumber(new BigNumber("912177ddfa310e5daf1a0d53c567b3c19261cda206bf788eaa4a3a708f090856", 16));
            const S = toBigNumber(new BigNumber("1bd0b92ff302efae4782e16c1b3eeb32b05df7cca4c84d74535bd4fb613e02bb", 16));
            const hash = "0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e";
            
            await secp256r1.Verify(pubX, pubY, hash, R, S).should.be.rejected;
        })

        it('Failure: Invalid Signature', async () => {
            // change the signature slightly to make it invalid
            const pubX = toBigNumber(new BigNumber("a6ad1deeababc22e1eeba4bc93f6535ff95391a1981d9276bbe39b1ce473d6ed", 16));
            const pubY = toBigNumber(new BigNumber("688c2d5b0231d21e9f6ad264cfcdcf09aec15ea8c5c354f38b2fae95e82959e4", 16));
            const R = toBigNumber(new BigNumber("912177ddfa310e5daf1a0d53c567b3c19261cda206bf788eaa4a3a708f090856", 16)).slice(0, -2) + "aa";
            const S = toBigNumber(new BigNumber("1bd0b92ff302efae4782e16c1b3eeb32b05df7cca4c84d74535bd4fb613e02bb", 16));
            const hash = "0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e";
            
            await secp256r1.Verify(pubX, pubY, hash, R, S).should.be.rejected;
        })

        it('Failure: Invalid Data', async () => {
            // change the signature slightly to make it invalid
            const pubX = toBigNumber(new BigNumber("a6ad1deeababc22e1eeba4bc93f6535ff95391a1981d9276bbe39b1ce473d6ed", 16));
            const pubY = toBigNumber(new BigNumber("688c2d5b0231d21e9f6ad264cfcdcf09aec15ea8c5c354f38b2fae95e82959e4", 16));
            const R = toBigNumber(new BigNumber("912177ddfa310e5daf1a0d53c567b3c19261cda206bf788eaa4a3a708f090856", 16));
            const S = toBigNumber(new BigNumber("1bd0b92ff302efae4782e16c1b3eeb32b05df7cca4c84d74535bd4fb613e02bb", 16));
            const hash = "0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e".slice(0, -2) + "bb";
            
            await secp256r1.Verify(pubX, pubY, hash, R, S).should.be.rejected;
        })
    })

    describe('Basic EC Operations', async () => {

        it('Ec Point Addition', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = require('./data/add-jacobian-affine.json');

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const x2 = toBigNumber(new BigNumber(fixture['input'][2], 16));
                const y2 = toBigNumber(new BigNumber(fixture['input'][3], 16));

                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let P = [x1, y1, x2, y2];

                let res = await secp256r1.Add(P[0], P[1], P[2], P[3]);
                // console.log(res);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
             }
        })

        it('Ec Point Doubling', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = require('./data/double-jacobian-affine.json');

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));

                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let P = [x1, y1];

                let res = await secp256r1.Double(P[0], P[1], P[2]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
             }
        })


        it('Jacobian Addition', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = require('./data/add-jacobian.json');

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z1 = toBigNumber(new BigNumber(fixture['input'][2], 16));
                const x2 = toBigNumber(new BigNumber(fixture['input'][3], 16));
                const y2 = toBigNumber(new BigNumber(fixture['input'][4], 16));
                const z2 = toBigNumber(new BigNumber(fixture['input'][5], 16));
                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));
                const z3 = toBigNumber(new BigNumber(fixture['output'][2], 16));

                let P = [x1, y1, z1, x2, y2, z2];

                let res = await secp256r1._jAdd(P[0], P[1], P[2], P[3], P[4], P[5]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
                assert.equal(res[2].toString(16), z3.toString(10).slice(2));
             }
        })

        it('Jacobian Double - Edge case', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["72cbd243918790276c5c746cf4519820ee7f4b36fb2ac27aeaffaac68640dd9e","813f09630351889026105742fb6a6d6f0163a5bd59e578611f4be3814abaef60","d865bee79a7dc726b18d8408cbf34115844da7c61430f3fed2b8aa7585976a94"],
                    "output":["42b584e65ae61d0f8dee20f9da9b9cd3d840a43532cbe6da34d47232dda79722","f5eee53385bf702d945c7d78774d734d62a20a097deac2d8fddd4db0df4a7d20","284cd63b82e44d5c29535f556508ec553a11c5ecfb20a8f4785e442305ef4b4"]
                }
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z1 = toBigNumber(new BigNumber(fixture['input'][2], 16));
                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));
                const z3 = toBigNumber(new BigNumber(fixture['output'][2], 16));

                let res = await secp256r1._jDouble(x1, y1, z1);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
                assert.equal(res[2].toString(16), z3.toString(10).slice(2));
             }
        })

        it('Jacobian Addition - Point 1 is zero', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["3a84ab26ce5a414df351ddaeb8ca4ff9e25caf950b99716df556b9e40ae166e2","349805df5f532f97dd10b6fd6fee238325ff65bf0722cd1473721a52fa3dea27","1","0","0","0"],
                    "output":["3a84ab26ce5a414df351ddaeb8ca4ff9e25caf950b99716df556b9e40ae166e2","349805df5f532f97dd10b6fd6fee238325ff65bf0722cd1473721a52fa3dea27","1"]
                }
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z1 = toBigNumber(new BigNumber(fixture['input'][2], 16));
                const x2 = toBigNumber(new BigNumber(fixture['input'][3], 16));
                const y2 = toBigNumber(new BigNumber(fixture['input'][4], 16));
                const z2 = toBigNumber(new BigNumber(fixture['input'][5], 16));
                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));
                const z3 = toBigNumber(new BigNumber(fixture['output'][2], 16));

                let P = [x1, y1, z1, x2, y2, z2];

                let res = await secp256r1._jAdd(P[0], P[1], P[2], P[3], P[4], P[5]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
                assert.equal(res[2].toString(16), z3.toString(10).slice(2));
             }
        })


        it('Jacobian Addition - Point 2 is zero', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["0","0","0","5f5b588a35a1433300173ebbdb41a479b8230c6b2b2b350697755cc7af4e2424","fe9d0907cf4d4551327fc51ed93c0ef3ff04b06e5e798d85f5a841c55114bd5d","1"],
                    "output":["5f5b588a35a1433300173ebbdb41a479b8230c6b2b2b350697755cc7af4e2424","fe9d0907cf4d4551327fc51ed93c0ef3ff04b06e5e798d85f5a841c55114bd5d","1"]
                }
            };
            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z1 = toBigNumber(new BigNumber(fixture['input'][2], 16));
                const x2 = toBigNumber(new BigNumber(fixture['input'][3], 16));
                const y2 = toBigNumber(new BigNumber(fixture['input'][4], 16));
                const z2 = toBigNumber(new BigNumber(fixture['input'][5], 16));
                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));
                const z3 = toBigNumber(new BigNumber(fixture['output'][2], 16));

                let P = [x1, y1, z1, x2, y2, z2];

                let res = await secp256r1._jAdd(P[0], P[1], P[2], P[3], P[4], P[5]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
                assert.equal(res[2].toString(16), z3.toString(10).slice(2));
             }
        })

        it('Jacobian Double', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = require('./data/double-jacobian.json');

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z1 = toBigNumber(new BigNumber(fixture['input'][2], 16));

                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));
                const z3 = toBigNumber(new BigNumber(fixture['output'][2], 16));

                let P = [x1, y1, z1];

                let res = await secp256r1._jDouble(P[0], P[1], P[2]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
                assert.equal(res[2].toString(16), z3.toString(10).slice(2));
             }
        })

        it('Jacobian Double - Point is Zero', async () => {
            // Test data generated by golang crypto/elliptic library
            // var ECADD_TEST_DATA = require('./data/double-jacobian.json');
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["0","0","0"],
                    "output":["0","0","0"]
                }
            };
            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z1 = toBigNumber(new BigNumber(fixture['input'][2], 16));

                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));
                const z3 = toBigNumber(new BigNumber(fixture['output'][2], 16));

                let P = [x1, y1, z1];

                let res = await secp256r1._jDouble(P[0], P[1], P[2]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
                assert.equal(res[2].toString(16), z3.toString(10).slice(2));
             }
        })

        it('Jacobian double followed by addition', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["0","0","0","3a84ab26ce5a414df351ddaeb8ca4ff9e25caf950b99716df556b9e40ae166e2","349805df5f532f97dd10b6fd6fee238325ff65bf0722cd1473721a52fa3dea27","1"],
                    "output":["3a84ab26ce5a414df351ddaeb8ca4ff9e25caf950b99716df556b9e40ae166e2","349805df5f532f97dd10b6fd6fee238325ff65bf0722cd1473721a52fa3dea27"]
                }
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z = toBigNumber(new BigNumber(fixture['input'][2], 16));
                const Bx = toBigNumber(new BigNumber(fixture['input'][3], 16));
                const By = toBigNumber(new BigNumber(fixture['input'][4], 16));
                const Bz = toBigNumber(new BigNumber(fixture['input'][5], 16));

                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let res = await secp256r1._jDouble(x, y, z);
                res = await secp256r1._jAdd(Bx, By, Bz, res[0], res[1], res[2]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
             }
        })

        it('Jacobian double, addition, double', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["0","0","0","3a84ab26ce5a414df351ddaeb8ca4ff9e25caf950b99716df556b9e40ae166e2","349805df5f532f97dd10b6fd6fee238325ff65bf0722cd1473721a52fa3dea27","1"],
                    "output":["3efbbc62b16ddd811af7b116dbfba8a99e22280f1f8d477c70c4d6f1da7d1557","5496b2ec97d09e82b59509cd1fa587eb9957b714b7358cc8b08b81fd7f8ff527"]
                }
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z = toBigNumber(new BigNumber(fixture['input'][2], 16));
                const Bx = toBigNumber(new BigNumber(fixture['input'][3], 16));
                const By = toBigNumber(new BigNumber(fixture['input'][4], 16));
                const Bz = toBigNumber(new BigNumber(fixture['input'][5], 16));

                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let res = await secp256r1._jDouble(x, y, z);
                res = await secp256r1._jAdd(Bx, By, Bz, res[0], res[1], res[2]);
                res = await secp256r1._jDouble(res[0], res[1], res[2]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
             }
        })

        it('Scalar Multiplication', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["3a84ab26ce5a414df351ddaeb8ca4ff9e25caf950b99716df556b9e40ae166e2","349805df5f532f97dd10b6fd6fee238325ff65bf0722cd1473721a52fa3dea27",
                    "67fd9324008c01cd43c620246131241b4bd120acf3dc7ec7ff7e474b43556add"],
                    "output":["77f55b9620c882d547eb739adba3690ff506d95ac2915bbe10eff27fe97a9163","cee4d6e830e77a50932e3b80b6c154ad751067025c7d5c86552f68eb3556cd4e"]
                },
                "test2":{
                    "input":["6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
                    "4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5",
                    "67fd9324008c01cd43c620246131241b4bd120acf3dc7ec7ff7e474b43556add"],
                    "output":["b61389a919b38bbd4226392d9b7917a3d17721f6ae72cddd8655f009a1a4ca2d","7234b2d85b3c7ff55ec39107172f8eeb7e172a86e5c38e380080ce5c95237cce"]
                }
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const Bx = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const By = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const k  = toBigNumber(new BigNumber(fixture['input'][2], 16));
                // expected outputs
                const ax = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const ay = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let res = await secp256r1.ScalarMult(Bx, By, k);
                assert.equal(res[0].toString(16), ax.toString(10).slice(2));
                assert.equal(res[1].toString(16), ay.toString(10).slice(2));
             }
        })

        it('Scalar Base Multiplication', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["67fd9324008c01cd43c620246131241b4bd120acf3dc7ec7ff7e474b43556add"],
                    "output":["b61389a919b38bbd4226392d9b7917a3d17721f6ae72cddd8655f009a1a4ca2d","7234b2d85b3c7ff55ec39107172f8eeb7e172a86e5c38e380080ce5c95237cce"]
                }
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const k  = toBigNumber(new BigNumber(fixture['input'][0], 16));
                // expected outputs
                const ax = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const ay = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let res = await secp256r1.ScalarBaseMult(k);
                assert.equal(res[0].toString(16), ax.toString(10).slice(2));
                assert.equal(res[1].toString(16), ay.toString(10).slice(2));
             }
        })

        it('Affine from Jacobian', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["a8192cd218422577f1f8768e83d3883d52a71baa8bb2e7df2b9db730a62151a5","4d47f5e9ae881a54b8f3b165607074d57f1eb8738e2afdb48cd2aa3aa8a9b014",
                    "85ebab16168c999ca9b119d07963b963730551e886de9269da9cc5eb56063746"],
                    "output":["77f55b9620c882d547eb739adba3690ff506d95ac2915bbe10eff27fe97a9163","cee4d6e830e77a50932e3b80b6c154ad751067025c7d5c86552f68eb3556cd4e"]
                }
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const z  = toBigNumber(new BigNumber(fixture['input'][2], 16));
                // expected outputs
                const xx = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const yy = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let res = await secp256r1._affineFromJacobian(x, y, z);
                assert.equal(res[0].toString(16), xx.toString(10).slice(2));
                assert.equal(res[1].toString(16), yy.toString(10).slice(2));
             }
        })

        it('Hash to Integer', async () => {
            var ECADD_TEST_DATA = {
                "test1": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"
            };

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x = toBigNumber(new BigNumber(fixture, 16));

                let res = await secp256r1._hashToUint(x);
                assert.equal(res.toString(16), x.toString(10).slice(2));
             }
        })

        it('Inverse modulo', async () => {
            var ECADD_TEST_DATA = {
                "test1": {
                    "input": "4d47f5e9ae881a54b8f3b165607074d57f1eb8738e2afdb48cd2aa3aa8a9b014",
                    "output": "4725a2b731ce5012854f55d785ef90f7c6f4556f7e658f979d1bb29a135ebfc5"
                },
                "test2": {
                    "input": "1bd0b92ff302efae4782e16c1b3eeb32b05df7cca4c84d74535bd4fb613e02bb",
                    "output": "9141faf25cfefd20fae74dd1121537a062b5ce163d1cf55847b59a71e5541bd2"
                }
                
            };

            const nn = toBigNumber(new BigNumber("FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551", 16));

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const s = toBigNumber(new BigNumber(fixture['input'], 16));
                const w = toBigNumber(new BigNumber(fixture['output'], 16));                

                let res = await secp256r1._invmod(s, nn);
                assert.equal(res.toString(16), w.toString(10).slice(2));
            }
        })
    })
});
