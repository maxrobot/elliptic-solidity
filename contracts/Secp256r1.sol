// based upon https://github.com/jbaylina/ecsol however is implementing a different curve
// secp256r1: This is an implementation of elliptic curve secp256r1 in 100% written in solidity.
pragma solidity 0.5.5;

import "./ECCMath.sol";

contract Secp256r1 {

    uint256 constant gx = 0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296;
    uint256 constant gy = 0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5;
    uint256 constant pp = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF;
                          
    uint256 constant n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;
    uint256 constant a = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC;
    uint256 constant b = 0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B;

    event uint256event(uint256 output);

    constructor() public {}

    function _jAdd(uint256 x1, uint256 z1, uint256 x2, uint256 z2)
        public pure returns(uint256 x3, uint256 z3)
    {
        (x3, z3) = (addmod(mulmod(z2, x1, n), mulmod(x2, z1, n), n), mulmod(z1, z2, n));
    }

    function _jSub(uint256 x1, uint256 z1, uint256 x2, uint256 z2)
        public pure returns(uint256 x3, uint256 z3)
    {
        (x3, z3) = (addmod(mulmod(z2, x1, n), mulmod(n - x2, z1, n), n), mulmod(z1, z2, n));
    }

    function _jMul(uint256 x1, uint256 z1, uint256 x2, uint256 z2)
        public pure returns(uint256 x3, uint256 z3)
    {
        (x3, z3) = (mulmod(x1, x2, n), mulmod(z1, z2, n));
    }

    function _jDiv(uint256 x1, uint256 z1, uint256 x2, uint256 z2)
        public pure returns(uint256 x3, uint256 z3)
    {
        (x3, z3) = (mulmod(x1, z2, n), mulmod(z1, x2, n));
    }

    /*
    * _jDouble
    * @description performs double Jacobian as defined - https://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-3/doubling/dbl-1998-cmo-2.op3
    */
    function _jDouble(uint p1, uint p2, uint p3)
        public pure returns(uint q1, uint q2, uint q3)    
    {
        // int val = -3;
        assembly {
            mstore(0x0200, p1)
            mstore(0x0220, p2)
            mstore(0x0240, p3)
            // mstore(0x0260, p3)
            // mstore(0x0280, p3)
            // mstore(0x02A0, p3)

            // mstore(0x0260, val)

            let pd := 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
            let xx := mulmod(p1, p1, pd) // XX = X1^2
            let yy := mulmod(p2, p2, pd) // YY = Y1^2
            let zz := mulmod(p3, p3, pd) // ZZ = Z1^2

            // let tt := mulmod(p1, yy, pd) // tt = X1*YY
            // let S := mulmod(4, tt, pd) // S = 4*t0
            let M := sub(mulmod(3, xx, pd), mulmod(3, mulmod(zz, zz, pd), pd)) // M = t3+t2 = (3*xx)+(a*t1) = (3*xx)+(a*(zz^2)))

            let T := sub(mulmod(M, M, pd), mulmod(2, mulmod(4, mulmod(p1, yy, pd), pd), pd)) // T = t4-t5 = (M^2)-(2*S)

            // q1 := T

            q2 := sub(mulmod(M, sub(mulmod(4, mulmod(p1, yy, pd), pd), T), pd), mulmod(8, mulmod(yy, yy, pd), pd)) // y3 = t9-t8 = (M*t6)-(8*t7) = (M*(S-T))-(8*(YY^2))

            // q3 := mulmod(addmod(p2, p2, pd), p3, pd) //z3 = 2*y1*z1
        }

    }

      // Implementation of http://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-0/doubling/dbl-2009-l.op3
    function dbl(uint p1, uint p2, uint p3)
        public pure returns(uint q1, uint q2, uint q3)
    {
        assembly {
            mstore(0x0200, p1)
            mstore(0x0220, p2)
            mstore(0x0240, p3)
            mstore(0x0260, q1)
            mstore(0x0280, q2)
            mstore(0x02A0, q3)
            let Pd := 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
            let axd := mload(0x0200)
            let ayd := mload(0x0220)
            //A = X1^2
            let tmp1d := mulmod(axd, axd, Pd)
            //B = Y1^2
            let tmp2d := mulmod(ayd, ayd, Pd)
            //C = B^2
            let tmp3d := mulmod(tmp2d, tmp2d, Pd)
            //t0 = X1+B
            let tmp4d := addmod(axd, tmp2d, Pd) // Since (2^256 - 1)/P ~ 5, we can afford to skip a few mod ops whenadding

            //D = 2*t3 = 2*(t2-C) = 2*(t1-A-C) = 2*((X1+B)^2-(A+C))
            tmp2d := mulmod(0x02, addmod(mulmod(tmp4d, tmp4d, Pd), sub(add(Pd, Pd), add(tmp1d, tmp3d)), Pd), Pd)

            //E = 3*A
            tmp1d := mul(0x03, tmp1d)

            //F = E^2
            tmp4d := mulmod(tmp1d, tmp1d, Pd)

            //X3 = F-2*D, X3 -> p + 0x00
            mstore(0x0260, addmod(tmp4d, sub(add(Pd, Pd), add(tmp2d, tmp2d)), Pd))

            //Y3 = t7-t6 = E*(D-X3) - 8*C, r -> p + 0x20
            mstore(0x0280, sub(mulmod(tmp1d, sub(tmp2d, mload(0x0260)), Pd), mulmod(0x08, tmp3d, Pd)))
            // mstore(0x0280, addmod(mulmod(tmp1d, add(tmp2d, sub(Pd, mload(0x0260))), Pd), sub(Pd, mulmod(0x08, tmp3d, Pd)), Pd))
            q1 := mulmod(0x08, tmp3d, Pd) // t6
            q2 := mulmod(tmp1d, sub(tmp2d, mload(0x0260)), Pd) // t7

            //Z3 = 2*t8 = 2*Y1*Z1, Z3 -> p + 0x40
            mstore(0x02A0, mulmod( 0x02, mulmod(ayd, mload(0x0240), Pd), Pd))

            q1 := mload(0x0260)
            q2 := mload(0x0280)
            q3 := mload(0x02A0)
        }
    }

    function _toJacobian(uint[3] memory P) public pure returns (uint[3] memory) {
        ECCMath.toZ1(P, pp);
        return P;        
    } 

    function _double(uint[3] memory P) public pure returns (uint[3] memory Q) {
        uint p = pp;
        assert(P[2] != 0);
        uint Px = P[0];
        uint Py = P[1];
        uint gamma = mulmod(Py, Py, p);
        uint s = mulmod(4, mulmod(Px, gamma, p), p);
        uint m = mulmod(3, mulmod(Px, Px, p), p);
        uint Qx = addmod(mulmod(m, m, p), p - addmod(s, s, p), p);
        Q[0] = Qx;
        Q[1] = addmod(mulmod(m, addmod(s, p - Qx, p), p), p - mulmod(8, mulmod(gamma, gamma, p), p), p);
        Q[2] = mulmod(2, mulmod(Py, P[2], p), p);
    }

    // Point addition, P + Q
    // inData: Px, Py, Pz, Qx, Qy, Qz
    // outData: Rx, Ry, Rz
    function _add(uint[3] memory P, uint[3] memory Q) public pure returns (uint[3] memory R) {
        assert(P[2] != 0);
        assert(Q[2] != 0);

        uint p = pp;
        uint[4] memory zs; // Pz^2, Pz^3, Qz^2, Qz^3
        zs[0] = mulmod(P[2], P[2], p);
        zs[1] = mulmod(P[2], zs[0], p);
        zs[2] = mulmod(Q[2], Q[2], p);
        zs[3] = mulmod(Q[2], zs[2], p);
        uint[4] memory us = [
            mulmod(P[0], zs[2], p),
            mulmod(P[1], zs[3], p),
            mulmod(Q[0], zs[0], p),
            mulmod(Q[1], zs[1], p)
        ]; // Pu, Ps, Qu, Qs
        if (us[0] == us[2]) {
            if (us[1] != us[3])
                return Q;
            else {
                return _double(P);
            }
        }
        uint h = addmod(us[2], p - us[0], p);
        uint r = addmod(us[3], p - us[1], p);
        uint h2 = mulmod(h, h, p);
        uint h3 = mulmod(h2, h, p);
        uint Rx = addmod(mulmod(r, r, p), p - h3, p);
        Rx = addmod(Rx, p - mulmod(2, mulmod(us[0], h2, p), p), p);
        R[0] = Rx;
        R[1] = mulmod(r, addmod(mulmod(us[0], h2, p), p - Rx, p), p);
        R[1] = addmod(R[1], p - mulmod(us[1], h3, p), p);
        R[2] = mulmod(h, mulmod(P[2], Q[2], p), p);
    }

    function _inverse(uint256 _a) public pure returns(uint256 invA) {
        uint256 t = 0;
        uint256 newT = 1;
        uint256 r = n;
        uint256 newR = _a;
        uint256 q;
        while (newR != 0) {
            q = r / newR;

            (t, newT) = (newT, addmod(t, (n - mulmod(q, newT,n)), n));
            (r, newR) = (newR, r - q * newR );
        }

        return t;
    }


    function _ecAdd(uint256 x1, uint256 y1, uint256 z1, uint256 x2, uint256 y2, uint256 z2) 
        public pure returns(uint256 x3, uint256 y3, uint256 z3)
    {
        uint256 ll;
        uint256 lz;
        uint256 da;
        uint256 db;

        if ((x1==0) && (y1==0)) {
            return (x2,y2,z2);
        }

        if ((x2==0) && (y2==0)) {
            return (x1,y1,z1);
        }

        if ((x1==x2) && (y1==y2)) {
            (ll, lz) = _jMul(x1, z1, x1, z1);
            (ll, lz) = _jMul(ll, lz, 3, 1);
            (ll, lz) = _jAdd(ll, lz, a, 1);

            (da, db) = _jMul(y1, z1, 2, 1);
        } else {
            (ll, lz) = _jSub(y2, z2, y1, z1);
            (da, db) = _jSub(x2, z2, x1, z1);
        }

        (ll, lz) = _jDiv(ll, lz, da, db);


        (x3, da) = _jMul(ll, lz, ll, lz);
        (x3, da) = _jSub(x3, da, x1, z1);
        (x3, da) = _jSub(x3, da, x2, z2);

        (y3, db) = _jSub(x1, z1, x3, da);
        (y3, db) = _jMul(y3, db, ll, lz);
        (y3, db) = _jSub(y3, db, y1, z1);


        if (da != db) {
            x3 = mulmod(x3, db, n);
            y3 = mulmod(y3, da, n);
            z3 = mulmod(da, db, n);
        } else {
            z3 = da;
        }

    }

    function _ecDouble(uint256 x1, uint256 y1, uint256 z1)
        public pure returns(uint256 x3, uint256 y3, uint256 z3)
    {
        (x3,y3,z3) = _ecAdd(x1,y1,z1,x1,y1,z1);
    }



    function _ecMul(uint256 d, uint256 x1, uint256 y1, uint256 z1)
        public pure returns(uint256 x3, uint256 y3, uint256 z3)
    {
        uint256 remaining = d;
        uint256 px = x1;
        uint256 py = y1;
        uint256 pz = z1;
        uint256 acx = 0;
        uint256 acy = 0;
        uint256 acz = 1;

        if (d==0) {
            return (0,0,1);
        }

        while (remaining != 0) {
            if ((remaining & 1) != 0) {
                (acx,acy,acz) = _ecAdd(acx,acy,acz, px,py,pz);
            }
            remaining = remaining / 2;
            (px,py,pz) = _ecDouble(px,py,pz);
        }

        (x3,y3,z3) = (acx,acy,acz);
    }

    function publicKey(uint256 privKey)
        public pure returns(uint256 qx, uint256 qy)
    {
        uint256 x;
        uint256 y;
        uint256 z;
        (x,y,z) = _ecMul(privKey, gx, gy, 1);
        z = _inverse(z);
        qx = mulmod(x, z, n);
        qy = mulmod(y, z, n);
    }

    function deriveKey(uint256 privKey, uint256 pubX, uint256 pubY)
        public pure returns(uint256 qx, uint256 qy)
    {
        uint256 x;
        uint256 y;
        uint256 z;
        (x,y,z) = _ecMul(privKey, pubX, pubY, 1);
        z = _inverse(z);
        qx = mulmod(x, z, n);
        qy = mulmod(y, z, n);
    }

}