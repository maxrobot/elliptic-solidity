// Copyright (c) 2016-2019 Clearmatics Technologies Ltd
// SPDX-License-Identifier: LGPL-3.0+

// const Web3 = require('web3');
// const Web3Utils = require('web3-utils');
// const BigNumber = require('bignumber.js');

// const Verify = artifacts.require("Verify");

// // const web3 = new Web3();
// // web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

// require('chai')
//  .use(require('chai-as-promised'))
//  .should();

// contract('Verify.js', (accounts) => {
  
//   let verify;

//   beforeEach('setup contract for each test', async function () {
//     verify = await Verify.new();
//   })

//   describe('Verify Signature', () => {
//     it('Submit functioning r and s', async () => {
//         let r = new BigNumber('19cd256e1c57ff3d339bf91b1ff6f2d53fba872d75297e48fa84f6122f08a081', 16);
//         let s = new BigNumber('c29cca5c36ea99fa93b32e13f67b2ecf083a076ec735b3bdd298260045b1a282', 16);
//         tx = await verify.verifySignature(r, s);
//     })
//   })

//   describe('Pass Incorrect Argument Types', () => {
//     it('Failure: Pass Negative Integer', async () => {
//         let r = new BigNumber(100);
//         let s = new BigNumber(100);
//         tx = await verify.verifySignature(r, s);
//     })

//     it('Failure: r greater than EC order', async () => {
//         var n = new BigNumber('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F', 16);
//         // let r = new BigNumber('ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632552', 16);
//         let s = new BigNumber(100);
//         await verify.verifySignature(n, s);
//         // await verify.verifySignature(n, s).should.be.rejected;

//     })


//   })

// });
