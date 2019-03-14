package main

import (
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"

	"github.com/maxrobot/go-ethereum/common/hexutil"
)

type ECDSASignature struct {
	R, S *big.Int
}

// A invertible implements fast inverse mod Curve.Params().N
type invertible interface {
	// Inverse returns the inverse of k in GF(P)
	Inverse(k *big.Int) *big.Int
}

// combinedMult implements fast multiplication S1*g + S2*p (g - generator, p - arbitrary point)
type combinedMult interface {
	CombinedMult(bigX, bigY *big.Int, baseScalar, scalar []byte) (x, y *big.Int)
}

// Result stores multiple data structs
type Result struct {
	// Element Data `json:"element"`auto_increment:"true" increment:"1"
	Element Data `json:"test"`
}

// Data is a struct used for marshall data into a json
type Data struct {
	Input  []string `json:"input"`
	Output []string `json:"ouput"`
}

type point struct {
	X string
	Y string
	Z string
}

func main() {
	// generateTestData()
	c := elliptic.P256()

	x1, _ := hexutil.DecodeBig("0xd9e56176cf9b64d2d463285d4236ee6155a00877be3e42fbffd56dbf00b2667c")
	y1, _ := hexutil.DecodeBig("0x497b83929bd210705aff0b98f29e5609920e5ff581240c6408caa43e4f1c2e43")

	x2, _ := hexutil.DecodeBig("0xdd8b5ee06ff7c250486f2aa3e890c1117d22e3e17d15d72525a5c8422b7e019")
	y2, _ := hexutil.DecodeBig("0x469d2d76935342f5d8d399f3474f32f814a4c843a53c834cd0adbe8ca82fbc67")

	fmt.Printf("On Curve P1: %v\n", c.IsOnCurve(x1, y1))

	z1 := zForAffine(x1, y1)
	fmt.Printf("x1: %x\ny1: %x\nz1: %x\n", x1, y1, z1)

	z2 := zForAffine(x2, y2)
	fmt.Printf("x2: %x\ny2: %x\nz2: %x\n", x2, y2, z2)

	x3, y3, z3 := addJacobian(c.Params(), x1, y1, z1, x2, y2, z2)
	fmt.Println("Jacobian Addition Result:")
	fmt.Printf("x3: %x\n", x3)
	fmt.Printf("y3: %x\n", y3)
	fmt.Printf("z3: %x\n", z3)

	x3, y3, z3 = addJacobianImplementation(c.Params(), x1, y1, z1, x2, y2, z2)
	fmt.Println("Jacobian Addition Result:")
	fmt.Printf("x3: %x\n", x3)
	fmt.Printf("y3: %x\n", y3)
	fmt.Printf("z3: %x\n", z3)

}

func generateTestData() {
	c := elliptic.P256()
	var testResult []Result

	for i := 0; i <= 20; i++ {

		_, x1, y1, err := elliptic.GenerateKey(c, rand.Reader)
		if err != nil {
			fmt.Printf("Error: %x\n", err)
		}

		_, x2, y2, err := elliptic.GenerateKey(c, rand.Reader)
		if err != nil {
			fmt.Printf("Error: %x\n", err)
		}
		fmt.Printf("On Curve P1: %v\n", c.IsOnCurve(x1, y1))
		fmt.Printf("On Curve P2: %v\n", c.IsOnCurve(x2, y2))

		z1 := zForAffine(x1, y1)
		z2 := zForAffine(x2, y2)

		x3, y3, z3 := addJacobian(c.Params(), x1, y1, z1, x2, y2, z2)

		var data Data
		data.Input = append(data.Input, x1.Text(16), y1.Text(16), z1.Text(16), x2.Text(16), y2.Text(16), z2.Text(16))
		data.Output = append(data.Output, x3.Text(16), y3.Text(16), z3.Text(16))

		var newResult Result
		newResult.Element = data

		testResult = append(testResult, newResult)

		fmt.Printf("data:\n\t%s\n", testResult)

	}
	// now Marshal it
	resultOutput, err := json.Marshal(testResult)
	if err != nil {
		log.Println(err)
	}

	// // now result has your targeted JSON structure
	if err = ioutil.WriteFile("add-jacobian.json", resultOutput, 0644); err != nil {
		log.Println(err)
	}
}

