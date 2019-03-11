package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/asn1"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"math/big"
	"os"

	"github.com/gogo/protobuf/proto"
	"github.com/hyperledger/fabric/common/util"
	pb "github.com/hyperledger/fabric/protos/common"
	"github.com/hyperledger/fabric/protos/utils"
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

func main() {
	certFile := "/home/user97/go/src/github.com/hyperledger/fabric-samples/first-network/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/keystore/b6e87d2360839ce311ce3b021da9866c76413fdf988f481d95761b2cf2c8f030_sk"
	blockPath := "/home/user97/go/src/github.com/maxrobot/protobuf/fabric-block/mychannel_newest.block"

	cf, e := ioutil.ReadFile(certFile)
	if e != nil {
		fmt.Println("cfload:", e.Error())
		os.Exit(1)
	}
	fmt.Printf("Certificate:\n%s\n", cf)

	block, _ := pem.Decode(cf)
	// block, _ := pem.Decode([]byte(pemBytes))
	fmt.Printf("Block :  : %x\n\n", block)

	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	fmt.Printf("Public Key :  : %x\n\n", key)
	pkey := key.(*ecdsa.PrivateKey)

	// Retrieve block data as performed by the orderer and sign
	msg := retrieveBlockData(blockPath)
	hash := sha256.Sum256(msg)

	r, s, err := ecdsa.Sign(rand.Reader, pkey, hash[:])
	if err != nil {
		panic(err)
	}

	sig, err := asn1.Marshal(ECDSASignature{r, s})
	fmt.Printf("signature: %x\n", sig)

	fmt.Printf("signer: %x\n", &pkey.PublicKey)

	valid := MyVerify(&pkey.PublicKey, hash[:], r, s)
	fmt.Println("signature verified:", valid)
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
