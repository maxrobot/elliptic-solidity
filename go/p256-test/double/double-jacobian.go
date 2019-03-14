package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"
	"os"

	"github.com/gogo/protobuf/proto"
	"github.com/hyperledger/fabric/common/util"
	pb "github.com/hyperledger/fabric/protos/common"
	"github.com/hyperledger/fabric/protos/utils"
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
	c := elliptic.P256()

	x1, _ := hexutil.DecodeBig("0xd9e56176cf9b64d2d463285d4236ee6155a00877be3e42fbffd56dbf00b2667c")
	y1, _ := hexutil.DecodeBig("0x497b83929bd210705aff0b98f29e5609920e5ff581240c6408caa43e4f1c2e43")

	fmt.Printf("On Curve P1: %v\n", c.IsOnCurve(x1, y1))

	z1 := zForAffine(x1, y1)
	fmt.Printf("x1: %x\ny1: %x\nz1: %x\n", x1, y1, z1)

	x3, y3, z3 := mdoubleJacobian2007(c.Params(), x1, y1, z1)
	fmt.Println("Double Jacobian2007 Result:")
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

		fmt.Printf("On Curve P1: %v\n", c.IsOnCurve(x1, y1))

		z1 := zForAffine(x1, y1)

		x3, y3, z3 := mdoubleJacobian2007(c.Params(), x1, y1, z1)

		var data Data
		data.Input = append(data.Input, x1.Text(16), y1.Text(16), z1.Text(16))
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
	if err = ioutil.WriteFile("double-jacobian.json", resultOutput, 0644); err != nil {
		log.Println(err)
	}
}

func zForAffine(x, y *big.Int) *big.Int {
	z := new(big.Int)
	if x.Sign() != 0 || y.Sign() != 0 {
		z.SetInt64(1)
	}
	return z
}

func retrieveBlockData(path string) []byte {
	// Read the existing block
	in, err := ioutil.ReadFile(path)
	if err != nil {
		fmt.Printf("Error reading file: %v", err)
		os.Exit(1)
	}

	// Unmarshall block according to protocol buffer
	block := &pb.Block{}
	if err := proto.Unmarshal(in, block); err != nil {
		fmt.Printf("Failed to parse address book: %v", err)
		os.Exit(1)
	}

	// Retrieve metadata
	metadata, err := utils.GetMetadataFromBlock(block, pb.BlockMetadataIndex_SIGNATURES)
	if err != nil {
		fmt.Printf("Failed unmarshalling medatata for signatures [%s]", err)
		os.Exit(1)
	}

	// Retrieve the signature from the block
	metadataSignature := metadata.Signatures[0]
	signedData := util.ConcatenateBytes(metadata.Value, metadataSignature.SignatureHeader, block.Header.Bytes())

	return signedData
}

// MyVerify verifies the signature in r, s of hash using the public key, pub. Its
// return value records whether the signature is valid.
func MyVerify(pub *ecdsa.PublicKey, hash []byte, r, s *big.Int) bool {
	fmt.Printf("Signature Values:\n\tR: %x\n\tS: %x\n", r, s)

	// See [NSA] 3.4.2
	c := pub.Curve
	N := c.Params().N
	fmt.Printf("Elliptic Curve Order:\n\tOrder: %x\n", N)

	if r.Sign() <= 0 || s.Sign() <= 0 {
		return false
	}
	if r.Cmp(N) >= 0 || s.Cmp(N) >= 0 {
		return false
	}
	e := hashToInt(hash, c)
	fmt.Printf("HashToInt:\n\tHash: %x\n\tInt: %x\n", hash, e)

	var w *big.Int
	if in, ok := c.(invertible); ok {
		w = in.Inverse(s)
	} else {
		w = new(big.Int).ModInverse(s, N)
	}
	fmt.Printf("W: %x\n", w)

	u1 := e.Mul(e, w)
	u1.Mod(u1, N)
	u2 := w.Mul(r, w)
	u2.Mod(u2, N)

	// Check if implements S1*g + S2*p
	var x, y *big.Int
	if opt, ok := c.(combinedMult); ok {
		x, y = opt.CombinedMult(pub.X, pub.Y, u1.Bytes(), u2.Bytes())
	} else {
		x1, y1 := c.ScalarBaseMult(u1.Bytes())
		x2, y2 := c.ScalarMult(pub.X, pub.Y, u2.Bytes())
		x, y = c.Add(x1, y1, x2, y2)
	}

	if x.Sign() == 0 && y.Sign() == 0 {
		return false
	}
	x.Mod(x, N)
	return x.Cmp(r) == 0
}

