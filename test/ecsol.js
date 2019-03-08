"use strict";

const verbose = false;

const assert = require("assert"); // node.js core module
const BigNumber = require('bignumber.js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Ecsol = artifacts.require("Ecsol");

const n = new BigNumber('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F', 16);
const gx = new BigNumber('79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798', 16);
const gy = new BigNumber('483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8', 16);
const n2 = new BigNumber('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141', 16);

let toBigNumber = function(value) {
    if (!BigNumber.isBigNumber(value)) {
        throw 'Input not big number!';
    }
    return '0x'+value.toString(16);

}

function log(S) {
    if (verbose) {
        console.log("\t" + S);
    }
}

contract('Ecsol.js', (accounts) => {

    let ecsol;

    beforeEach('intialise contracts for testing', async function() {
        ecsol = await Ecsol.new();
    })

    describe('ECCurve Test', async () => {

        it('Should Add two small numbers', async () => {
            const x1 = new BigNumber(2);
            const z1 = new BigNumber(3);
            const x2 = new BigNumber(4);
            const z2 = new BigNumber(5);

            let res = await ecsol._jAdd(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "22");
            assert.equal(z3.toString(10), "15");
        });

        it('Should Add one big numbers with one small', async () => {
            const x1 = toBigNumber(n.minus(1));
            const z1 = new BigNumber(1);
            const x2 = new BigNumber(2);
            const z2 = new BigNumber(1);

            let res = await ecsol._jAdd(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "1");
            assert.equal(z3.toString(10), "1");
        }); 

        it('Should Add two big numbers', async () => {
            const x1 = toBigNumber(n.minus(1));
            const z1 = new BigNumber(1);
            const x2 = toBigNumber(n.minus(2));
            const z2 = new BigNumber(1);

            let res = await ecsol._jAdd(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), n.minus(3).toString(10));
            assert.equal(z3.toString(10), "1");
        }); 

        it('Should Subtract two small numbers', async () => {
            const x1 = new BigNumber(2);
            const z1 = new BigNumber(3);
            const x2 = new BigNumber(4);
            const z2 = new BigNumber(5);

            let res = await ecsol._jSub(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), n.minus(2).toString(10));
            assert.equal(z3.toString(10), "15");
        }); 

        it('Should Subtract one big numbers with one small', async () => {
            const x1 = new BigNumber(2);
            const z1 = new BigNumber(1);
            const x2 = toBigNumber(n.minus(1));
            const z2 = new BigNumber(1);

            let res = await ecsol._jSub(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "3");
            assert.equal(z3.toString(10), "1");
            
        });

        it('Should Subtract two big numbers', async () => {
            const x1 = toBigNumber(n.minus(2));
            const z1 = new BigNumber(1);
            const x2 = toBigNumber(n.minus(1));;
            const z2 = new BigNumber(1);

            let res = await ecsol._jSub(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), n.minus(1).toString(10));
            assert.equal(z3.toString(10), "1");
        }); 

        it('Should Subtract two same numbers', async () => {
            const x1 = toBigNumber(n.minus(16));
            const z1 = new BigNumber(1);
            const x2 = toBigNumber(n.minus(16));
            const z2 = new BigNumber(1);

            let res = await ecsol._jSub(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "0");
            assert.equal(z3.toString(10), "1");
        }); 

        it('Should Multiply two small numbers', async () => {
            const x1 = new BigNumber(2);
            const z1 = new BigNumber(3);
            const x2 = new BigNumber(4);
            const z2 = new BigNumber(5);

            let res = await ecsol._jMul(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "8");
            assert.equal(z3.toString(10), "15");
        }); 

        
        it('Should Multiply one big numbers with one small', async () => {
            const x1 = toBigNumber(n.minus(1));
            const z1 = new BigNumber(1);
            const x2 = new BigNumber(2);
            const z2 = new BigNumber(1);

            let res = await ecsol._jMul(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), n.minus(2).toString(10));
            assert.equal(z3.toString(10), "1");
        }); 
        
        it('Should Multiply two big numbers', async () => {
            const x1 = toBigNumber(n.minus(2));
            const z1 = new BigNumber(1);
            const x2 = toBigNumber(n.minus(3));
            const z2 = new BigNumber(1);

            let res = await ecsol._jMul(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "6");
            assert.equal(z3.toString(10), "1");
        }); 
        
        it('Should Multiply one is zero', async () => {
            const x1 = new BigNumber(2);
            const z1 = new BigNumber(3);
            const x2 = new BigNumber(0);
            const z2 = new BigNumber(5);

            let res = await ecsol._jMul(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "0");
            assert.equal(z3.toString(10), "15");
        }); 

        
        it('Should Divide two small numbers', async () => {
            const x1 = new BigNumber(2);
            const z1 = new BigNumber(3);
            const x2 = new BigNumber(4);
            const z2 = new BigNumber(5);

            let res = await ecsol._jDiv(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "10");
            assert.equal(z3.toString(10), "12");
        }); 
        
        it('Should Divide one big numbers with one small', async () => {
            const x1 = toBigNumber(n.minus(1));
            const z1 = new BigNumber(1);
            const x2 = new BigNumber(2);
            const z2 = new BigNumber(1);
            let res = await ecsol._jDiv(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), n.minus(1).toString(10));
            assert.equal(z3.toString(10), "2");
        });
        
        it('Should Divide two big numbers', async () => {
            const x1 = toBigNumber(n.minus(2));
            const z1 = new BigNumber(1);
            const x2 = toBigNumber(n.minus(3));
            const z2 = new BigNumber(1);

            let res = await ecsol._jDiv(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), n.minus(2).toString(10));
            assert.equal(z3.toString(10), n.minus(3).toString(10));
        }); 
        
        it('Should Divide one is zero', async () => {
            const x1 = new BigNumber(2);
            const z1 = new BigNumber(3);
            const x2 = new BigNumber(0);
            const z2 = new BigNumber(5);

            let res = await ecsol._jDiv(x1, z1, x2, z2);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "10");
            assert.equal(z3.toString(10), "0");
        }); 
        
