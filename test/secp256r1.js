"use strict";

const verbose = false;

const assert = require("assert"); // node.js core module
const BigNumber = require('bignumber.js');
const EC = require('elliptic').ec;
const ec = new EC('p256');

const Secp256r1 = artifacts.require("Secp256r1");
const Ecsol = artifacts.require("Ecsol");

const pp = new BigNumber('FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF', 16);
const gx = new BigNumber('6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296', 16);
const gy = new BigNumber('4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5', 16);
const n = new BigNumber('FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551', 16);

const n2 = new BigNumber('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141', 16);

let toBigNumber = function(value) {
    if (!BigNumber.isBigNumber(value)) {
        return '0x'+value.toString(16)
    }
    return '0x'+value.toString(16);

}

function log(S) {
    if (verbose) {
        console.log("\t" + S);
    }
}

contract.only('Secp256r1.js', (accounts) => {

    let secp256r1;

    beforeEach('intialise contracts for testing', async function() {
        secp256r1 = await Secp256r1.new();
        let ecsol = await Ecsol.new();
    })

    describe('ECCurve Test', async () => {

        it('Ec Point Addition', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = require('./data/add-jacobian.json');

            let fixture;
            for (var i in ECADD_TEST_DATA) {
                fixture = ECADD_TEST_DATA[i];

                // get inputs
                const x1 = toBigNumber(new BigNumber(fixture['input'][0], 16));
                const y1 = toBigNumber(new BigNumber(fixture['input'][1], 16));
                const x2 = toBigNumber(new BigNumber(fixture['input'][3], 16));
                const y2 = toBigNumber(new BigNumber(fixture['input'][4], 16));
                // expected outputs
                const x3 = toBigNumber(new BigNumber(fixture['output'][0], 16));
                const y3 = toBigNumber(new BigNumber(fixture['output'][1], 16));

                let P = [x1, y1, x2, y2];

                let res = await secp256r1.Add(P[0], P[1], P[2], P[3]);
                assert.equal(res[0].toString(16), x3.toString(10).slice(2));
                assert.equal(res[1].toString(16), y3.toString(10).slice(2));
             }
        })

        it('Ec Point Doubling', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = require('./data/double-jacobian.json');

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

        it('Jacobian Addition - P1 zero', async () => {
            // Test data generated by golang crypto/elliptic library
            var ECADD_TEST_DATA = {
                "test1":{
                    "input":["5f5b588a35a1433300173ebbdb41a479b8230c6b2b2b350697755cc7af4e2424","fe9d0907cf4d4551327fc51ed93c0ef3ff04b06e5e798d85f5a841c55114bd5d","1","0","0","0"],
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

        it('Jacobian Addition - P2 zero', async () => {
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
    })
});