func mdoubleJacobian2007(curve *elliptic.CurveParams, x, y, z *big.Int) (*big.Int, *big.Int, *big.Int) {
	// See https://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-3/doubling/mdbl-2007-bl.op3
	x1 := x
	y1 := y
	z1 := z

	xx := new(big.Int).Mul(x1, x1)
	xx.Mod(xx, curve.P)

	yy := new(big.Int).Mul(y1, y1)
	yy.Mod(yy, curve.P)

	yyyy := new(big.Int).Mul(yy, yy)
	yyyy.Mod(yyyy, curve.P)

	t0 := new(big.Int).Add(x1, yy)
	t0.Mod(t0, curve.P)

	t1 := new(big.Int).Mul(t0, t0)
	t1.Mod(t1, curve.P)

	if t1.Cmp(xx) == -1 {
		t1.Add(t1, curve.P)
	}
	t2 := new(big.Int).Sub(t1, xx)
	// fmt.Printf("t2: %x\n", t2)

	if t2.Cmp(yyyy) == -1 {
		t2.Add(t2, curve.P)
	}
	t3 := new(big.Int).Sub(t2, yyyy)
	// fmt.Printf("t3: %x\n", t3)

	s := new(big.Int).Mul(big.NewInt(2), t3)
	s.Mod(s, curve.P)
	// fmt.Printf("s: %x\n", s)

	t4 := new(big.Int).Mul(big.NewInt(3), xx)
	t4.Mod(t4, curve.P)
	// fmt.Printf("t4: %x\n", t4)

	m := new(big.Int).Sub(t4, big.NewInt(3))
	m.Mod(m, curve.P)
	// fmt.Printf("m: %x\n", m)

	t5 := new(big.Int).Mul(m, m)
	t5.Mod(t5, curve.P)
	// fmt.Printf("t5: %x\n", t5)

	t6 := new(big.Int).Mul(big.NewInt(2), s)
	t6.Mod(t6, curve.P)
	// fmt.Printf("t6: %x\n", t6)

	if t5.Cmp(t6) == -1 {
		t5.Add(t5, curve.P)
	}
	tt := new(big.Int).Sub(t5, t6)
	x3 := tt
	// fmt.Printf("tt: %x\n", tt)

	if s.Cmp(tt) == -1 {
		s.Add(s, curve.P)
	}
	t7 := new(big.Int).Sub(s, tt)
	// t7.Mod(t7, curve.P)
	// fmt.Printf("t7: %x\n", t7)

	t8 := new(big.Int).Mul(big.NewInt(8), yyyy)
	t8.Mod(t8, curve.P)
	// fmt.Printf("t8: %x\n", t8)

	t9 := new(big.Int).Mul(m, t7)
	t9.Mod(t9, curve.P)
	// fmt.Printf("t9: %x\n", t9)

	if t9.Cmp(t8) == -1 {
		t9.Add(t9, curve.P)
	}
	y3 := new(big.Int).Sub(t9, t8)
	// y3.Mod(y3, curve.P)
	// fmt.Printf("y3: %x\n", y3)

	z3 := new(big.Int).Mul(big.NewInt(2), y1)
	z3 = new(big.Int).Mul(z3, z1)
	z3.Mod(z3, curve.P)

	return x3, y3, z3

}

func doubleJacobian2001(curve *elliptic.CurveParams, x, y, z *big.Int) (*big.Int, *big.Int, *big.Int) {
	// See https://hyperelliptic.org/EFD/g1p/auto-code/shortw/jacobian-3/doubling/dbl-2001-b.op3
	x1 := x
	y1 := y
	z1 := z

	delta := new(big.Int).Mul(z1, z1)
	delta.Mod(delta, curve.P)

	gamma := new(big.Int).Mul(y1, y1)
	gamma.Mod(gamma, curve.P)

	beta := new(big.Int).Mul(x1, gamma)
	beta.Mod(beta, curve.P)

	t0 := new(big.Int).Sub(x1, delta)
	if t0.Sign() == -1 {
		t0.Add(t0, curve.P)
	}
	t0.Mod(t0, curve.P)

	t1 := new(big.Int).Add(x1, delta)
	t2 := new(big.Int).Mul(t0, t1)
	t2.Mod(t2, curve.P)

	alpha := new(big.Int).Mul(big.NewInt(3), t2)
	alpha.Mod(alpha, curve.P)

	t3 := new(big.Int).Mul(alpha, alpha)
	t3.Mod(t3, curve.P)

	t4 := new(big.Int).Mul(big.NewInt(8), beta)
	t4.Mod(t4, curve.P)

	X3 := new(big.Int).Sub(t3, t4)

	t5 := new(big.Int).Add(y1, z1)
	t5.Mod(t5, curve.P)

	t6 := new(big.Int).Mul(t5, t5)
	t6.Mod(t6, curve.P)

	t7 := new(big.Int).Sub(t6, gamma)
	t7.Mod(t7, curve.P)

	Z3 := new(big.Int).Sub(t7, delta)

	t8 := new(big.Int).Mul(big.NewInt(4), beta)
	t8.Mod(t8, curve.P)
	t9 := new(big.Int).Sub(t8, X3)
	t10 := new(big.Int).Mul(gamma, gamma)
	t10.Mod(t10, curve.P)

	t11 := new(big.Int).Mul(big.NewInt(8), t10)
	t11.Mod(t11, curve.P)

	t12 := new(big.Int).Mul(alpha, t9)
	t12.Mod(t12, curve.P)

	Y3 := new(big.Int).Sub(t12, t11)
	if Y3.Sign() == -1 {
		Y3.Add(Y3, curve.P)
	}

	return X3, Y3, Z3

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