// addJacobian takes two points in Jacobian coordinates, (x1, y1, z1) and
// (x2, y2, z2) and returns their sum, also in Jacobian form.
func addJacobianImplementation(curve *elliptic.CurveParams, x1, y1, z1, x2, y2, z2 *big.Int) (*big.Int, *big.Int, *big.Int) {
	// See https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#addition-add-2007-bl
	z1z1 := new(big.Int).Mul(z1, z1)
	z1z1.Mod(z1z1, curve.P)
	z2z2 := new(big.Int).Mul(z2, z2)
	z2z2.Mod(z2z2, curve.P)

	u1 := new(big.Int).Mul(x1, z2z2)
	u1.Mod(u1, curve.P)
	// fmt.Printf("u1: %x\n", u1)

	u2 := new(big.Int).Mul(x2, z1z1)
	u2.Mod(u2, curve.P)
	// fmt.Printf("u2: %x\n", u2)

	s1 := new(big.Int).Mul(y1, z2)
	s1.Mod(s1, curve.P)
	s1 = new(big.Int).Mul(s1, z2z2)
	s1.Mod(s1, curve.P)
	// fmt.Printf("s1: %x\n", s1)

	s2 := new(big.Int).Mul(y2, z1)
	s2.Mod(s2, curve.P)
	s2 = new(big.Int).Mul(s2, z1z1)
	s2.Mod(s2, curve.P)

	if u2.Cmp(u1) == -1 {
		u2.Add(u2, curve.P)
	}
	h := new(big.Int).Sub(u2, u1)
	// fmt.Printf("h: %x\n", h)

	i := new(big.Int).Mul(big.NewInt(2), h)
	i.Mod(i, curve.P)
	i = new(big.Int).Mul(i, i)
	i.Mod(i, curve.P)
	// fmt.Printf("i: %x\n", i)

	j := new(big.Int).Mul(h, i)
	j.Mod(j, curve.P)
	// fmt.Printf("j: %x\n", j)

	if s2.Cmp(s1) == -1 {
		s2.Add(s2, curve.P)
	}
	r := new(big.Int).Sub(s2, s1)
	r = new(big.Int).Mul(big.NewInt(2), r)
	r.Mod(r, curve.P)
	// fmt.Printf("r: %x\n", r)

	v := new(big.Int).Mul(u1, i)
	v.Mod(v, curve.P)
	// fmt.Printf("v: %x\n", v)

	x3 := new(big.Int).Mul(r, r)
	x3.Mod(x3, curve.P)

	jv := new(big.Int).Mul(big.NewInt(2), v)
	jv.Mod(jv, curve.P)
	jv = new(big.Int).Add(j, jv)
	jv.Mod(jv, curve.P)

	if x3.Cmp(jv) == -1 {
		x3.Add(x3, curve.P)
	}
	x3 = new(big.Int).Sub(x3, jv)

	if v.Cmp(x3) == -1 {
		v.Add(v, curve.P)
	}
	y3 := new(big.Int).Sub(v, x3)
	y3 = new(big.Int).Mul(r, y3)
	y3.Mod(y3, curve.P)
	// fmt.Printf("r*(v-x3): %x\n", y3)

	s1 = new(big.Int).Mul(s1, big.NewInt(2))
	s1.Mod(s1, curve.P)
	s1 = new(big.Int).Mul(s1, j)
	s1.Mod(s1, curve.P)
	// fmt.Printf("2*s1*j: %x\n", s1)

	if y3.Cmp(s1) == -1 {
		y3.Add(y3, curve.P)
	}
	y3 = new(big.Int).Sub(y3, s1)

	z1 = new(big.Int).Add(z1, z2)
	z1 = new(big.Int).Mul(z1, z1)
	z1.Mod(z1, curve.P)
	fmt.Printf("(z1+z2)^2:\t%x\n", z1)

	return x3, y3, big.NewInt(1)

}

