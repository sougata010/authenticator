#include "../include/time_interval.hpp"
#include "../include/base32_reader.hpp"
#include "../include/hmac_sha1.hpp"

uint32_t generate_totp(const std::vector<uint8_t>& secret_key) {
    std::vector<uint8_t> time_bytes = time_interval();
    std::vector<uint8_t> hash = hmac_sha1(secret_key, time_bytes);
    int offset = hash[hash.size() - 1] & 0x0F;
    uint32_t binary = 
        ((hash[offset] & 0x7F) << 24) |
        ((hash[offset + 1] & 0xFF) << 16) |
        ((hash[offset + 2] & 0xFF) << 8) |
        (hash[offset + 3] & 0xFF);

    uint32_t otp = binary % 1000000;
    return otp;
}