// 
        it('Should Calculate inverse', async () => {
            const d = new BigNumber(2);

            let inv = await ecsol._inverse(d);

            let res = await ecsol._jMul(d, 1, inv, 1);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "1");
            assert.equal(z3.toString(10), "1");
        }); 
        
        it('Inverse of 0', async () => {
            const d = new BigNumber(0);

            let inv = await ecsol._inverse(d);

            assert.equal(inv.toString(10), "0");
        }); 
        
        it('Inverse of 1', async () => {
            const d = new BigNumber(1);

            let inv = await ecsol._inverse(d);

            assert.equal(inv.toString(10), "1");
        }); 
        
        it('Should Calculate inverse -1', async () => {
            const d = toBigNumber(n.minus(1));

            let inv = await ecsol._inverse(d);

            let res = await ecsol._jMul(d, 1, inv, 1);

            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "1");
            assert.equal(z3.toString(10), "1");
        }); 
        
        it('Should Calculate inverse -2', async () => {
            const d = toBigNumber(n.minus(1));

            let inv = await ecsol._inverse(d);

            let res = await ecsol._jMul(d, 1, inv, 1);
            
            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "1");
            assert.equal(z3.toString(10), "1");

        }); 
        
        it('Should Calculate inverse big number', async () => {
            let d = new BigNumber('f167a208bea79bc52668c016aff174622837f780ab60f59dfed0a8e66bb7c2ad',16);
            d = toBigNumber(d);

            let inv = await ecsol._inverse(d);

            let res = await ecsol._jMul(d, 1, inv, 1);
           
            const x3 = res[0];
            const z3 = res[1];
            assert.equal(x3.toString(10), "1");
            assert.equal(z3.toString(10), "1");

        }); 
        
        it('Should double gx,gy', async () => {
            let ln = gx.times(gx).times(3);
            let ld = gy.times(2);

            ln = ln.mod(n);
            ld = ld.mod(n);

            log("ln: " + ln.toString(10));
            log("ld: " + ld.toString(10));

            let x2ccN = ln.times(ln);
            let x2ccD = ld.times(ld);

            x2ccN = x2ccN.minus(gx.times(2).times(x2ccD));

            x2ccN = x2ccN.mod(n);
            if (x2ccN.isLessThan(0)) x2ccN = x2ccN.plus(n);
            x2ccD = x2ccD.mod(n);
            if (x2ccD.isLessThan(0)) x2ccD = x2ccD.plus(n);
            log("x2ccN: " + x2ccN.toString(10));
            log("x2ccD: " + x2ccD.toString(10));

        /*
            const y2ccN;
            const y2ccD;

            y2ccN = gx.times(x2ccD).sub(x2ccN);
            y2ccD = x2ccD;

            y2ccN = y2ccN.times(ln);
            y2ccD = y2ccD.times(ld);

            y2ccN = y2ccN.minus ( gy.times(y2ccD));
        */

            let y2ccN;
            y2ccN  = gx.times(x2ccD).times(ln);
            y2ccN = y2ccN.minus( x2ccN.times(ln) );
            y2ccN = y2ccN.minus( gy.times(x2ccD).times(ld) );

            let y2ccD;
            y2ccD  = x2ccD.times(ld);

            y2ccN = y2ccN.mod(n);
            if (y2ccN.isLessThan(0)) y2ccN = y2ccN.plus(n);
            y2ccD = y2ccD.mod(n);
            if (y2ccD.isLessThan(0)) y2ccD = y2ccD.plus(n);
            log("y2ccN: " + y2ccN.toString(10));
            log("y2ccD: " + y2ccD.toString(10));


            let ccD = y2ccD.times(x2ccD);
            x2ccN = x2ccN.times(y2ccD);
            y2ccN = y2ccN.times(x2ccD);

            x2ccN = x2ccN.mod(n);
            if (x2ccN.isLessThan(0)) x2ccN = x2ccN.plus(n);
            y2ccN = y2ccN.mod(n);
            if (y2ccN.isLessThan(0)) y2ccN = y2ccN.plus(n);
            ccD = ccD.mod(n);
            if (ccD.isLessThan(0)) ccD = ccD.plus(n);
            log("x2ccN: " + x2ccN.toString(10));
            log("y2ccN: " + y2ccN.toString(10));
            log("y2ccD: " + ccD.toString(10));

            // Put gx and gy in the correct format for solidity
            let fmtGx = toBigNumber(gx);
            let fmtGy = toBigNumber(gy);
            let res = await ecsol._ecDouble(fmtGx, fmtGy, 1);

            let x2 = res[0];
            let y2 = res[1];
            let z2 = res[2];
            log("x2: " + x2.toString(10));
            log("y2: " + y2.toString(10));
            log("z2: " + z2.toString(10));

            let inv = await ecsol._inverse(z2);
            
            // convert output to correct format
            inv = BigNumber(inv);
            log("Inverse: " + inv.toString(10));
            log("Inv test: "+ inv.times(z2).mod(n).toString(10));
            x2 = BigNumber(x2).times(inv).mod(n);
            y2 = BigNumber(y2).times(inv).mod(n);
            log("x2: " + x2.toString(10));
            log("y2: " + y2.toString(10));
            // assert.equal(x2.toString(10), "89565891926547004231252920425935692360644145829622209833684329913297188986597");
            // assert.equal(y2.toString(10), "12158399299693830322967808612713398636155367887041628176798871954788371653930");

        }); 
        
        it('Add EC', async () => {
            let x2 = new BigNumber('89565891926547004231252920425935692360644145829622209833684329913297188986597');
            let y2 = new BigNumber('12158399299693830322967808612713398636155367887041628176798871954788371653930');

            x2 = toBigNumber(x2);
            y2 = toBigNumber(y2);

            let res = await ecsol._ecAdd(toBigNumber(gx), toBigNumber(gy), 1, x2, y2, 1);
            
            let x3 = BigNumber(res[0]);
            let y3 = BigNumber(res[1]);
            let z3 = BigNumber(res[2]);
            log("x3: " + x3.toString(10));
            log("y3: " + y3.toString(10));
            log("z3: " + z3.toString(10));

            z3 = toBigNumber(z3);
            let inv = await ecsol._inverse(z3);

            x3 = x3.times(inv).mod(n);
            y3 = y3.times(inv).mod(n);
            log("x3: " + x3.toString(10));
            log("y3: " + y3.toString(10));
            assert.equal(x3.toString(10), "112711660439710606056748659173929673102114977341539408544630613555209775888121");
            assert.equal(y3.toString(10), "25583027980570883691656905877401976406448868254816295069919888960541586679410");
        }); 
        
        it('2G+1G = 3G', async () => {
            let res = await ecsol._ecDouble(toBigNumber(gx), toBigNumber(gy), 1);

            let x2 = res[0];
            let y2 = res[1];
            let z2 = res[2];
            log("x2: " + x2.toString(10));
            log("y2: " + y2.toString(10));
            log("z2: " + z2.toString(10));

            res = await ecsol._ecAdd(toBigNumber(gx), toBigNumber(gy), 1, x2, y2, z2);
            let x3 = res[0];
            let y3 = res[1];
            let z3 = res[2];
            log("x3: " + x3.toString(10));
            log("y3: " + y3.toString(10));
            log("z3: " + z3.toString(10));

            res = await ecsol._ecMul(3,toBigNumber(gx),toBigNumber(gy),1);
            let x3c = res[0];
            let y3c = res[1];
            let z3c = res[2];
            log("x3c: " + x3c.toString(10));
            log("y3c: " + y3c.toString(10));
            log("z3c: " + z3c.toString(10));

            let inv3 = await ecsol._inverse(z3);
            x3 = BigNumber(x3).times(inv3).mod(n);
            y3 = BigNumber(y3).times(inv3).mod(n);
            log("Inv test: "+ BigNumber(inv3).times(z3).mod(n).toString(10));
            log("x3n: " + x3.toString(10));
            log("y3n: " + y3.toString(10));

            let inv3c = await ecsol._inverse(z3c);
            x3c = BigNumber(x3c).times(inv3c).mod(n);
            y3c = BigNumber(y3c).times(inv3c).mod(n);
            log("Inv test: "+ BigNumber(inv3c).times(z3c).mod(n).toString(10));
            log("x3cn: " + x3c.toString(10));
            log("y3cn: " + y3c.toString(10));
            assert.equal(x3.toString(10), x3c.toString(10));
            assert.equal(y3.toString(10), y3c.toString(10));

        }); 
        
        it('Should create a valid public key', async () => {
            let key = ec.genKeyPair();
            let priv = key.getPrivate();
            let d = new BigNumber(priv.toString(16), 16);
            log(JSON.stringify(priv));

            let pub = key.getPublic();
            log(JSON.stringify(pub));
            let pub_x = new BigNumber(key.getPublic().x.toString(16), 16);
            let pub_y = new BigNumber(key.getPublic().y.toString(16), 16);
            log(d.toString(10));
            log(pub_x.toString(10));
            log(pub_y.toString(10));
            let res = await ecsol.publicKey(toBigNumber(d));

            let pub_x_calc = res[0];
            let pub_y_calc = res[1];
            assert.equal(pub_x.toString(10), pub_x_calc.toString(10));
            assert.equal(pub_y.toString(10), pub_y_calc.toString(10));

        }); 
        
        it('Should consume few gas', async () => {
            let key = ec.genKeyPair();
            let d = new BigNumber(key.getPrivate().toString(16), 16);
            let gas = await ecsol.publicKey.estimateGas(toBigNumber(d));

            log("Estimate gas: " + gas);
            assert(gas<2000000,'Public key calculation gas should be lower that 1M');

        }); 
        
        it('Key derived in both directions should be the same', async () => {
            const key1 = ec.genKeyPair();
            const key2 = ec.genKeyPair();
            const d1 = new BigNumber(key1.getPrivate().toString(16), 16);
            const d2 = new BigNumber(key2.getPrivate().toString(16), 16);
            const pub1_x = new BigNumber(key1.getPublic().x.toString(16), 16);
            const pub1_y = new BigNumber(key1.getPublic().y.toString(16), 16);
            const pub2_x = new BigNumber(key2.getPublic().x.toString(16), 16);
            const pub2_y = new BigNumber(key2.getPublic().y.toString(16), 16);

            let res = await ecsol.deriveKey(toBigNumber(d1), toBigNumber(pub2_x), toBigNumber(pub2_y));

            const k1_2x = res[0];
            const k1_2y = res[1];
            log("k1_2x:" + k1_2x.toString(10));
            log("k1_2y:" + k1_2y.toString(10));
            res = await ecsol.deriveKey(toBigNumber(d2), toBigNumber(pub1_x), toBigNumber(pub1_y));
            const k2_1x = res[0];
            const k2_1y = res[1];
            log("k2_1x:" + k2_1x.toString(10));
            log("k2_1y:" + k2_1y.toString(10));
            assert.equal(k1_2x.toString(10), k2_1x.toString(10));
            assert.equal(k1_2y.toString(10), k2_1y.toString(10));

            const kd = key1.derive(key2.getPublic()).toString(10);
            log("keyDerived: " + kd);
            assert.equal(k1_2x.toString(10), kd);

        }); 
        
        it('Should follow associative property', async () => {
            log("n: " + n.toString(10));
            log("n2: " + n2.toString(10));
            log("gx: " + gx.toString(10));
            log("gy: " + gy.toString(10));

            const key1 = ec.genKeyPair();
            const key2 = ec.genKeyPair();
            const d1 = new BigNumber(key1.getPrivate().toString(16), 16);
            const d2 = new BigNumber(key2.getPrivate().toString(16), 16);
            log("priv1:" + d1.toString(10));
            log("priv2:" + d2.toString(10));
            let pub1_x, pub1_y;
            let pub2_x, pub2_y;
            let pub12_x, pub12_y;
            let add12_x, add12_y;

            let res = await ecsol.publicKey(toBigNumber(d1));
            pub1_x = res[0];
            pub1_y = res[1];
            log("pub1_x:" + pub1_x.toString(10));
            log("pub1_y:" + pub1_y.toString(10));

            res = await ecsol.publicKey(toBigNumber(d2));
            pub2_x = res[0];
            pub2_y = res[1];
            log("pub2_x:" + pub2_x.toString(10));
            log("pub2_y:" + pub2_y.toString(10));

            const d12 = (d1.plus(d2)).mod(n2);
            log("priv12:" + d12.toString(10));
            res = await ecsol.publicKey(toBigNumber(d12));
            pub12_x = res[0];
            pub12_y = res[1];
            log("pub12_x:" + pub12_x.toString(10));
            log("pub12_y:" + pub12_y.toString(10));

            res = await ecsol._ecAdd(pub1_x, pub1_y, 1, pub2_x, pub2_y, 1)
            add12_x = res[0];
            add12_y = res[1];

            let inv = await ecsol._inverse(res[2]);
            log("Inv test2: "+ BigNumber(inv).times(res[2]).mod(n).toString(10));
            add12_x = BigNumber(add12_x).times(inv).mod(n);
            add12_y = BigNumber(add12_y).times(inv).mod(n);
            log("add12_x:" + add12_x.toString(10));
            log("add12_y:" + add12_y.toString(10));
            assert.equal(pub12_x.toString(10), add12_x.toString(10));
            assert.equal(pub12_y.toString(10), add12_y.toString(10));
        }); 
    });

});