// addJacobian takes two points in Jacobian coordinates, (x1, y1, z1) and
// (x2, y2, z2) and returns their sum, also in Jacobian form.
func addJacobian(curve *elliptic.CurveParams, x1, y1, z1, x2, y2, z2 *big.Int) (*big.Int, *big.Int, *big.Int) {
	// See https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#addition-add-2007-bl
	x3, y3, z3 := new(big.Int), new(big.Int), new(big.Int)
	if z1.Sign() == 0 {
		x3.Set(x2)
		y3.Set(y2)
		z3.Set(z2)
		return x3, y3, z3
	}
	if z2.Sign() == 0 {
		x3.Set(x1)
		y3.Set(y1)
		z3.Set(z1)
		return x3, y3, z3
	}

	z1z1 := new(big.Int).Mul(z1, z1)
	z1z1.Mod(z1z1, curve.P)
	z2z2 := new(big.Int).Mul(z2, z2)
	z2z2.Mod(z2z2, curve.P)

	u1 := new(big.Int).Mul(x1, z2z2)
	u1.Mod(u1, curve.P)
	u2 := new(big.Int).Mul(x2, z1z1)
	u2.Mod(u2, curve.P)
	h := new(big.Int).Sub(u2, u1)
	xEqual := h.Sign() == 0
	if h.Sign() == -1 {
		h.Add(h, curve.P)
	}
	i := new(big.Int).Lsh(h, 1)
	i.Mul(i, i)
	j := new(big.Int).Mul(h, i)

	s1 := new(big.Int).Mul(y1, z2)
	s1.Mul(s1, z2z2)
	s1.Mod(s1, curve.P)
	s2 := new(big.Int).Mul(y2, z1)
	s2.Mul(s2, z1z1)
	s2.Mod(s2, curve.P)
	r := new(big.Int).Sub(s2, s1)
	if r.Sign() == -1 {
		r.Add(r, curve.P)
	}
	yEqual := r.Sign() == 0
	if xEqual && yEqual {
		return doubleJacobian(curve, x1, y1, z1)
	}
	r.Lsh(r, 1)
	v := new(big.Int).Mul(u1, i)

	x3.Set(r)
	x3.Mul(x3, x3)
	x3.Sub(x3, j)
	x3.Sub(x3, v)
	x3.Sub(x3, v)
	x3.Mod(x3, curve.P)

	y3.Set(r)
	v.Sub(v, x3)
	y3.Mul(y3, v)
	s1.Mul(s1, j)
	s1.Lsh(s1, 1)
	y3.Sub(y3, s1)
	y3.Mod(y3, curve.P)

	z3.Add(z1, z2)
	z3.Mul(z3, z3)
	z3.Sub(z3, z1z1)
	z3.Sub(z3, z2z2)
	z3.Mul(z3, h)
	z3.Mod(z3, curve.P)

	return x3, y3, z3
}

// doubleJacobian takes a point in Jacobian coordinates, (x, y, z), and
// returns its double, also in Jacobian form.
func doubleJacobian(curve *elliptic.CurveParams, x, y, z *big.Int) (*big.Int, *big.Int, *big.Int) {
	// See https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#doubling-dbl-2001-b
	delta := new(big.Int).Mul(z, z)
	delta.Mod(delta, curve.P)
	gamma := new(big.Int).Mul(y, y)
	gamma.Mod(gamma, curve.P)
	alpha := new(big.Int).Sub(x, delta)
	if alpha.Sign() == -1 {
		alpha.Add(alpha, curve.P)
	}
	alpha2 := new(big.Int).Add(x, delta)
	alpha.Mul(alpha, alpha2)
	alpha2.Set(alpha)
	alpha.Lsh(alpha, 1)
	alpha.Add(alpha, alpha2)

	beta := alpha2.Mul(x, gamma)

	x3 := new(big.Int).Mul(alpha, alpha)
	beta8 := new(big.Int).Lsh(beta, 3)
	beta8.Mod(beta8, curve.P)
	x3.Sub(x3, beta8)
	if x3.Sign() == -1 {
		x3.Add(x3, curve.P)
	}
	x3.Mod(x3, curve.P)

	z3 := new(big.Int).Add(y, z)
	z3.Mul(z3, z3)
	z3.Sub(z3, gamma)
	if z3.Sign() == -1 {
		z3.Add(z3, curve.P)
	}
	z3.Sub(z3, delta)
	if z3.Sign() == -1 {
		z3.Add(z3, curve.P)
	}
	z3.Mod(z3, curve.P)

	beta.Lsh(beta, 2)
	beta.Sub(beta, x3)
	if beta.Sign() == -1 {
		beta.Add(beta, curve.P)
	}
	y3 := alpha.Mul(alpha, beta)

	gamma.Mul(gamma, gamma)
	gamma.Lsh(gamma, 3)
	gamma.Mod(gamma, curve.P)

	y3.Sub(y3, gamma)
	if y3.Sign() == -1 {
		y3.Add(y3, curve.P)
	}
	y3.Mod(y3, curve.P)

	return x3, y3, z3
}

func zForAffine(x, y *big.Int) *big.Int {
	z := new(big.Int)
	if x.Sign() != 0 || y.Sign() != 0 {
		z.SetInt64(1)
	}
	return z
}

func checkSize(a *big.Int) {
	length := a.BitLen()
	if length > 256 {
		fmt.Printf("Value:\t%x\n", a)
	}
}

func hashToInt(hash []byte, c elliptic.Curve) *big.Int {
	// orderBits := c.Params().N.BitLen()
	// orderBytes := (orderBits + 7) / 8

	orderBits := 256
	orderBytes := (orderBits + 7) / 8

	fmt.Printf("Orderbits: %v\n", orderBits)
	fmt.Printf("Orderbytes: %v\n", orderBytes)

	if len(hash) > orderBytes {
		hash = hash[:orderBytes]
	}

	ret := new(big.Int).SetBytes(hash)
	excess := len(hash)*8 - orderBits
	if excess > 0 {
		fmt.Println("excess > 0")
		ret.Rsh(ret, uint(excess))
	}
	return ret
}
