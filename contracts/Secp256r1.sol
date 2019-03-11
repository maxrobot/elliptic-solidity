// based upon https://github.com/jbaylina/ecsol however is implementing a different curve
// secp256r1: This is an implementation of elliptic curve secp256r1 in 100% written in solidity.
pragma solidity 0.5.5;

contract Secp256r1 {

    uint256 constant gx = 0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296;
    uint256 constant gy = 0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5;
    uint256 constant n = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF;
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
    * @description performs double Jacobian as defined - https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#doubling-dbl-2001-b
    */
    function _jDouble(uint256 x1, uint256 y1, uint256 z1)
        public pure returns(uint256 x2, uint256 y2, uint256 z2)    
        // public pure returns(uint256 x2, uint256 y2, uint256 z2)    
    {
        uint256 delta = mulmod(z1, z1, n);
        uint256 gamma = mulmod(y1, y1, n);
        uint256 alpha = x1 - delta;
        if (alpha < 0) {
            alpha = alpha + n;
        }
        uint256 alpha2 = x1 + delta;
        alpha = alpha * alpha2;
        alpha2 = alpha;

        alpha = alpha << 1;
        alpha = alpha + alpha2;

        uint256 beta = x1 * gamma;

        x2 = alpha * alpha;
        uint256 beta8 = beta << 3;
        y2 = beta8;
        z2 = mulmod(beta8, 1, n);
        // x2 = x2 - beta8;
        // if (x2 < 0) {
        //     x2 = x2 + n;
        // }
        // x2 = x2 % n;
        // y2 = alpha;
        // z2 = beta;
        return (x2, y2, z2);
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