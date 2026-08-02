# 🔐 C++ TOTP Authenticator Engine

A lightweight, zero-external-dependency C++ implementation of the **Time-based One-Time Password (TOTP)** algorithm compliant with **RFC 6238**, **RFC 4226**, and **RFC 4648**.

This engine generates live 6-digit 2-Factor Authentication (2FA) verification codes compatible with Google Authenticator, Authy, 1Password, and Microsoft Authenticator.

---

## ✨ Features

- **Zero External Dependencies**: Built strictly using standard C++ STL (`<vector>`, `<string>`, `<cstdint>`, `<ctime>`). No OpenSSL, Boost, or Crypto++ required.
- **Base32 Decoder**: Implements RFC 4648 Base32 decoding, automatically sanitizing space, hyphen, and padding characters.
- **Pure C++ SHA-1 Digest Engine**: Custom implementation of the SHA-1 cryptographic hash algorithm.
- **HMAC-SHA1 Implementation**: Implements RFC 2104 Keyed-Hash Message Authentication.
- **Time Window Counter**: Calculates 30-second UNIX epoch time steps into 8-byte big-endian buffers.
- **Dynamic Truncation**: Extracts 31-bit binary codes and applies modulo $10^6$ to compute live 6-digit TOTP passcodes.

---

## 📁 Repository Structure

```
authenticator/
├── core/
│   ├── include/
│   │   ├── authenticator.hpp    # TOTP code generator function declaration
│   │   ├── base32_reader.hpp    # Base32 decoding utility header
│   │   ├── hmac_sha1.hpp        # SHA-1 & HMAC-SHA1 algorithm header
│   │   └── time_interval.hpp    # UNIX epoch 30s counter generator header
│   └── src/
│       ├── authenticator.cpp    # TOTP core computation & dynamic truncation
│       ├── base32_reader.cpp    # RFC 4648 Base32 decoding implementation
│       ├── hmac_sha1.cpp        # SHA-1 hash engine & HMAC computation
│       ├── time_interval.cpp    # Time interval buffer creation
│       └── main.cpp             # CLI Test runner & demonstration entry point
├── .gitignore
└── README.md
```

---

## 🛠️ Build & Run Instructions

### Prerequisites
- A C++17 compliant compiler (`g++`, `clang++`, or MSVC `cl.exe`).

### Compilation

You can compile all source files directly using standard `g++`:

```bash
g++ -std=c++17 core/src/*.cpp -Icore/include -o authenticator
```

Alternatively, compile specific source files:

```bash
g++ -std=c++17 core/src/main.cpp core/src/authenticator.cpp core/src/base32_reader.cpp core/src/hmac_sha1.cpp core/src/time_interval.cpp -Icore/include -o authenticator
```

### Running the Executable

**On Windows:**
```powershell
.\authenticator.exe
```

**On Linux / macOS:**
```bash
./authenticator
```

### Sample Output

```text
--- TOTP ENGINE TEST ---
Decoded Secret: 48 65 6C 6C 6F 21 DE AD BE EF 
Time Array    : 00 00 00 00 03 8C 3A 56 
------------------------
Your Live TOTP Code: 469253
------------------------
```

---

## 💡 How It Works

1. **Secret Decoding**: The input Base32 secret string (e.g. `JBSWY3DPEHPK3PXP`) is mapped into a raw byte vector.
2. **Time Interval Calculation**:
   $$\text{Counter} = \lfloor \frac{\text{Current UNIX Epoch Time}}{30} \rfloor$$
   The counter is converted to an 8-byte big-endian array.
3. **HMAC-SHA1 Hash**: The byte array is hashed together with the secret key using HMAC-SHA1 to produce a 20-byte digest.
4. **Dynamic Truncation**:
   - Offset is derived from the low 4 bits of the digest's last byte: $\text{offset} = \text{hash}[19] \ \& \ 0x0F$.
   - A 31-bit integer is extracted starting from `hash[offset]`.
5. **OTP Generation**: The integer is reduced modulo $10^6$ and padded to 6 digits.

---

## 📜 Standards & References

- **RFC 6238**: [TOTP: Time-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc6238)
- **RFC 4226**: [HOTP: An HMAC-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc4226)
- **RFC 4648**: [The Base16, Base32, and Base64 Data Encodings](https://datatracker.ietf.org/doc/html/rfc4648)
- **RFC 2104**: [HMAC: Keyed-Hashing for Message Authentication](https://datatracker.ietf.org/doc/html/rfc2104)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
