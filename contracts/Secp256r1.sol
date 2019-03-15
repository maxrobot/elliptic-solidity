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

    function Add(uint p1, uint p2, uint q1, uint q2) 
        public pure returns(uint, uint)
    {
        uint p3;
        (p1, p2, p3) = _jAdd(p1, p2, uint(1), q1, q2, uint(1));

        return (p1, p2);
    }

    function Double(uint p1, uint p2) 
        public pure returns(uint, uint)
    {
        uint p3;
        (p1, p2, p3) = _jDouble(p1, p2, uint(1));

        return (p1, p2);
    }

    /*
    * _jAdd
    * @description performs double Jacobian as defined - https://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-3/doubling/mdbl-2007-bl.op3
    */
    function _jAdd(uint p1, uint p2, uint p3, uint q1, uint q2, uint q3)
        public pure returns(uint r1, uint r2, uint r3)    
    {
        if (p3==0) {
            r1 = q1;
            r2 = q2;
            r3 = q3;

            return (r1, r2, r3);

        } else if (q3==0) {
            r1 = p1;
            r2 = p2;
            r3 = p3;

            return (r1, r2, r3);
        }

        assembly {
            let pd := 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
            let z1z1 := mulmod(p3, p3, pd) // Z1Z1 = Z1^2
            let z2z2 := mulmod(q3, q3, pd) // Z2Z2 = Z2^2

            let u1 := mulmod(p1, z2z2, pd) // U1 = X1*Z2Z2
            let u2 := mulmod(q1, z1z1, pd) // U2 = X2*Z1Z1

            let s1 := mulmod(p2, mulmod(z2z2, q3, pd), pd) // S1 = Y1*Z2*Z2Z2
            let s2 := mulmod(q2, mulmod(z1z1, p3, pd), pd) // S2 = Y2*Z1*Z1Z1

            mstore(0x02A0, addmod(p3, q3, pd))

            if lt(u2, u1) {
                u2 := add(pd, u2) // u2 = u2+pd
            }
            let h := sub(u2, u1) // H = U2-U1

            let i := mulmod(mulmod(0x02, h, pd), mulmod(0x02, h, pd), pd) // I = (2*H)^2

            let j := mulmod(h, i, pd) // J = H*I
            if lt(s2, s1) {
                s2 := add(pd, s2) // u2 = u2+pd
            }
            let rr := mulmod(0x02, sub(s2, s1), pd) // r = 2*(S2-S1)

            let v := mulmod(u1, i, pd) // V = U1*I
            r1 := mulmod(rr, rr, pd) // X3 = R^2

            mstore(0x0260, addmod(j, mulmod(0x02, v, pd), pd)) // I = J+(2*V)
            if lt(r1, mload(0x0260)) {
                r1 := add(pd, r1) // X3 = X3+pd
            }
            r1 := sub(r1, mload(0x0260))

            // Y3 = r*(V-X3)-2*S1*J
            mstore(0x0220, mulmod(0x02, s1, pd))
            mstore(0x0220, mulmod(mload(0x0220), j, pd))

            if lt(v, r1) {
                v := add(pd, v)
            }
            mstore(0x0240, sub(v, r1))
            mstore(0x0240, mulmod(rr, mload(0x240), pd))

            if lt(mload(0x0240), mload(0x0220)) {
                mstore(0x0240, add(mload(0x0240), pd))
            }
            mstore(0x0240, sub(mload(0x0240), mload(0x0220)))
            r2 := mload(0x0240)

            // Z3 = ((Z1+Z2)^2-Z1Z1-Z2Z2)*H
            z1z1 := addmod(z1z1, z2z2, pd)
            mstore(0x0260, mulmod(mload(0x02A0), mload(0x02A0), pd))
            // r3 := mload(0x0260)
            if lt(mload(0x0260), z1z1) {
                mstore(0x0260, add(pd, mload(0x0260)))
            }
            r3 := mulmod(sub(mload(0x0260), z1z1), h, pd)
        }

        return (r1, r2, r3);
    }

    /*
    * _jDouble
    * @description performs double Jacobian as defined - https://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-3/doubling/mdbl-2007-bl.op3
    */
    function _jDouble(uint p1, uint p2, uint p3)
        public pure returns(uint q1, uint q2, uint q3)    
    {
        assembly {
            let pd := 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
            let xx := mulmod(p1, p1, pd) // XX = X1^2
            let yy := mulmod(p2, p2, pd) // YY = Y1^2
            let yyyy := mulmod(yy, yy, pd) // YYYY = YY^2

            let t := mulmod(addmod(p1, yy, pd), addmod(p1, yy, pd), pd) // t1 = t0^2 = (X1+YY)^2
            if lt(mulmod(addmod(p1, yy, pd), addmod(p1, yy, pd), pd), xx) {
                t := add(mulmod(addmod(p1, yy, pd), addmod(p1, yy, pd), pd), pd) // t1 = ((X1+YY)^2)+pd
            }
            t := sub(t, xx) // t2 = t1-XX
            
            if lt(t, yyyy) {
                t := add(t, pd) // t2 = t2+pd
            }
            t := sub(t, yyyy) // t3 = t2-YYYY

            let s := mulmod(0x02, t, pd) // S = 2*t3
            t := mulmod(0x03, xx, pd) // t4 = 3*XX
            let m := sub(t, 3) // M = t4 + a = t4 + (-3) = t4 - 3

            let tt := sub(mulmod(m, m, pd), mulmod(0x02, s, pd)) // T = t5 - t6 = (M^2) - (2*S)
            if lt(mulmod(m, m, pd), mulmod(0x02, s, pd)) {
                tt := sub(add(pd, mulmod(m, m, pd)), mulmod(0x02, s, pd))
            }
            q1 := tt // X3 = T

            if lt(s, tt) {
                s := add(pd, s)
            }

            let t9 := mulmod(m, sub(s, tt), pd)
            if lt(t9, mulmod(0x08, yyyy, pd)) {
                t9 := add(pd, t9)
            }

            q2 := sub(t9, mulmod(0x08, yyyy, pd)) // Y3 = t9 - t8 = (M*t7)-(8*YYYY) = (M*(S-T))-(8*YYYY)
            
            q3 := mulmod(0x02, p2, pd) // Z3 = 2*Y1
        }
    }

}